const cache = require("../cache_1G1.json");
const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    data: {
        name: scriptName,
        description: "Vous donne l'historique des moyennes sur 25 périodes",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "matière",
                description: "Sélectionne l'historique d'une matière spécifique",
                required: false,
                choices: cache.marks.subjects.map(mark => {
                    return {name: mark.name.toUpperCase(), value: mark.name};
                })
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "moyenne",
                description: "Sélectionne l'historique d'une moyenne spécifique",
                required: false,
                choices: [
                    {name: "Élève", value: "student"},
                    {name: "Classe", value: "studentClass"}
                ]
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: "nombre",
                description: "Donne le nombre de valeur à afficher",
                required: false,
                min_value: 1,
                max_value:25
            }
        ],
    },
    execute: async interaction => {
        const subject = interaction.options.getString("matière", false);
        const averageType = interaction.options.getString("moyenne", false) ?? "student";
        let number = interaction.options.getInteger("nombre", false) ?? 25;

        if (number < 0) number = -number;
        if (number > 25) number = 25;
        if (number === 0) number = 1;
        let data = [];

        if (subject) {
            data = interaction.client.cache.marks.subjects.find(s => s.name === subject).averagesHistory;
        } else {
            data = interaction.client.cache.marks.averages.history;
        }

        const embed = new EmbedBuilder()
            .setColor("#70C7A4")
            .setTitle(`Historique des moyennes ${subject ? `de \`${subject.toUpperCase()}\` ` : ""}pour ${averageType === "student" ? "l'élève": "la classe"}`)
            .setFooter({text: "Bot par Merlode#8128"});

        data.splice(number);
        data.forEach((average, index) => {
            const timestamp = new Date(average.date);
            const day = `${timestamp.getDate()}`.length === 1 ? `0${timestamp.getDate()}` : timestamp.getDate();
            const month = `${timestamp.getMonth()+1}`.length === 1 ? `0${timestamp.getMonth()+1}` : (timestamp.getMonth()+1);

            let editStr = "";
            if (data[index-1]) {
                const edit = Math.round((average[averageType] - data[index - 1][averageType]) * 100) / 100;
                editStr = `\n*Modification: ${edit > 0 ? "+"+edit : ""}*`;
            }

            embed.addFields([{
                name: day  +"/" + month + "/" + timestamp.getFullYear(),
                value: `**Moyenne: ${average[averageType]}**` + editStr
            }]);
        });
        return interaction.editReply({embeds: [embed]});
    },
};