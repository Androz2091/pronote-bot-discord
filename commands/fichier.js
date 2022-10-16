const { EmbedBuilder, ApplicationCommandOptionType, SelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        description: "Vous fournis le contenu d'un cours",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "matière",
                description: "Sélectionnez la matière",
                required: true,
                autocomplete: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "fichier",
                description: "Sélectionnez le fichier voulu",
                required: false,
                autocomplete: true
            }
        ],
    },
    execute: async (client, interaction) => {
        await client.session.files().then(async (files) => {
            const subject = interaction.options.getString("matière");
            let data = files.filter(f => f.subject === subject);
            const file = interaction.options.getString("fichier");

            if (!data.length) interaction.editReply("⚠ | Aucune donnée n'a été trouvée pour cette matière");

            const components = [];
            if (data.length > 1) {
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
                            default: f.id === file
                        });
                    }));
                components.push(new ActionRowBuilder().addComponents(selectMenu));
            }

            let dataToSend = data.find(f => f.id === file);
            if (!dataToSend) dataToSend = data[0];

            const properties = await client.functions.getFileProperties(dataToSend);
            if (properties.type === "link") {
                interaction.editReply({
                    content: `🔗 | [${properties.name ?? properties.url}](${properties.url} "${properties.url}")`,
                    components
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
                    embeds: [embed],
                    files: [properties.attachment],
                    components,
                    fetchReply: true
                }).then(async e => {
                    if (!e) e = await interaction.fetchReply();
                    embed.setURL(e.attachments.first().url);
                    interaction.editReply({embeds: [embed]});
                });
            }

        });

    },
};