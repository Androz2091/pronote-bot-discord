require("./utils/verif-env")();

require("dotenv").config();
const fs = require("fs");
const pronote = require("pronote-api-maintained");
const { Client, ButtonBuilder, ButtonStyle, ActionRowBuilder, GatewayIntentBits } = require("discord.js");
const msgbox = require("native-msg-box");
const { checkUpdate, updateFiles } = require("./utils/update");

if (process.env.AUTO_UPDATE === "true") {
    checkUpdate().then(result => {
        console.log(result);
        if (result) {
            msgbox.prompt({
                icon: msgbox.Icon.STOP,
                msg: "Une nouvelle version est disponible, voulez-vous la télécharger ?",
                title: "Mise à jour",
                type: 4
            }, async (err, result) => {
                if (err) {return console.error(err);}
                if (result === msgbox.Result.YES) {
                    updateFiles().then(async () => {
                        // restart the app
                        await require("child_process").execSync("npm install");
                        require("child_process").execSync("node index.js");
                        process.exit(0);
                    }).catch(err => {
                        console.error(err);
                    });
                }
            });
        }
    });
}


const client = new Client({ intents: GatewayIntentBits.Guilds });

require("./utils/db")(client);
require("./utils/notifications")(client);
require("./utils/functions")(client);

const bugButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("Signaler un bug")
    .setURL("https://github.com/Merlode11/pronote-bot-discord/issues/new?assignees=Merlode11&labels=bug%2C+help+wanted&template=signaler-un-bug.md&title=%5BBUG%5D")
    .setEmoji("🐛");

client.bugActionRow = new ActionRowBuilder().addComponents(bugButton);

client.session = null;

const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas).then(session => {
    client.session = session;
    client.cache = {};
    // Si le fichier cache n'existe pas, on le crée
    if (!fs.existsSync("cache_" + client.session.user.studentClass.name + ".json")) {
        client.db.resetCache(client.session.user.studentClass.name);
    } else {
        // S'il existe, on essaie de le parser et si ça échoue, on le reset pour éviter les erreurs
        try {
            client.cache = JSON.parse(fs.readFileSync("cache_" + client.session.user.studentClass.name + ".json", "utf-8"));
        } catch {
            client.db.resetCache(client.session.user.studentClass.name);
        }
    }


    client.on("ready", require("./events/ready"));

    client.on("interactionCreate", async interaction => {
        if (interaction.isAutocomplete()) {
            delete require.cache[require.resolve("./events/autocomplete")];
            await require("./events/autocomplete")(client, interaction);
        } else if (interaction.isCommand()) {
            delete require.cache[require.resolve("./events/command")];
            await require("./events/command")(client, interaction);
        } else if (interaction.isSelectMenu()) {
            delete require.cache[require.resolve("./events/selectMenu")];
            await require("./events/selectMenu")(client, interaction);
        }
    });

    // Connexion à Discord
    client.login(process.env.TOKEN).then(() => {}).catch(console.error);
}).catch(console.error);

process.on("unhandledRejection", error => {
    console.error(error);
});
process.on("uncaughtException", error => {
    console.error(error);
});
process.on("uncaughtExceptionMonitor", error => {
    console.error(error);
});
process.on("warning", error => {
    console.error(error);
});