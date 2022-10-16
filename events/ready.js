const { ActivityType } = require("discord.js");
const fs = require("fs");

let timeLeft = 10;

module.exports = async (client) => {
    client.user.setActivity("Loading", {
        type: ActivityType.Playing
    });
    await fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).forEach(file => {
        const command = require(`../commands/${file}`);
        command.data.name = file.split(".")[0];
        if (process.env.DEBUG_MODE === "true") {
            client.application.commands.create(command.data).catch(console.error);
        } else if (!command.forDebug) client.application.commands.create(command.data).catch(console.error);
    });

    console.log(`Connecté comme \x1b[94m${client.user.tag}\x1b[0m! Démarré à \x1b[95m${client.functions.parseTime()}\x1b[0m. J'ai \x1b[33m${client.guilds.cache.size}\x1b[0m serveurs et \x1b[33m${client.users.cache.size}\x1b[0m utilisateurs`);
    await require("../utils/pronoteSynchronization")(client);

    setInterval(async () => {
        delete require.cache[require.resolve("../utils/pronoteSynchronization")];
        await require("../utils/pronoteSynchronization")(client).catch((e) => {
            if (e.message === "Session has expired due to inactivity or error") {
                client.session.logout();
                client.session = null;
            }
            console.log(`${client.functions.parseTime()} | \x1b[31m${e.message}\x1b[0m`);
        });
        timeLeft = 10;
    }, 10 * 60 * 1000);

    setInterval(() => {
        timeLeft = timeLeft - 1;
        client.user.setActivity(`Pronote | Maj dans ${timeLeft}m`, {
            type: ActivityType.Watching
        });
    }, 60 * 1000);
};