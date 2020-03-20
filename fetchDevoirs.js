const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const doubleDigits = require("double-digit");
const matieresFormatees = require("./matieres.json");
const formatMatiere = (nom, reverse) => {
    let data = matieresFormatees.find(d => (reverse ? d[1] : d[0]) === nom);
    if (data) {
        return reverse ? data[0] : data[1];
    }
    return reverse
        ? nom
        : nom.charAt(0).toUpperCase() + nom.substr(1, nom.length).toLowerCase();
};

const dateAndTime = require("date-and-time");
require("date-and-time/locale/fr");
dateAndTime.locale("fr");

const timeout = 120000;

const entLoginURL = "https://cas.ecollege.haute-garonne.fr/login?selection=ATS_parent_eleve&service=https%3A%2F%2Fadrienne-bolland.ecollege.haute-garonne.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT&submit=Valider";
const devoirsPage = "https://adrienne-bolland.ecollege.haute-garonne.fr/sg.do?PROC=TRAVAIL_A_FAIRE&ACTION=AFFICHER_ELEVES_TAF&filtreAVenir=true";

module.exports = (entUsername, entPassword) => {
    return new Promise(async (resolve, reject) => {
        const startAt = Date.now();
        const browser = await puppeteer.launch({
            args: [ "--no-sandbox" ]
        });
        browser.on("disconnected", () => {
            console.log(`Browser closed. (session=${entUsername})`);
        });
        const page = await browser.newPage();
        console.log(`Browser opened. (session=${entUsername})`);
        let navPromise = page.waitForSelector("#username", {
            timeout
        });
        await page.goto(entLoginURL);
        navPromise.then(async () => {
            await page.type("#username", entUsername);
            await page.type("#password", entPassword);
            console.log(`Credentials typed. (session=${entUsername})`);
            navPromise = page.waitForNavigation({
                waitUntil: "networkidle0",
                timeout
            });
            await page.$eval("#button-submit", form => form.click());
            navPromise.then(async () => {
                const navPromise = page.waitForNavigation({
                    waitUntil: "networkidle0",
                    timeout
                });
                page.goto(devoirsPage);
                await navPromise;
                const $ = cheerio.load(await page.content());
                const devoirsLength = $(".js-taf__content").length;
                const devoirs = [];
                for(let i = 0; i < devoirsLength; i++){
                    const rawDate = $(".js-taf__content").get(i).children[3].children[1].children[0].data.trim().split(" ").splice(1, 3).join(" ");
                    const date = new Date(dateAndTime.parse(rawDate, "D MMMM YYYY"));
                    devoirs.push({
                        matiere: formatMatiere($(".js-taf__content").get(i).children[1].children[1].children[1].children[0].data.trim()),
                        content: $(".js-taf__content").get(i).children[1].children[1].children[3].children[0].data.trim(),
                        date: date.getDate()+"/"+doubleDigits(date.getMonth()+1)
                    });
                }
                resolve(devoirs);
                await browser.close();
            }).catch(async (e) => {
                console.error(e);
                await browser.close();
                reject("unreachable (step=form-submit)");
            });
        }).catch(async (e) => {
            console.error(e);
            await browser.close();
            reject("unreachable (step=login-page)");
        });
    });
};
