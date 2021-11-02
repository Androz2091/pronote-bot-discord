const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");

module.exports = {
    data: {
        name: scriptName,
        description: "Vérifier de nouveau les nouvelles notifications",
        options: [],
    },
    execute: async interaction => {
        await require("../utils/pronoteSynchronization")(interaction.client);

        return interaction.editReply("✅ | Une nouvelle vérification a bien été effectuée");
    },
};