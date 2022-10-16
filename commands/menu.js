const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        description: "Vous fournis le menu d'aujourd'hui",
        options: []
        ,
    },
    execute: async (client, interaction) => {
        await client.session.menu().then(async (menus) => {
            const menu = menus[0];

            const embed = new EmbedBuilder()
                .setTitle("Menu du jour")
                .setColor("#70C7A4");
            if (menu) embed
                .setDescription(`Menu du ${menu.date}`)
                .setTimestamp(new Date(menu.date))
                .addFields(menu.meals.map((meal) => {
                    return {
                        name: meal.name,
                        value: meal.labels.map((label) => {
                            return `• ${label}`;
                        }),
                        inline: false
                    };
                }));
            else embed.setDescription("Aucun menu n'a été trouvé pour aujourd'hui");

            const warnEmbed = new EmbedBuilder()
                .setTitle("Attention")
                .setDescription("Cette commande est en cours de développement. Comme le développeur ne possède pas les menus sur son pronote, il ne peut pas tester correctement cette commande. Si vous rencontrez des problèmes ou que vous voulez aider, merci de contacter le développeur sur github.")
                .setColor("#FFA500");

            return await interaction.editReply({
                embeds: [embed, warnEmbed],
                components: [client.bugActionRow]
            });
        });

    },
};