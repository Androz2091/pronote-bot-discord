
const { AttachmentBuilder, EmbedBuilder, ApplicationCommandOptionType, Colors } = require("discord.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const width = 800;
const height = 300;
// White color and bold font
const ticksOptions = { ticks: { font: {weight: "bold"}, color: "#fff"} };
const options = {
    // Hide legend
    plugins: {legend: { /*display: false,*/ labels: {
        font: {weight: "bold"}, color: "#fff"
    }}},
    scales: { yAxes: ticksOptions, xAxes: ticksOptions }
};

const generateCanvas = async (joinedXDays, lastXDays) => {
    const canvasRenderService = new ChartJSNodeCanvas({ width, height });
    const image = await canvasRenderService.renderToBuffer({
        type: "line",
        data: {
            labels: lastXDays,
            datasets: [
                {
                    label: "Moyenne",
                    data: joinedXDays,
                    // The color of the line (the same as the fill color with full opacity)
                    borderColor: "#70C7A4",
                    // Fill the line with color
                    fill: true,
                    // Blue color and low opacity
                    backgroundColor: "rgba(112,199,164,0.1)"
                }
            ]
        },
        options
    });
    return new AttachmentBuilder(image, {
        name: "graph.png",
        description: "Graphique de l'évolution de la moyenne"
    });
};


module.exports = {
    data: {
        description: "Génère un graphique de l'évolution des moyennes",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "matière",
                description: "Sélectionnez l'historique d'une matière voulue",
                required: false,
                autocomplete: true,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "moyenne",
                description: "Sélectionnez l'historique d'une moyenne spécifique",
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
            }
        ],
    },
    execute: async (client, interaction) => {
        const subject = interaction.options.getString("matière", false);
        const averageType = interaction.options.getString("moyenne", false) ?? "student";
        let number = interaction.options.getInteger("nombre", false) ?? 25;

        if (number < 0) number = -number;
        if (number > 25) number = 25;
        if (number === 0) number = 1;
        let data = [];
        
        if (subject) {
            data = client.cache.marks.subjects.find(s => s.name === subject)?.averagesHistory;
        } else {
            data = client.cache.marks.averages?.history;
        }
        if (!data) return interaction.editReply({
            embeds: [new EmbedBuilder()
                .setTitle("Erreur")
                .setDescription("Aucune donnée n'a été trouvée. Réessayez plus tard, une fois que vous aurez des notes")
                .setColor(Colors.Red)
            ]
        });
        data.splice(number);

        const graph = await generateCanvas(data.map(o => o[averageType]), data.map(o => {
            const timestamp = new Date(o.date);
            const day = `${timestamp.getDate()}`.length === 1 ? `0${timestamp.getDate()}` : timestamp.getDate();
            const month = `${timestamp.getMonth()+1}`.length === 1 ? `0${timestamp.getMonth()+1}` : (timestamp.getMonth()+1);

            return day  +"/"+ month+"/"+ timestamp.getFullYear();
        }));
        const embed = new EmbedBuilder()
            .setColor("#70C7A4")
            .setTitle(`Graphique des moyennes ${subject ? `de \`${subject.toUpperCase()}\` ` : ""}pour ${averageType === "student" ? "l'élève": "la classe"}`)
            .setImage("attachment://graph.png")
            .setFooter({text: "Bot par Merlode#8128"});


        return interaction.editReply({embeds: [embed], files: [graph]}).catch(console.error);
    },
};