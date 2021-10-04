module.exports = {
    data: {
        name: "recheck",
        description: "Vérifier de nouveau les nouvelles notifications",
        options: [],
    },
    execute: async interaction => {
        await require("../utils/pronoteSynchronization")(interaction.client);

        return interaction.editReply("✅ | Une nouvelle vérification a bien été effectuée");
    },
};