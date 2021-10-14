const { MessageEmbed, Util } = require("discord.js");
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
const moment = require("moment");
moment.locale("fr");

let averageMsg = null

module.exports = client => {
    /**
     * Envoi un notification de note sur Discord
     * @param {Array} marksNotifications La matière de la note
     * @param {Array} cachedMarks La note à envoyer
     */
    client.notif.mark = async (marksNotifications, cachedMarks) => {
        const channel = client.channels.cache.get(process.env.MARKS_CHANNEL_ID);
        if (!averageMsg) {
            averageMsg = channel.lastMessage;
            if (!averageMsg) {
                averageMsg = await channel.messages.fetch({limit: 1});
                averageMsg = averageMsg.first();
            }
        }
        await asyncForEach(marksNotifications, markObj => {
            const mark = markObj.mark;
            const subject = markObj.subject;

            const embed = new MessageEmbed();
            let better = "";
            if (mark.value === mark.max) {
                better = "**__Tu as la meilleure note de la classe !__**\n";
                embed.setThumbnail("https://i.imgur.com/RGs62tl.gif");
            } else if (mark.value > mark.average) {
                better = "**__Tu as une note au dessus de la moyenne de la classe !__**\n";
                embed.setThumbnail("https://i.imgur.com/3P5DfAZ.gif");
            }
            const infos = better + `**Note de l'élève :** ${mark.value}/${mark.scale}\n**Moyenne de la classe :** ${mark.average}/${mark.scale}\n\n**Note la plus basse :** ${mark.min}/${mark.scale}\n**Note la plus haute :** ${mark.max}/${mark.scale}`;
            const description = mark.title ? `${mark.title}\n\n${infos}` : infos;
            embed.setAuthor("Pronote", "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png", process.env.PRONOTE_URL)
                .setTitle(subject.name.toUpperCase())
                .setDescription(description)
                .addField("__Matière__", `**Moyenne de l'élève :** ${subject.averages.student}/20\n**Moyenne de la classe :** ${subject.averages.studentClass}/20`)
                .setFooter(`Date de l'évaluation : ${moment(mark.date).format("dddd Do MMMM")}`)
                .setURL(process.env.PRONOTE_URL)
                .setColor("#70C7A4");

            channel.send({embeds:[embed]});
        });
        if (
            averageMsg &&
            averageMsg.author.id === client.user.id &&
            averageMsg.embeds[0].title.toUpperCase() === "moyenne générale".toUpperCase()
            ) await averageMsg.delete();
        const generalEmbed = new MessageEmbed()
            .setTitle("moyenne générale".toUpperCase())
            .setDescription(`**Moyenne générale de l'élève :** ${client.cache.marks.averages.student}/20\n**Moyenne générale de la classe :** ${client.cache.marks.averages.studentClass}/20`)
            .addField("__Moyennes précédentes__", `**Élève :** ${cachedMarks.averages.student}/20\n**Classe :** ${cachedMarks.averages.studentClass}/20`)
            .addField("Modification", `**Élève :** ${Math.round((client.cache.marks.averages.student-cachedMarks.averages.student)*100)/100}\n**Classe :** ${Math.round((client.cache.marks.averages.studentClass-cachedMarks.averages.studentClass)*100)/100}`)
            .setColor("#70C7A4");
        averageMsg = await channel.send({embeds: [generalEmbed]});
    };

    /**
     * Envoi une notification de devoir sur Discord
     * @param {pronote.Homework} homework Le devoir à envoyer
     */
    client.notif.homework = (homework) => {
        const embed = new MessageEmbed()
            .setAuthor("Pronote", "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png", process.env.PRONOTE_URL)
            .setTitle(homework.subject.toUpperCase())
            .setDescription(homework.description)
            .setFooter(`Devoir pour le ${moment(homework.for).format("dddd Do MMMM")}`)
            .setURL(homework.trelloURL ? homework.trelloURL : process.env.PRONOTE_URL)
            .setColor("#70C7A4");

        if (homework.files.length >= 1) {
            const filesText = Util.splitMessage(homework.files.map((file) => {
                if (/^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/g.test(file.name)) file.url = file.name;
                return `[${file.name}](${file.url})`;
            }).join("\n"), {
                maxLength: 1024
            });

            embed.addField("Pièces jointes", filesText.shift(), true);
            if (filesText.length) filesText.forEach(str => {
                embed.addField("\u200b", str, true);
            });
        }

        client.channels.cache.get(process.env.HOMEWORKS_CHANNEL_ID).send({embeds: [embed]}).then((e) => {
            if (homework.done) e.react("✅").then(() => {});
        });
    };

    /**
     * Envoi une notification de cours annulé sur Discord
     * @param {any} awayNotif Les informations sur le cours annulé
     */
    client.notif.away = (awayNotif) => {
        const embed = new MessageEmbed()
            .setAuthor("Pronote", "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png", process.env.PRONOTE_URL)
            .setTitle(awayNotif.subject.toUpperCase())
            .setDescription(`${awayNotif.teacher} sera absent le ${moment(awayNotif.from).format("dddd Do MMMM")}`)
            .setFooter(`Cours annulé de ${awayNotif.subject}`)
            .setURL(process.env.PRONOTE_URL)
            .setColor("#70C7A4");

        client.channels.cache.get(process.env.AWAY_CHANNEL_ID).send({embeds: [embed]}).then(e => {
            e.react("✅").then(() => {});
        });
    };

    /**
     * Envoi une notification d'information sur Discord
     * @param {any} infoNotif L'information à envoyer
     */
    client.notif.info = (infoNotif) => {
        const embed = new MessageEmbed()
            .setAuthor(infoNotif.author, "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png", process.env.PRONOTE_URL)
            .setTitle(infoNotif.title ?? "Pas de titre")
            .setDescription(`${infoNotif.content}`)
            .setFooter(`Information du ${moment(infoNotif.date).format("dddd Do MMMM")}`)
            .setURL(process.env.PRONOTE_URL)
            .setColor("#70C7A4");

        if (infoNotif.files.length >= 1) {
            const filesText = Util.splitMessage(infoNotif.files.map((file) => {
                if (/^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/g.test(file.name)) file.url = file.name;
                return `[${file.name}](${file.url})`;
            }).join("\n"), {
                maxLength: 1024
            });

            embed.addField("Pièces jointes", filesText.shift(), true);
            if (filesText.length) filesText.forEach(str => {
                embed.addField("\u200b", str, true);
            });
        }

        client.channels.cache.get(process.env.INFOS_CHANNEL_ID).send({embeds: [embed]}).then(e => {
            e.react("✅").then(() => {}).catch(console.error);
        });
    };
};