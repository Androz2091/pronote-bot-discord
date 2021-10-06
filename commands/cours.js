const { MessageEmbed } = require("discord.js");

module.exports = {
    data: {
        name: "cours",
        description: "Vous fournis l'emploi du temps de la journée",
        options: [],
    },
    execute: async interaction => {
        const client = interaction.client;
        client.session.timetable().then((cours) => {
            const embed = new MessageEmbed()
                .setColor("#70C7A4")
                .setTitle("Vous avez " + cours.length + " cours aujourd'hui :");
            embed.fields = cours.map((cour) => {
                return {
                    name: cour.subject.toLowerCase(cour.subject),
                    value: "Professeur: " + cour.teacher +
                    "\nSalle: " + (cour.room ?? " ? ") +
                    "\nÀ " + cour.from.toLocaleTimeString().split(":")[0] +
                    "h" + cour.from.toLocaleTimeString().split(":")[1] +
                    (cour.isCancelled || cour.isAway ? "\n⚠__**Cour annulé**__" : "")
                };
            });

            interaction.editReply({ embeds: [embed] });
        });

    },
};