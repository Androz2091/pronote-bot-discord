function getFetchDate(session){
    let from = new Date();
    if (from < session.params.firstDay) {
        from = session.params.firstDay;
    }

    const to = new Date(from.getTime());

    return { from, to };
}
const { MessageEmbed } = require("discord.js");

module.exports = {
    data: {
        name: "infos",
        description: "Vous fournis les informations sur 'élève",
        options: [],
    },
    execute: async interaction => {
        const session = interaction.client.session;
        
        const { from, to } = getFetchDate(session);
        const timetable = await session.timetable(from, to);
        const alltimetable = await session.timetable(session.params.firstDay, session.params.lastDay);

        const evaluations = await session.evaluations();
        const absences = await session.absences();
        const nombreAbsences = absences.absences.length;
        const nombreRetards = absences.delays.length;
        const allhomeworks = await session.homeworks(session.params.firstDay, session.params.lastDay);
        const name = session.user.name;
        const classe = session.user.studentClass.name;

        const marks = await session.marks(session.params.firstDay, session.params.lastDay);
        const count = marks.subjects.filter(e => e !== "Abs").length;
        const moyenne = Math.floor(marks.subjects.map((value) => value.averages.student).reduce((a, b) => a + b) / count *100) / 100;

        const embed = new MessageEmbed()
            .setColor("#70C7A4")
            .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({dynamic: true}))
            .setThumbnail(session.user.avatar)
            .setTitle(name+", "+classe)
            .setDescription("Cours aujourd'hui/Année : "+timetable.length+" | "+alltimetable.length+"\nControles : "+evaluations.length+"\nAbsences/Retards : "+nombreAbsences+"/"+nombreRetards+"\nDevoirs : "+allhomeworks.length+"\nMoyenne : "+moyenne);

        return await interaction.editReply({
            embeds: [embed]
        });
    },
};