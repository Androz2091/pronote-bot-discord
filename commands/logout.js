module.exports = {
    data: {
        name: "logout",
        description: "Se déconecter de Pronote",
        options: [],
    },
    execute: async interaction => {
        interaction.client.session.setKeepAlive(false);
        await interaction.client.session.logout();

        await interaction.editReply("✅ | Je me suis bien déconnecté de **Pronote** !\n*Note: À la nouvelle vérification, je me reconnecterai*");
    },
};