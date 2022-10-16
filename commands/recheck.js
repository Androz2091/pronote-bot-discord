

module.exports = {
    data: {
        description: "Vérifier de nouveau les nouvelles notifications",
        options: [],
    },
    execute: async (client, interaction) => {
        delete require.cache[require.resolve("../utils/pronoteSynchronization")];
        await require("../utils/pronoteSynchronization")(client);

        return interaction.editReply("✅ | Une nouvelle vérification a bien été effectuée");
    },
};