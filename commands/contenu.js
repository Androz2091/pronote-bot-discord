const { EmbedBuilder, ApplicationCommandOptionType, SelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { NodeHtmlMarkdown } = require("node-html-markdown");


module.exports = {
    data: {
        description: "Vous fournis le contenu d'un cours",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "matière",
                description: "Sélectionne la matière",
                required: true,
                autocomplete: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "date",
                description: "Sélectionne la date du cours",
                required: false,
                autocomplete: true
            }
        ],
    },
    execute: async (client, interaction) => {
        await client.session.contents(new Date(new Date().getFullYear(), 8, 1), new Date()).then(async (contents) => {

            const subject = interaction.options.getString("matière");
            const date = interaction.options.getString("date");
            let data = contents.filter(o => o.subject === subject);
            if (!data.length) return interaction.editReply("⚠ | Aucune donnée n'a été trouvée pour cette matière");

            const components = [];
            const stringDays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

            let dateObj = null;
            if (date) {
                const parsedValue = date.split(/\s+/);
                const dateValue = parsedValue[0].split("/");
                const timeValue = parsedValue[1].replace("h", "");

                dateObj = new Date(parseInt(dateValue[2]), parseInt(dateValue[1]) - 1, parseInt(dateValue[0]), parseInt(timeValue));
            }

            if (data.length > 1) {
                const menu = new SelectMenuBuilder()
                    .setCustomId("content_select")
                    .setPlaceholder("Sélectionnez une date")
                    .addOptions(data.map(o => {
                        return {
                            label: o.from.toLocaleDateString() + " " + o.from.getHours() + "h",
                            value: subject + "-" + o.from.toLocaleDateString() + "-" + o.from.getHours(),
                            description: stringDays[o.from.getDay()] + " " + o.from.toLocaleDateString() + " " + o.from.getHours() + "h",
                            default: o.from.getTime() === dateObj?.getTime()
                        };
                    }).reverse().splice(0, 25))
                    .setMinValues(1)
                    .setMaxValues(1);
                components.push(new ActionRowBuilder().addComponents(menu));
            }

            if (dateObj) {
                data = data.filter(o => o.from.getTime() === dateObj.getTime());
            }
            if (!data.length) return interaction.editReply("⚠ | Aucune donnée n'a été trouvée pour cette date");

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

            await interaction.editReply({embeds: [embed], components: components, files: attachments, fetchReply: true});

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
                    await interaction.editReply({embeds: [embed]});
                }
            }
        });
    },
};