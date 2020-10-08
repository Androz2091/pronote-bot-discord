require("dotenv").config();
const fs = require("fs");

const pronote = require("pronote-api");

const Discord = require("discord.js");
const client = new Discord.Client();

const DATE_END_OF_YEAR = new Date(new Date().getTime() + 31536000000);

let cache = null;

/**
 * Écrit l'objet dans le cache et met à jour la variable
 * @param {object} newCache Le nouvel objet
 */
const writeCache = (newCache) => {
    cache = newCache;
    fs.writeFileSync("cache.json", JSON.stringify(newCache, null, 4), "utf-8");
};

/**
 * Réinitialise le cache
 */
const resetCache = () => writeCache({
    homeworks: [],
    marks: []
});

// Si le fichier cache n'existe pas, on le créé
if (!fs.existsSync("cache.json")) {
    resetCache();
} else {
    // S'il existe, on essaie de le parser et si ça échoue on le reset pour éviter les erreurs
    try {
        cache = JSON.parse(fs.readFileSync("cache.json", "utf-8"));
    } catch (e) {
        console.error(e);
        resetCache();
    }
}

/**
 * Synchronise le cache avec Pronote et se charge d'appeler les fonctions qui envoient les notifications
 * @returns {void}
 */
const pronoteSynchronization = async () => {

    // Connexion à Pronote
    const session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, process.env.PRONOTE_CAS, "student");

    // Vérification des devoirs
    const homeworks = await session.homeworks(Date.now(), DATE_END_OF_YEAR);
    const newHomeworks = homeworks.filter((work) => !(cache.homeworks.some((cacheWork) => cacheWork.description === work.description)));
    if (newHomeworks.length > 0 && newHomeworks.length <= 3) {
        newHomeworks.forEach((work) => sendDiscordNotificationHomework(work));
    }
    // Mise à jour du cache pour les devoirs
    writeCache({
        ...cache,
        homeworks
    });

    // Déconnexion de Pronote
    session.logout();

};

/**
 * Envoi une notification de devoir sur Discord
 * @param {pronote.Homework} homework Le devoir à envoyer
 */
const sendDiscordNotificationHomework = (homework) => {
    const embed = new Discord.MessageEmbed()
        .setTitle(`${homework.subject.toUpperCase()}`)
        .setDescription(homework.description)
        .setTimestamp(homework.for)
        .setColor("#70C7A4");

    if(homework.files.length >= 1) {
        embed.addField("Pièces jointes", homework.files.map((file) => {
            return `[${file.name}](${file.url})`;
        }).join("\n"), false);
    }

    client.channels.cache.get(process.env.HOMEWORKS_CHANNEL_ID).send(embed).then((e) => {
        e.react("✅");
    });
};

client.on("ready", () => {
    console.log(`Ready. Logged as ${client.user.tag}!`);
    client.user.setActivity("Pronote", {
        type: "WATCHING"
    });
    pronoteSynchronization();
    setInterval(() => {
        pronoteSynchronization();
    }, 5 * 60 * 1000);
});

// Connexion à Discord
client.login(process.env.TOKEN);
