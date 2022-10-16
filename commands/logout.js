

module.exports = {
    data: {
        description: "Se déconecter de Pronote",
        options: [],
    },
    execute: async (client, interaction) => {
        client.session.setKeepAlive(false);
        await client.session.logout();

        return await interaction.editReply("✅ | Je me suis bien déconnecté de **Pronote** !\n*Note: À la nouvelle vérification, je me reconnecterai*");
    },
};