const fs = require("fs");

module.exports = async () => {
    if (!fs.existsSync(".env")) {
        console.log("No .env file found, creating one...");
        if (fs.existsSync(".env.example")) {
            fs.copyFileSync(".env.example", ".env");
        } else {
            throw new Error("No .env or .env.example file found, please create one.");
        }
    }
    require("dotenv").config();
    const env = process.env;
    for (let key in env) {
        env[key] = env[key].replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/"/g, "");
        if (key.endsWith("_CHANNEL_ID")) {
            if (!env[key] || !env[key].match(/^\d{17,20}}$/)) {
                console.warn("\x1b[33mNo channel ID for " + key + ", please set one in .env\x1b[0m");
            }
        } else if (key === "PRONOTE_URL") {
            if (!env[key]) {
                throw new Error("No Pronote URL set, please set one in .env");
            } else if (!env[key].match(/https:\/\/[0-9]{7}\w\.index-education\.net\/pronote\//g)) {
                throw new Error("Pronote URL must be in the form https://1234567A.index-education.net/pronote/");
            }
        } else if (key === "PRONOTE_USERNAME") {
            if (!env[key] || env[key] === "TON_IDENTIFIANT") {
                throw new Error("No Pronote username set, please set one in .env");
            }
        } else if (key === "PRONOTE_PASSWORD") {
            if (!env[key] || env[key] === "TON_MOT_DE_PASSE") {
                throw new Error("No Pronote password set, please set one in .env");
            }
        } else if (key === "TOKEN") {
            if (!env[key] || env[key] === "TON_TOKEN") {
                throw new Error("No Discord bot token set, please set one in .env");
            }
        } else if (key === "PRONOTE_CAS") {
            const { casList } = require("pronote-api-maintained");
            if (!env[key]) {
                throw new Error("No CAS set, please set one in .env");
            }
            if (!casList.includes(env[key])) {
                throw new Error("Pronote CAS not found, please set a correct one in .env (none or leave empty for default)");
            }
        }
    }
};
