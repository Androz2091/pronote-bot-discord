const { EmbedBuilder } = require("discord.js");


module.exports = {
    data: {
        description: "Vous donne la liste des commandes",
        options: [],
    },
    execute: async (client, interaction) => {
        let commandString = (await client.application.commands.fetch()).map(c => `</${c.name}:${c.id}>: ${c.description}`).join("\n");
        let strings = client.functions.splitMessage(commandString, { maxLength: 1024 });
        const embed = new EmbedBuilder()
            .setColor("#70C7A4")
            .setTitle("Liste des commandes")
            .setFooter({text: "Bot par Merlode#8128"})
            .setDescription(
                "Le bot a été développé par Merlode#8128 et est open-source sur [GitHub](https://github.com/Merlode11/pronote-bot-discord)\n"
                + "Le bot utilise les commandes slash de Discord, pour les utiliser, il suffit de taper `/` dans un salon textuel.\n")
            .addFields(strings.map((s, i) => ({name: i === 0 ? "Commandes" : "\u200b", value: s, inline: false})));
        return interaction.editReply({ embeds: [embed] });
    },
};