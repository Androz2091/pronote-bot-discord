const fetch = require("node-fetch");
const jszip  = require("jszip");
const fs = require("fs");

function cmpVersions (a, b) {
    let i, diff;
    let regExStrip0 = /(\.0+)+$/;
    let segmentsA = a.replace(regExStrip0, "").split(".");
    let segmentsB = b.replace(regExStrip0, "").split(".");
    let l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff) {
            return diff;
        }
    }
    return segmentsA.length - segmentsB.length;
}

module.exports = {
    checkUpdate: async () => {
        console.log("Checking for updates...");
        return new Promise((resolve, reject) => {
            fetch("https://api.github.com/repos/Merlode11/pronote-bot-discord/releases/latest").then(res => res.json()).then(data => {
                console.log("Current version: " + require("../package.json").version);
                resolve(cmpVersions(data.tag_name, require("../package.json").version) > 0);
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    },
    /**
     * Update the files in the project directory downloaded from GitHub
     * @return {Promise<void>}
     */
    updateFiles: async () => {
        return new Promise((resolve, reject) => {
            fetch("https://api.github.com/repos/Merlode11/pronote-bot-discord/releases/latest").then(res => res.json()).then(data => {
                if (data.tag_name !== require("../package.json").version) {
                    fetch(data.zipball_url).then(res => res.buffer()).then(async data => {
                        try {
                            const jszipInstance = new jszip();
                            const result = await jszipInstance.loadAsync(data);

                            for (let key in Object.keys(result.files)) {
                                const item = result.files[Object.keys(result.files)[key]];
                                item.name = item.name.split("/").slice(1).join("/");
                                try {
                                    if (item.name) {
                                        if (item.dir && !fs.existsSync(item.name)) {
                                            fs.mkdirSync(item.name);
                                        } else {
                                            fs.writeFileSync("./"+item.name, await item.async("nodebuffer"));
                                        }
                                    }
                                } catch (e) {
                                    reject(e);
                                }
                            }
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(err => {
                        reject(err);
                    });
                }
            }).catch(err => {
                reject(err);
            });
        });
    }
};