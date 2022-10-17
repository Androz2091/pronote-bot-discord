const { EmbedBuilder } = require("discord.js");
const { NodeHtmlMarkdown } = require("node-html-markdown");

const moment = require("moment");
moment.locale("fr");

let averageMsg = null;

module.exports = client => {
    client.notif = {};

    /**
     * Envoi une notification de note sur Discord
     * @param {Array} marksNotifications La matière de la note
     * @param {Array} cachedMarks La note à envoyer
     */
    client.notif.mark = async (marksNotifications, cachedMarks) => {
        const channel = client.channels.cache.get(process.env.MARKS_CHANNEL_ID);
        if (!channel) return new ReferenceError("MARKS_CHANNEL_ID is not defined");
        if (!averageMsg) {
            averageMsg = channel.lastMessage;
            if (!averageMsg) {
                averageMsg = await channel.messages.fetch({limit: 1});
                averageMsg = averageMsg.first();
            }
        }

        await client.functions.asyncForEach(marksNotifications, async markObj => {
            const mark = markObj.mark;
            const subject = markObj.subject;

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "Pronote",
                    iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                    url: process.env.PRONOTE_URL
                });
            let better = "";
            if (mark.value === mark.max) {
                better = "**__Tu as la meilleure note de la classe !__**\n";
                embed.setThumbnail("https://i.imgur.com/RGs62tl.gif");
            } else if (mark.value >= mark.average) {
                better = "**__Tu as une note au dessus de la moyenne de la classe !__**\n";
                embed.setThumbnail("https://i.imgur.com/3P5DfAZ.gif");
            } else if (mark.value === mark.min) {
                better = "**__Tu est le premier des derniers !__**\n";
                embed.setThumbnail("https://i.imgur.com/5H5ZASz.gif");
                embed.data.author.url = "https://youtu.be/dQw4w9WgXcQ";
            }
            let studentNote = `**Note de l'élève :** ${mark.value}/${mark.scale}`;
            if (mark.scale !== 20) studentNote += ` *(${+(mark.value / mark.scale * 20).toFixed(2)}/20)*`;
            const infos = better + studentNote + `\n**Moyenne de la classe :** ${mark.average}/${mark.scale}\n**Coefficient**: ${mark.coefficient}\n\n**Note la plus basse :** ${mark.min}/${mark.scale}\n**Note la plus haute :** ${mark.max}/${mark.scale}`;
            const description = mark.title ? `${mark.title}\n\n${infos}` : infos;
            embed.setTitle(subject.name.toUpperCase())
                .setDescription(description)
                .addFields([{
                    name: "__Matière__",
                    value: `**Moyenne de l'élève :** ${subject.averages.student}/20\n**Moyenne de la classe :** ${subject.averages.studentClass}/20`
                }
                ])
                .setFooter({text: `Date de l'évaluation : ${moment(mark.date).format("dddd Do MMMM")}`})
                .setURL(process.env.PRONOTE_URL)
                .setColor(subject.color ?? "#70C7A4");

            await channel.send({embeds: [embed]}).catch(console.error);
        });
        if (
            averageMsg &&
            averageMsg.author.id === client.user.id &&
            averageMsg.embeds[0].title.toUpperCase() === "moyenne générale".toUpperCase()
        ) await averageMsg.delete();

        const studentEdit = Math.round(((client.cache.marks?.averages?.student ?? 0) - (cachedMarks?.averages?.student ?? 0)) * 100) / 100;
        const classEdit = Math.round(((client.cache.marks?.averages?.studentClass ?? 0) - (cachedMarks?.averages?.studentClass ?? 0)) * 100) / 100;

        const generalEmbed = new EmbedBuilder()
            .setTitle("moyenne générale".toUpperCase())
            .setDescription(`**Moyenne générale de l'élève :** ${client.cache.marks?.averages?.student ?? 0}/20\n**Moyenne générale de la classe :** ${client.cache.marks?.averages?.studentClass ?? 0}/20`)
            .addFields([{
                name: "__Moyennes précédentes__",
                value: `**Élève :** ${cachedMarks?.averages?.student ?? 0}/20\n**Classe :** ${cachedMarks?.averages?.studentClass ?? 0}/20`
            }, {
                name: "Modification",
                value: `**Élève :** ${studentEdit > 0 ? "+" + studentEdit : studentEdit}\n**Classe :** ${classEdit > 0 ? "+" + classEdit : classEdit}`
            }
            ])
            .setColor("#70C7A4");
        averageMsg = await channel.send({embeds: [generalEmbed]}).catch(console.error);
    };

    /**
     * Envoi une notification de devoir sur Discord
     * @param {any} homework Le devoir à envoyer
     */
    client.notif.homework = async (homework) => {
        const channel = client.channels.cache.get(process.env.HOMEWORKS_CHANNEL_ID);
        if (!channel) return new ReferenceError("HOMEWORKS_CHANNEL_ID is not defined");

        const content = NodeHtmlMarkdown.translate(homework.htmlDescription);

        const embed = new EmbedBuilder()
            .setAuthor({
                name: "Pronote",
                iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                url: process.env.PRONOTE_URL,
            })
            .setTitle(homework.subject.toUpperCase())
            .setDescription(content)
            .setFooter({text: `Devoir pour le ${moment(homework.for).format("dddd Do MMMM")}`})
            .setURL(process.env.PRONOTE_URL)
            .setColor(homework.color ?? "#70C7A4");

        let attachments = [];
        let files = [];
        if (homework.files.length >= 1) {
            await client.functions.asyncForEach(homework.files, async file => {
                const properties = await client.functions.getFileProperties(file);
                if (properties.type === "file") attachments.push(properties.attachment);
                files.push(properties);
            });
        }

        channel.send({embeds: [embed], files: attachments}).then((e) => {
            if (homework.done) e.react("✅").then(() => {
            });
            if (homework.files.length) {
                let string = "";
                files.forEach(file => {
                    if (file.type === "file") {
                        const name = client.functions.setFileName(file.name);
                        const attachment = e.attachments.find(a => a.name === name);
                        if (attachment) string += `[${file.name}](${attachment.url})\n`;
                        else {
                            string += `${file.name}\n`;
                            console.log("Attachment not found.\nTo found name: " + name, "Original name: " + file.name, "\nAttachments: " + e.attachments.map(a => a.name));
                        }
                    } else {
                        string += `[${file.name ?? file.url}](${file.url})\n`;
                    }
                });

                const strings = client.functions.splitMessage(string, {
                    maxLength: 1024,
                });

                embed.addFields(strings.map((s, i) => {
                    return {
                        name: i === 0 ? "Fichiers joints" : "\u200b",
                        value: s,
                    };
                }));
                e.edit({embeds: [embed]});
            }
        }).catch(console.error);
    };

    /**
     * Envoi une notification de cours annulé sur Discord
     * @param {any} awayNotif Les informations sur le cours annulé
     */
    client.notif.away = (awayNotif) => {
        const channel = client.channels.cache.get(process.env.AWAY_CHANNEL_ID);
        if (!channel) return new ReferenceError("AWAY_CHANNEL_ID is not defined");

        const embed = new EmbedBuilder()
            .setAuthor({
                name: "Pronote",
                iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                url: process.env.PRONOTE_URL
            })
            .setTitle(awayNotif.subject.toUpperCase())
            .setURL(process.env.PRONOTE_URL)
            .setDescription(`${awayNotif.teacher} sera absent le ${moment(awayNotif.from).format("dddd Do MMMM")}`)
            .setFooter({text: `Cours annulé de ${awayNotif.subject}`})
            .setColor("#70C7A4");

        channel.send({embeds: [embed]}).then(() => {
        }).catch(console.error);
    };

    /**
     * Envoi une notification d'information sur Discord
     * @param {any} infoNotif L'information à envoyer
     */
    client.notif.info = async (infoNotif) => {
        const channel = client.channels.cache.get(process.env.INFOS_CHANNEL_ID);
        if (!channel) return new ReferenceError("INFOS_CHANNEL_ID is not defined");

        let content = NodeHtmlMarkdown.translate(infoNotif.htmlContent);

        const splitted = client.functions.splitMessage(content, {
            maxLength: 4096,
        });

        const embed = new EmbedBuilder()
            .setTitle(infoNotif.title ?? "Sans titre titre")
            .setDescription(splitted.shift())
            .setURL(process.env.PRONOTE_URL)
            .setColor("#70C7A4");

        if (infoNotif.author) embed.setAuthor({
            name: infoNotif.author,
            iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
            url: process.env.PRONOTE_URL
        });
        const embeds = [embed];
        const attachments = [];
        let files = [];
        await client.functions.asyncForEach(splitted, async (s, index) => {
            const embed = new EmbedBuilder()
                .setDescription(s)
                .setColor("#70C7A4");
            if (index === splitted.length - 1) {
                embed.setFooter({text: `Information du ${moment(infoNotif.date).format("dddd Do MMMM")}`});
            }
            embeds.push(embed);
        });

        if (infoNotif.files.length >= 1) {
            await client.functions.asyncForEach(infoNotif.files, async (file) => {
                const properties = await client.functions.getFileProperties(file);
                if (properties.type === "file") {
                    attachments.push(properties.attachment);
                }
                files.push(properties);
            });
        }
        channel.send({embeds, files: attachments}).then(m => {
            if (files.length) {
                let string = "";
                files.forEach(file => {
                    if (file.type === "file") {
                        const name = client.functions.setFileName(file.name);
                        const attachment = m.attachments.find(a => a.name === name);
                        if (attachment) string += `[${file.name}](${attachment.url})\n`;
                        else {
                            string += `${file.name}\n`;
                            console.log("Attachment not found.\nID: "+ infoNotif.id +" To found name: " + name, "Original name: " + file.name, "\nAttachments: " + m.attachments.map(a => a.name));
                        }
                    } else {
                        string += `[${file.name}](${file.url})\n`;
                    }
                });
                let strings = client.functions.splitMessage(string, {
                    maxLength: 1024,
                });

                embeds[embeds.length - 1].addFields(strings.map((s, index) => {
                    return {
                        name: index === 0 ? "Pièces jointes" : "\u200b",
                        value: s,
                        inline: false
                    };
                }));
                m.edit({embeds});
            }
        }).catch(console.error);
    };
};