const { EmbedBuilder } = require("discord.js");
const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");

module.exports = {
    data: {
        name: scriptName,
        description: "Ping le bot",
        options: [],
    },
    execute: async interaction => {
        const msg = await interaction.fetchReply();
        const client = interaction.client;

        const embed = new EmbedBuilder()
            .setColor("#70C7A4")
            .setTitle("🏓Pong !")
            .addFields([
                {
                    name: "Lantance du bot",
                    value: `**${msg.createdTimestamp - interaction.createdTimestamp}**ms`,
                },
                {
                    name: "Latance de l'API",
                    value: `**${Math.round(interaction.client.ws.ping)}**ms`,
                },
                {
                    name: "Mémoire",
                    value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}\` MB`,
                    inline: true,
                },
                {
                    name: "Temps de fonctionnement",
                    value: `${Math.floor(client.uptime / 1000 / 60).toString()} minutes`,
                    inline: true,
                },
                {
                    name: "Version",
                    value: `\`discord.js : ${require("../package.json").dependencies["discord.js"]}\`\n\`node.js : ${process.version}\``,
                    inline: true,
                },
                {
                    name: "Salons",
                    value: `${client.channels.cache.size.toString()}`,
                    inline: true,
                },
                {
                    name: "Utilisateurs",
                    value: `${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)}`,
                    inline: true,
                },
            ])
            .setFooter({text: "Bot par Merlode#8128"});
        return interaction.editReply({embeds: [embed], content: " "}).catch(console.error);
    }
};