const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const timeout = 120000;

const entLoginURL = "https://cas.ecollege.haute-garonne.fr/login?selection=ATS_parent_eleve&service=https%3A%2F%2Fadrienne-bolland.ecollege.haute-garonne.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT&submit=Valider";
const devoirsPage = "https://adrienne-bolland.ecollege.haute-garonne.fr/sg.do?PROC=TRAVAIL_A_FAIRE&ACTION=AFFICHER_ELEVES_TAF&filtreAVenir=true";

module.exports = (entUsername, entPassword) => {
    return new Promise(async (resolve, reject) => {
        const startAt = Date.now();
        const browser = await puppeteer.launch({
            args: [ "--no-sandbox" ],
            headless: false
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
                    const rawDetail = $(".js-taf__modal-content").get(i);
                    const rawRowFull = rawDetail.children[1];
                    const matiereName = rawRowFull.children[1].children[1].children[1].children[0].data.trim();
                    const aRendre = rawRowFull.children[3].children[1].children[1].children[1].children[0].data.trim();
                    const donneLe = rawRowFull.children[3].children[1].children[3].children[1].children[0].data.trim();
                    const rawSmallDetails = $(".text--slate-darker.js-taf__modal-trigger").get(i);
                    const contenu = rawSmallDetails.children[3].children[0].data.trim();
                    const rawJumboFiles = rawDetail.children[7];
                    const files = [];
                    if(rawJumboFiles){
                        const jumboFiles = rawJumboFiles.children[5].children.filter((child) => child.attribs);
                        jumboFiles.forEach((file) => {
                            const fileTitle = file.children[1].children[0].data.trim();
                            const fileLink = `https://adrienne-bolland.ecollege.haute-garonne.fr${file.children[1].attribs.href}`;
                            const fileSize = (parseInt(file.children[3].children[1].children[7].children[0].data.trim()) / 1000000).toFixed(1).toString().replace(".", ",")+" Mo";
                            files.push({
                                title: fileTitle,
                                link: fileLink,
                                size: fileSize
                            });
                        });
                    }
                    devoirs.push({
                        matiereName,
                        donneLe,
                        aRendre,
                        contenu,
                        files
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
