const fs = require("fs");
const pronote = require("pronote-api-maintained");
const {EmbedBuilder, Colors} = require("discord.js");

module.exports = async (client, interaction) => {
    try {
        if (!fs.existsSync(`./commands/${interaction.commandName}.js`)) {
            return await interaction.reply({content: "⚠ | La commande n'a pas été trouvée", ephemeral: true});
        }
        await interaction.deferReply({
            fetchReply: true,
            ephemeral: false
        });

        if (!client.session) {
            const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
            client.session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas).catch(console.error);
        }

        delete require.cache[require.resolve(`../commands/${interaction.commandName}`)];
        await require(`../commands/${interaction.commandName}`).execute(client, interaction);
    } catch (error) {
        console.error(error);
        let errorString = error;
        if (error.toString() === "[object Object]") {
            errorString = JSON.stringify(error);
        }
        if (interaction.replied) await interaction.followUp(
            {
                content: "⚠ | Il y a eu une erreur lors de l'exécution de la commande!",
                embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(errorString.toString())],
                components: [client.bugActionRow],
            }
        );
        else if (interaction.deferred) await interaction.editReply(
            {
                content: "⚠ | Il y a eu une erreur lors de l'exécution de la commande!",
                embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(errorString.toString())],
                components: [client.bugActionRow],
            }
        );
        else await interaction.reply({
            content: "⚠ | Il y a eu une erreur lors de l'exécution de la commande!",
            embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(errorString.toString())],
            components: [client.bugActionRow],
        }).catch(console.error);
    }

    setTimeout(async () => {
        if (client.session) {
            await client.session.logout();
            client.session = null;
        }
    }, 5 * 60 * 1000);
};