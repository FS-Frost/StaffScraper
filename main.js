const dateFormat = require("dateformat");
const fs = require("fs");
const puppeteer = require("puppeteer");

let scrape = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("http://www.syncrajo.net/p/puestos-clave-auxiliares-del-fansub.html");
    console.log("Page loaded.");
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    const result = await page.evaluate(() => {
        console.log("Evaluating page...");

        function getMembers(tableId) {
            let members = [];
            const tables = document.querySelectorAll(`#${tableId} table table`);

            for (let i = 0; i < tables.length; i++) {
                const table = tables[i];
                const rows = table.querySelectorAll("tr td");
                const avatar = table.parentElement.previousElementSibling.firstElementChild.getAttribute("src");
                let member = {
                    avatar: avatar
                };

                for (let u = 0; u < rows.length; u++) {
                    const prop = rows[u].innerText;
                    const val = rows[u + 1].innerText;
                    member[prop] = val;
                    u++;
                }

                members.push(member);
            }

            return members;
        }

        const members = {
            active: getMembers("table-active-members"),
            retired: getMembers("table-retired-members"),
            past: getMembers("table-past-members")
        };

        return members;
    });

    browser.close();
    return result;
};

scrape().then((data) => {
    const date = dateFormat(new Date(), "dd-mm-yyyy");
    const dir = "results";
    const fileName = `${dir}/Sync-Staff (${date}).json`;
    const jsonString = JSON.stringify(data, null, 4);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    fs.writeFile(fileName, jsonString, (err) => {
        if (err) {
            return console.log(err);
        }

        console.log(`Results saved: ${fileName}`);
    });
});
