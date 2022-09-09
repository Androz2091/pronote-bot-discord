const { EmbedBuilder } = require("discord.js");
const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");

module.exports = {
    data: {
        name: scriptName,
        description: "Vous fournis l'emploi du temps de la journée",
        options: [],
    },
    execute: async interaction => {
        const client = interaction.client;

        await client.session.timetable().then((cours) => {
            const embed = new EmbedBuilder()
                .setColor("#70C7A4")
                .setTitle("Vous avez " + cours.length + " cours aujourd'hui :")
                .setFooter({text: "Bot par Merlode#8128"})
                .addFields(cours.map((cour) => {
                    const subHomeworks = client.cache.homeworks.filter(h => h.subject === cour.subject && cour.from.getDate()+"/"+cour.from.getMonth() === h.for.getDate()+"/"+h.for.getMonth());
                    return {
                        name: cour.subject.toUpperCase(cour.subject),
                        value: "Professeur: " + cour.teacher +
                            "\nSalle: " + (cour.room ?? " ? ") +
                            "\nÀ " + cour.from.toLocaleTimeString().split(":")[0] +
                            "h" + cour.from.toLocaleTimeString().split(":")[1] +
                            (subHomeworks.length && (!cour.isCancelled || !cour.isAway) ? `\n⚠**__\`${subHomeworks.length}\` Devoirs__**` : "") +
                            (cour.isCancelled || cour.isAway ? "\n⚠__**Cour annulé**__" : "")
                    };
                }));

            interaction.editReply({ embeds: [embed] });
        });

    },
};