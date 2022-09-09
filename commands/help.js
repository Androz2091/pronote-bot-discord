const { EmbedBuilder } = require("discord.js");
const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");

module.exports = {
    data: {
        name: scriptName,
        description: "Vous donne la liste des commandes",
        options: [],
    },
    execute: async interaction => {
        const client = interaction.client;

        const embed = new EmbedBuilder()
            .setColor("#70C7A4")
            .setTitle("Liste des commandes")
            .setFooter({text: "Bot par Merlode#8128"})
            .setDescription(
                "Le bot a été développé par Merlode#8128 et est open-source sur [GitHub](https://github.com/Merlode11/pronote-bot-discord)\n"
                + "Le bot utilise les commandes slash de Discord, pour les utiliser, il suffit de taper `/` dans un salon textuel.\n")
            .addFields([
                {
                    name: "Commandes",
                    value: (await client.application.commands.fetch()).map(c => `</${c.name}:${c.id}>: ${c.description}`).join("\n"),
                }
            ]);
        interaction.editReply({ embeds: [embed] });
    },
};