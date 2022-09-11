require("dotenv").config();
const fs = require("fs");
const pronote = require("pronote-api-again");
const { Client, EmbedBuilder, IntentsBitField, Colors, ActivityType } = require("discord.js");
const msgbox = require("native-msg-box");
const { checkUpdate, updateFiles } = require("./utils/update");

if (process.env.AUTO_UPDATE === "true") {
    checkUpdate().then(result => {
        if (result) {
            msgbox.prompt({
                icon: msgbox.Icon.STOP,
                msg: "Une nouvelle version est disponible, voulez-vous la télécharger ?",
                title: "Mise à jour",
                type: 4
            }, async (err, result) => {
                if (err) {return console.error(err);}
                if (result === msgbox.Result.YES) {
                    updateFiles().then(() => {
                        // restart the app
                        require("child_process").exec("node index.js");
                        process.exit(0);
                    });
                }
            });
        }
    });
}


const client = new Client({ intents: Object.keys(IntentsBitField.Flags).map(key => IntentsBitField.Flags[key]) });

require("./utils/db")(client);
require("./utils/notifications")(client);

client.session = null;

const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas).then(session => {
    client.session = session;
    client.cache = {};
    // Si le fichier cache n'existe pas, on le crée
    if (!fs.existsSync("cache_" + client.session.user.studentClass.name + ".json")) {
        client.db.resetCache();
    } else {
        // S'il existe, on essaie de le parser et si ça échoue, on le reset pour éviter les erreurs
        try {
            client.cache = JSON.parse(fs.readFileSync("cache_" + client.session.user.studentClass.name + ".json", "utf-8"));
        } catch {
            client.db.resetCache();
        }
    }

    let timeLeft = 10;

    client.on("ready", async () => {
        const today = new Date();
        const hour = `${today.getHours()}`.length === 1 ? `0${today.getHours()}` : today.getHours();
        const min = `${today.getMinutes()}`.length === 1 ? `0${today.getMinutes()}` : today.getMinutes();
        const sec = `${today.getSeconds()}`.length === 1 ? `0${today.getSeconds()}` : today.getSeconds();
        const time = hour + ":" + min + ":" + sec;

        const day = `${today.getDate()}`.length === 1 ? `0${today.getDate()}` : today.getDate();
        const month = `${today.getMonth() + 1}`.length === 1 ? `0${today.getMonth() + 1}` : (today.getMonth() + 1);
        const date = day + "/" + month + "/" + today.getFullYear();

        client.user.setActivity("Loading", {
            type: ActivityType.Playing
        });
        await fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).forEach(file => {
            const command = require(`./commands/${file}`);
            if (process.env.DEBUG_MODE === "true") {
                client.application.commands.create(command.data).catch(console.error);
            } else if (!command.forDebug) client.application.commands.create(command.data).catch(console.error);
        });

        console.log(`Connecté comme ${client.user.tag}! Démarré à ${date} ${time}. J'ai ${client.guilds.cache.size} serveurs et ${client.users.cache.size} utilisateurs`);
        await require("./utils/pronoteSynchronization")(client);

        setInterval(async () => {
            const date = new Date();

            delete require.cache[require.resolve("./utils/pronoteSynchronization")];
            await require("./utils/pronoteSynchronization")(client).catch((e) => console.log(`${date} ${time} | ${e.message}`));
            timeLeft = 10;
        }, 10 * 60 * 1000);

        setInterval(() => {
            timeLeft = timeLeft - 1;
            client.user.setActivity(`Pronote | Maj dans ${timeLeft}m`, {
                type: ActivityType.Watching
            });
        }, 60 * 1000);
    });

    client.on("interactionCreate", async interaction => {
        if (interaction.isCommand()) {
            try {
                if (!fs.existsSync(`./commands/${interaction.commandName}.js`)) {
                    return await interaction.reply({content: "⚠ | La commande n'a pas été trouvée", ephemeral: true});
                }
                await interaction.deferReply({
                    fetchReply: true,
                    ephemeral: false
                });

                if (!client.session) {
                    const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
                    client.session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas).catch(console.error);
                }

                delete require.cache[require.resolve(`./commands/${interaction.commandName}`)];
                await require(`./commands/${interaction.commandName}`).execute(interaction);
            } catch (error) {
                console.error(error);
                let errorString = error;
                if (error.toString() === "[object Object]") {
                    errorString = JSON.stringify(error);
                }
                if (interaction.replied) await interaction.followUp(
                    {
                        content: "⚠ | Il y a eu une erreur lors de l'exécution de la commande!",
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(errorString.toString())]
                    }
                );
                else if (interaction.deferred) await interaction.editReply(
                    {
                        content: "⚠ | Il y a eu une erreur lors de l'exécution de la commande!",
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(errorString.toString())]
                    }
                );
                else await interaction.reply({
                    content: "⚠ | Il y a eu une erreur lors de l'exécution de la commande!",
                    embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(errorString.toString())]
                }).catch(console.error);
            }

            setTimeout(async () => {
                if (client.session) {
                    await client.session.logout();
                    client.session = null;
                }
            }, 5 * 60 * 1000);
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
