require("dotenv").config();
const fs = require("fs");
const pronote = require("pronote-api-again");
const { Collection, Client, MessageEmbed, Intents } = require("discord.js");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.db = {};
require("./utils/db")(client);
client.notif = {};
require("./utils/notifications")(client);
client.commands = new Collection();

client.session = null;

client.cache = {};
// Si le fichier cache n'existe pas, on le créé
if (!fs.existsSync("cache.json")) {
    client.db.resetCache();
} else {
    // S'il existe, on essaie de le parser et si ça échoue on le reset pour éviter les erreurs
    try {
        client.cache = JSON.parse(fs.readFileSync("cache.json", "utf-8"));
    } catch {
        client.db.resetCache();
    }
}

let timeLeft = 10;

client.on("ready", async () => {
    client.user.setActivity("Loading", {
        type: "PLAYING"
    });
    await fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).forEach(file => {
        const command = require(`./commands/${file}`);
        client.application.commands.create(command.data).catch(console.error);
        client.commands.set(command.data.name, command);
    });
    
    console.log(`Ready. Logged as ${client.user.tag}!`);
    await require("./utils/pronoteSynchronization")(client);


    setInterval(async () => {
        const date = new Date();
        await require("./utils/pronoteSynchronization")(client).catch((e) => console.log(`${date} | ${e.message}`));
        timeLeft = 10;
    }, 10 * 60 * 1000);

    setInterval(() => {
        timeLeft = timeLeft - 1;
        client.user.setActivity(`Pronote | Maj dans ${timeLeft}m`, {
            type: "WATCHING"
        });
    }, 60 * 1000);
});


client.on("interactionCreate", async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return await interaction.reply({ content: "La commande n'a pas été trouvée", ephemeral: true });

        await interaction.deferReply();

        if (!client.session) {
            const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
            client.session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas, "student").catch(console.error);
            client.session.setKeepAlive(true);
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied) await interaction.followUp(
                {
                    content: "Il y a eu une erreur lors de l'exécution de la commande!",
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor("RED").setDescription(error.toString())]
                }
            );
            else await interaction.reply({
                content: "Il y a eu une erreur lors de l'exécution de la commande!",
                ephemeral: true,
                embeds: [new MessageEmbed().setColor("RED").setDescription(error.toString())]
            });
        }

        setTimeout(async () => {
            if (client.session) {
                await client.session.logout();
                client.session = null;
            }
        },5*60*1000);
    }
});

// Connexion à Discord
client.login(process.env.TOKEN).then(() => {}).catch(console.error);