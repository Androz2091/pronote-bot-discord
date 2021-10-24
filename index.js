require("dotenv").config();
const fs = require("fs");
const moment = require("moment");
moment.locale("fr");

const pronote = require("pronote-api");

const Discord = require("discord.js");
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS]
});

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
    marks: {
        subjects: []
    },
    lessonsAway: []
});

// Si le fichier cache n'existe pas, on le créé
if (!fs.existsSync("cache.json")) {
    resetCache();
} else {
    // S'il existe, on essaie de le parser et si ça échoue on le reset pour éviter les erreurs
    try {
        cache = JSON.parse(fs.readFileSync("cache.json", "utf-8"));
    } catch {
        resetCache();
    }
}

/**
 * Synchronise le cache avec Pronote et se charge d'appeler les fonctions qui envoient les notifications
 * @returns {void}
 */
const pronoteSynchronization = async () => {

    // Connexion à Pronote
    const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
    const session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas, "student").catch(console.log);
    if (!session) return;

    // Vérification des devoirs
    const homeworks = await session.homeworks(Date.now(), session.params.lastDay);
    const newHomeworks = homeworks.filter((work) => !(cache.homeworks.some((cacheWork) => cacheWork.description === work.description)));
    if (newHomeworks.length > 0 && newHomeworks.length <= 3) {
        newHomeworks.forEach((work) => sendDiscordNotificationHomework(work));
    }
    // Mise à jour du cache pour les devoirs
    writeCache({
        ...cache,
        homeworks
    });

    const marks = await session.marks("trimester");
    const marksNotifications = [];
    marks.subjects.forEach((subject) => {
        const cachedSubject = cache.marks.subjects.find((sub) => sub.name === subject.name);
        if (cachedSubject) {
            const newMarks = subject.marks.filter((mark) => !(cachedSubject.marks.some((cacheMark) => cacheMark.id === mark.id)));
            newMarks.forEach((mark) => marksNotifications.push({ subject, mark }));
        } else {
            subject.marks.forEach((mark) => marksNotifications.push({ subject, mark }));
        }
    });
    if (marksNotifications.length > 0 && marksNotifications.length < 3) {
        marksNotifications.forEach((markNotif) => sendDiscordNotificationMark(markNotif.subject, markNotif.mark));
    }
    // Mise à jour du cache pour les notes
    writeCache({
        ...cache,
        marks
    });

    const nextWeekDay = new Date();
    nextWeekDay.setDate(nextWeekDay.getDate() + 30);
    const timetable = await session.timetable(new Date(), nextWeekDay);
    const awayNotifications = [];
    timetable.filter((lesson) => lesson.isAway || lesson.isCancelled).forEach((lesson) => {
        if (!cache.lessonsAway.some((lessonID) => lessonID === lesson.id)){
            awayNotifications.push({
                teacher: lesson.teacher,
                from: lesson.from,
                subject: lesson.subject,
                id: lesson.id
            });
        }
    });
    if (awayNotifications.length) {
        awayNotifications.forEach((awayNotif) => sendDiscordNotificationAway(awayNotif));
    }

    writeCache({
        ...cache,
        lessonsAway: [
            ...cache.lessonsAway,
            ...awayNotifications.map((n) => n.id)
        ]
    });

    // Déconnexion de Pronote
    session.logout();

};

/**
 * Envoi un notification de note sur Discord
 * @param {string} subject La matière de la note
 * @param {pronote.Mark} mark La note à envoyer
 */
const sendDiscordNotificationMark = (subject, mark) => {
    const infos = `Moyenne de la classe : ${mark.average}/${mark.scale}`;
    const description = mark.title ? `${mark.title}\n\n${infos}` : infos;
    const embed = new Discord.MessageEmbed()
        .setTitle(subject.name.toUpperCase())
        .setDescription(description)
        .setFooter(`Date de l'évaluation : ${moment(mark.date).format("dddd Do MMMM")}`)
        .setURL(process.env.PRONOTE_URL)
        .setColor("#70C7A4");

    client.channels.cache.get(process.env.MARKS_CHANNEL_ID).send({
        embeds: [embed]
    }).then((e) => {
        e.react("✅");
    });
}; 

/**
 * Envoi une notification de devoir sur Discord
 * @param {pronote.Homework} homework Le devoir à envoyer
 */
const sendDiscordNotificationHomework = (homework) => {
    const embed = new Discord.MessageEmbed()
        .setTitle(homework.subject.toUpperCase())
        .setDescription(homework.description)
        .setFooter(`Devoir pour le ${moment(homework.for).format("dddd Do MMMM")}`)
        .setURL(process.env.PRONOTE_URL)
        .setColor("#70C7A4");

    if(homework.files.length >= 1) {
        embed.addField("Pièces jointes", homework.files.map((file) => {
            return `[${file.name}](${file.url})`;
        }).join("\n"), false);
    }

    client.channels.cache.get(process.env.HOMEWORKS_CHANNEL_ID).send({
        embeds: [embed]
    }).then((e) => {
        e.react("✅");
    });
};

/**
 * Envoi une notification de cours annulé sur Discord
 * @param {any} awayNotif Les informations sur le cours annulé
 */
const sendDiscordNotificationAway = (awayNotif) => {
    const embed = new Discord.MessageEmbed()
        .setTitle(awayNotif.subject.toUpperCase())
        .setDescription(`${awayNotif.teacher} sera absent le ${moment(awayNotif.from).format("dddd Do MMMM")}`)
        .setFooter(`Cours annulé de ${awayNotif.subject}`)
        .setURL(process.env.PRONOTE_URL)
        .setColor("#70C7A4");

    client.channels.cache.get(process.env.AWAY_CHANNEL_ID).send({
        embeds: [embed]
    }).then((e) => {
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
        const date = new Date();
        pronoteSynchronization().catch((e) => console.log(`${date} | ${e.message}`));
    }, 10 * 60 * 1000);
});

// Connexion à Discord
client.login(process.env.TOKEN);
