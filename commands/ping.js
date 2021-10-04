const { MessageEmbed } = require("discord.js");

module.exports = {
    data: {
        name: "ping",
        description: "Ping le bot",
        options: [],
    },
    execute: async interaction => {
        const msg = await interaction.fetchReply();
        const client = interaction.client;

        const embed = new MessageEmbed()
            .setColor("#70C7A4")
            .setTitle("🏓Pong !")
            .addField("Latance du bot", `**${msg.createdTimestamp - interaction.createdTimestamp}**ms`)
            .addField("Latance de l'API", `**${Math.round(interaction.client.ws.ping)}**ms`)
            .addField("Mémoire", `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}\` MB`, true)
            .addField("Temps de fonctionnement", `${Math.floor(client.uptime / 1000 / 60).toString()} minutes`, true)
            .addField("Version", `\`discord.js : ${require("../package.json").dependencies["discord.js"]}\``, true)
            .addField("Salons", `${client.channels.cache.size.toString()}`, true)
            .addField("Utilisateurs", `${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)}`, true);
        return interaction.editReply({embeds: [embed], content: " "}).catch(console.error);
    }
};