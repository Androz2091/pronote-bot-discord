const {AttachmentBuilder, EmbedBuilder, SelectMenuBuilder, ActionRowBuilder} = require("discord.js");
const {ChartJSNodeCanvas} = require("chartjs-node-canvas");
const width = 800;
const height = 300;
// White color and bold font
const ticksOptions = {ticks: {font: {weight: "bold"}, color: "#fff"}};
const options = {
    // Hide legend
    plugins: {
        legend: { /*display: false,*/ labels: {
            font: {weight: "bold"}, color: "#fff"
        }
        }
    },
    scales: {yAxes: ticksOptions, xAxes: ticksOptions}
};

const generateCanvas = async (joinedXDays, lastXDays) => {
    const canvasRenderService = new ChartJSNodeCanvas({width, height});
    const image = await canvasRenderService.renderToBuffer({
        type: "line",
        data: {
            labels: lastXDays,
            datasets: [
                {
                    label: "Moyenne",
                    data: joinedXDays,
                    // The color of the line (the same as the fill color with full opacity)
                    borderColor: "#70C7A4",
                    // Fill the line with color
                    fill: true,
                    // Blue color and low opacity
                    backgroundColor: "rgba(112,199,164,0.1)"
                }
            ]
        },
        options
    });
    return new AttachmentBuilder(image, {
        name: "graph.png",
        description: "Graphique de l'évolution de la moyenne"
    });
};

