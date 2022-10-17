const { AttachmentBuilder, EmbedBuilder, ApplicationCommandOptionType, Colors, SelectMenuBuilder, ActionRowBuilder} = require("discord.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const width = 800;
const height = 300;
// White color and bold font
const ticksOptions = { ticks: { font: {weight: "bold"}, color: "#fff"} };
const options = {
    // Hide legend
    plugins: {legend: { /*display: false,*/ labels: {
        font: {weight: "bold"}, color: "#fff"
    }}},
    scales: { yAxes: ticksOptions, xAxes: ticksOptions }
};

const generateCanvas = async (joinedXDays, lastXDays) => {
    const canvasRenderService = new ChartJSNodeCanvas({ width, height });
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


module.exports = {
    data: {
        description: "Voir vos notes",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "matière",
                description: "Sélectionnez la matière voulue",
                required: false,
                autocomplete: true,
            }
        ],
    },
    execute: async (client, interaction) => {
        const subject = interaction.options.getString("matière", false);
        let data = [];
        
        if (subject) {
            data = client.cache.marks.subjects.find(s => s.name === subject);
        } else {
            // Get the 25 last marks
            client.cache.marks.subjects.forEach(s => {
                if (s.marks.length) {
                    s.marks.forEach(m => {
                        m.subject = s.name;
                    });
                    data = data.concat(s.marks);
                }
            });
            data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 25);
            // supprimer les doublons
            data = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        }
        if (!data) return interaction.editReply({
            embeds: [new EmbedBuilder()
                .setTitle("Erreur")
                .setDescription("Aucune donnée n'a été trouvée. Réessayez plus tard, une fois que vous aurez des notes")
                .setColor(Colors.Red)
            ]
        });

        const embed = new EmbedBuilder()
            .setColor("#70C7A4");
        const attachments = [];
        const components = [];
        const selectNote = new SelectMenuBuilder()
            .setPlaceholder("Voir plus de précisions sur une note")
            .setMinValues(0)
            .setMaxValues(1);
        components.push(new ActionRowBuilder().addComponents(selectNote));

        if (subject) {
            embed.setAuthor({
                name: subject,
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
        } else {
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
                console.log(mark.id);
                return {
                    label: mark.subject + " - " + (mark.value + "/" + mark.scale),
                    value: mark.id,
                    description: "Le " + mark.date.toLocaleDateString(),
                    emoji: "📝"
                };
            }))
                .setCustomId("select_note-recent");
        }


        return interaction.editReply({embeds: [embed], files: attachments, components}).catch(console.error);
    },
};