const pronote = require("pronote-api-maintained");
const {NodeHtmlMarkdown} = require("node-html-markdown");
const moment = require("moment/moment");
module.exports = async (client, interaction) => {
    interaction.deferUpdate();

    if (!client.session) {
        const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
        client.session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas).catch(console.error);
    }

    if (interaction.customId === "cours_date") {
        const value = interaction.values[0].split("/");

        const date = new Date(parseInt(value[2]), parseInt(value[1]) - 1, parseInt(value[0]));

        await client.session.timetable(date).then((cours) => {
            let totalDuration = 0;
            cours.forEach((cours) => {
                totalDuration += cours.to.getTime() - cours.from.getTime();
            });
            totalDuration = Math.abs(totalDuration / 1000 / 60 / 60);
            const embed = new EmbedBuilder()
                .setColor("#70C7A4")
                .setTitle("Vous avez " + cours.length + " cours `" + date.toLocaleDateString() + "` :")
                .setDescription("Durée totale : **" + totalDuration + "h**");
            const embedCours = cours.map((cour) => {
                const subHomeworks = client.cache.homeworks.filter(h => h.subject === cour.subject && cour.from.getDate() + "/" + cour.from.getMonth() === h.for.getDate() + "/" + h.for.getMonth());
                return new EmbedBuilder()
                    .setColor(cour.color ?? "#70C7A4")
                    .setAuthor({
                        name: cour.subject,
                    })
                    .setDescription("Professeur: **" + cour.teacher + "**" +
                        "\nSalle: `" + (cour.room ?? " ? ") + "`" +
                        "\nDe **" + cour.from.toLocaleTimeString().split(":")[0] +
                        "h" + cour.from.toLocaleTimeString().split(":")[1] + "**" +
                        " à **" + cour.to.toLocaleTimeString().split(":")[0] +
                        "h" + cour.to.toLocaleTimeString().split(":")[1] + "**" +
                        " *(" + (cour.to.getTime() - cour.from.getTime()) / 1000 / 60 / 60 + "h)*" +
                        (subHomeworks.length && (!cour.isCancelled || !cour.isAway) ? `\n⚠**__\`${subHomeworks.length}\` Devoirs__**` : "") +
                        (cour.isCancelled || cour.isAway ? "\n⚠__**Cour annulé**__" : ""));
            });
            const current = new Date(date.getTime());
            const week = [];
            for (let i = 1; i <= 7; i++) {
                let first = current.getDate() - current.getDay() + i;
                let day = new Date(current.setDate(first));
                if (day.getDay() !== 0) week.push(day);
            }
            let weekString = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

            const selectMenu = new SelectMenuBuilder()
                .setCustomId("cours_date")
                .setPlaceholder("Sélectionnez une date pour voir les cours")
                .addOptions(week.map((day) => {
                    return {
                        label: day.toLocaleDateString(),
                        value: day.toLocaleDateString(),
                        description: weekString[day.getDay()] + " " + day.toLocaleDateString().split("/")[0],
                        default: day.toLocaleDateString() === date.toLocaleDateString()
                    };
                }))
                .setMaxValues(1)
                .setMinValues(1);

            interaction.message.edit({
                embeds: [embed].concat(embedCours),
                components: [new ActionRowBuilder().addComponents(selectMenu)]
            });
        });
    } else if (interaction.customId === "content_select") {
        const value = interaction.values[0].split(/-/);
        const subject = value[0];
        const dateValue = value[1].split("/");
        const timeValue = value[2].replace("h", "");

        const date = new Date(parseInt(dateValue[2]), parseInt(dateValue[1]) - 1, parseInt(dateValue[0]), parseInt(timeValue));
        await client.session.contents(new Date(new Date().getFullYear(), 8, 1), new Date()).then(async (data) => {
            data = data.filter((content) => content.subject === subject);
            const components = [];
            if (data.length > 1) {
                const menu = new SelectMenuBuilder()
                    .setCustomId("content_select")
                    .setPlaceholder("Sélectionnez une date")
                    .addOptions(interaction.message.components[0].components[0].options.map((option) => {
                        return {
                            label: option.label,
                            value: option.value,
                            description: option.description,
                            default: option.value === interaction.values[0]
                        };
                    }))
                    .setMaxValues(1)
                    .setMinValues(1);
                components.push(new ActionRowBuilder().addComponents(menu));
            }
            data = data.filter(o => o.from.getTime() === date.getTime());
            const content = data[0];
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "Contenu du cours",
                    iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                    url: process.env.PRONOTE_URL,
                })
                .setColor(content.color)
                .addFields([
                    {
                        name: content.subject,
                        value: content.teachers.join(", ") +
                            "\n le **" + content.from.toLocaleDateString() + "**" +
                            " de **" + content.from.toLocaleTimeString().split(":")[0] +
                            "h" + content.from.toLocaleTimeString().split(":")[1] + "**" +
                            " à **" + content.to.toLocaleTimeString().split(":")[0] +
                            "h" + content.to.toLocaleTimeString().split(":")[1] + "**",
                    }
                ])
                .setFooter({text: "Bot par Merlode#8128"});


            if (content.title) {
                embed.setTitle(content.title);
            }

            if (content.htmlDescription) {
                embed.setDescription(NodeHtmlMarkdown.translate(content.htmlDescription));
            } else if (content.description) {
                embed.setDescription(content.description);
            }

            let attachments = [];
            let files = [];
            if (content.files.length > 0) {
                await client.functions.asyncForEach(content.files, async (file) => {
                    await client.functions.getFileProperties(file).then(async (properties) => {
                        if (properties.type === "file") {
                            attachments.push(properties.attachment);
                        }
                        files.push(properties);
                    });
                });
            }

            await interaction.message.edit({
                embeds: [embed],
                components: components,
                files: attachments,
                fetchReply: true
            });

            if (files.length > 0) {
                const e = await interaction.fetchReply();
                let string = "";
                if (files.length > 0) {
                    await client.functions.asyncForEach(files, async (file) => {
                        if (file.type === "file") {
                            const name = client.functions.setFileName(file.name);
                            const attachment = e.attachments.find(a => a.name === name);
                            if (attachment) {
                                string += `[${file.name}](${attachment.url})\n`;
                            }
                        } else {
                            string += `[${file.name ?? file.url}](${file.url} "${file.url}")\n`;
                        }
                    });
                }
                const strings = client.functions.splitMessage(string, {
                    maxLength: 1024,
                });

                if (string.length > 0) {
                    const lastString = strings.pop();
                    await client.functions.asyncForEach(strings, async (string) => {
                        embed.data.fields.unshift({
                            name: "",
                            value: string,
                            inline: false
                        });
                    });
                    embed.data.fields.unshift({
                        name: "Fichiers joints",
                        value: lastString,
                        inline: false
                    });
                    await interaction.message.edit({embeds: [embed]});
                }
            }
        });
    } else if (interaction.customId === "menu_files") {
        const value = interaction.values[0].split(/\|/);
        client.session.files().then(async (files) => {
            const data = files.filter((file) => file.subject === value[1]);
            const components = [];
            if (files.length > 1) {
                const selectMenu = new SelectMenuBuilder()
                    .setCustomId("menu_files")
                    .setPlaceholder("Sélectionnez un fichier")
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(data.map(f => {
                        return ({
                            label: f.name ?? "Lien",
                            value: f.id + "|" + f.subject,
                            description: f.time.toLocaleString(),
                            default: f.id === value[0]
                        });
                    }));
                components.push(new ActionRowBuilder().addComponents(selectMenu));
            }

            let dataToSend = files.find(f => f.id === value[0]);
            if (!dataToSend) dataToSend = files[0];

            const properties = await client.functions.getFileProperties(dataToSend);
            if (properties.type === "link") {
                interaction.message.edit({
                    content: `🔗 | [${properties.name ?? properties.url}](${properties.url} "${properties.url}")`,
                    components,
                    embeds: [],
                    files: []
                });
            } else {
                const embed = new EmbedBuilder()
                    .setColor("#70C7A4")
                    .setAuthor({
                        name: properties.subject,
                        iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                        url: process.env.PRONOTE_URL,
                    })
                    .setTitle(properties.name)
                    .setDescription(`📅 | **${properties.time.toLocaleString()}**`)
                    .setFooter({text: "Bot par Merlode#8128"});
                // detect if file is an image
                if (properties.name.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    embed.setImage("attachment://" + properties.name);
                }
                interaction.editReply({
                    content: null,
                    embeds: [embed],
                    files: [properties.attachment],
                    components,
                    fetchReply: true
                }).then(async e => {
                    if (!e) e = await interaction.fetchReply();
                    embed.setURL(e.attachments.first().url);
                    interaction.message.edit({embeds: [embed]});
                });
            }
        });
    } else if (interaction.customId.startsWith("select_note")) {
        const type = interaction.customId.split("-")[1];
        console.log(interaction.customId);
        console.log(type);
        let data = [];
        if (type === "recent") {
            client.cache.marks.subjects.forEach(s => {
                if (s.marks.length) data = data.concat(s.marks.map(mark => {
                    mark.subject = s.name;
                    return mark;
                }));
            });
            data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 25);
        } else {
            data = client.cache.marks.subjects.find(s => s.name === type);
        }

        const embed = new EmbedBuilder();
        const components = [];
        const selectNote = new SelectMenuBuilder()
            .setCustomId(interaction.customId)
            .setPlaceholder("Voir plus de précisions sur une note")
            .setMinValues(0)
            .setMaxValues(1);
        components.push(new ActionRowBuilder().addComponents(selectNote));
        const attachments = [];

        if (interaction.values.length > 0) {
            const value = interaction.values[0];
            let mark = data?.marks?.find(m => m.id === value);
            if (!mark) mark = data.find(m => m.id === value);
            if (mark) {
                let subject = data;
                if (type === "recent") {
                    subject = client.cache.marks.subjects.find(s => s.name === mark.subject);
                }

                embed.setAuthor({
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
                    embed.author.url = "https://youtu.be/dQw4w9WgXcQ";
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
                selectNote.addOptions(data.marks ?
                    data.marks.map(m => {
                        return {
                            label: (m.value + "/" + m.scale) + (m.title ? (" - " + m.title) : ""),
                            value: m.id,
                            description: `${m.subject} - ${moment(m.date).format("dddd Do MMMM")}`,
                            emoji: "📝",
                            default: m.id === value
                        };
                    })
                    :
                    data.map(m => {
                        return {
                            label: m.subject + " - " + (m.value + "/" + m.scale),
                            value: m.id,
                            description: `${m.subject} - ${moment(m.date).format("dddd Do MMMM")}`,
                            emoji: "📝",
                            default: m.id === value
                        };
                    }));
            } else {
                interaction.message.edit({content: "Une erreur est survenue, veuillez réessayer.", embeds: []});
            }
        } else {
            embed.setColor("#70C7A4");

            if (type === "recent") {
                embed.setAuthor({
                    name: "Notes générales",
                    iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                    url: process.env.PRONOTE_URL,
                })
                    .setTitle("Moyenne générale: " + client.cache.marks.averages.student)
                    .addFields(data.map(mark => {
                        mark.date = new Date(mark.date);
                        return {
                            name: mark.subject,
                            value: "Note: **" + mark.value + "/" + mark.scale +
                                "**\nLe: " + mark.date.toLocaleDateString() +
                                "\nMoyenne du groupe: " + mark.average + "/" + mark.scale,
                            inline: false
                        };
                    }))
                    .setImage("attachment://graph.png")
                    .setFooter({text: "Bot par Merlode#8128"});
                const graph = await generateCanvas(client.cache.marks.averages.history.map(o => o.student), client.cache.marks.averages.history.map(o => {
                    o.date = new Date(o.date);
                    return o.date.toLocaleDateString();
                }));
                attachments.push(graph);
                selectNote.addOptions(data.map(mark => {
                    mark.date = new Date(mark.date);
                    return {
                        label: mark.subject + " - " + (mark.value + "/" + mark.scale),
                        value: mark.id,
                        description: "Le " + mark.date.toLocaleDateString(),
                        emoji: "📝",
                    };
                }))
                    .setCustomId("select_note-recent");
            } else {
                embed.setAuthor({
                    name: data.name,
                    iconURL: "https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png",
                    url: process.env.PRONOTE_URL,
                })
                    .setTitle("Moyenne: " + data.averages.student)
                    .setColor(data.color)
                    .addFields(data.marks.reverse().map(mark => {
                        mark.date = new Date(mark.date);
                        return {
                            name: "Le " + mark.date.toLocaleDateString(),
                            value: "Note: **" + mark.value + "/" + mark.scale + "**\nMoyenne du groupe: " + mark.average + "/" + mark.scale,
                            inline: false
                        };
                    }))
                    .setImage("attachment://graph.png")
                    .setFooter({text: "Bot par Merlode#8128"});

                const graph = await generateCanvas(data.averagesHistory.map(o => o.student), data.averagesHistory.map(o => {
                    o.date = new Date(o.date);
                    return o.date.toLocaleDateString();
                }));
                attachments.push(graph);
                selectNote.addOptions(data.marks.map(mark => {
                    return {
                        label: (mark.value + "/" + mark.scale) + (mark.title ? (" - " + mark.title) : ""),
                        value: mark.id,
                        description: "Le " + mark.date.toLocaleDateString(),
                        emoji: "📝"
                    };
                }))
                    .setCustomId("select_note-" + data.name);
            }
        }
        interaction.message.edit({embeds: [embed], components, files: attachments});
    }
};