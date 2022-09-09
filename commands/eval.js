const Discord = require("discord.js");
const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");

module.exports = {
    forDebug: true,
    data: {
        name: scriptName,
        description: "Teste un code avec le bot",
        options: [
            {
                type: Discord.ApplicationCommandOptionType.String,
                name: "code",
                description: "Le code a tester",
                required: true
            }
        ],
    },
    execute: async interaction => {
        const client = interaction.client;
        // Owner verification
        client.application = await client.application.fetch();
        let owner = client.application.owner;
        if (!owner.tag) {
            owner = owner.owner;
        }
        if (owner.id !== interaction.user.id) {
            return interaction.editReply("❌ | Vous n'avez pas la permission de faire cette commande !");
        }
        let content = interaction.options.getString("code", true);

        if (content.includes("client.token")) {
            content = content
                .replace("client.token", "'[TOKEN HIDDEN]'");

        }
        const result = await new Promise(async (resolve) => resolve(await eval(content)));
        return result.then(async (output) => {
            if (typeof output !== "string") {
                output = require("util").inspect(output, { depth: 0 });
            }
            if (output.includes(client.token)) {
                output = output.replace(client.token, "[TOKEN HIDDEN]");
            }
            return interaction.editReply({
                embeds: [new Discord.EmbedBuilder().setColor("#36393F").setDescription("```js\n"+output+"\n```")],
                components: [client.bugActionRow]
            });
        }).catch(async (err) => {
            err = err.toString();
            if (err.includes(client.token)) {
                err = err.replace(client.token, "[TOKEN HIDDEN]");
            }
            return interaction.editReply({
                embeds: [new Discord.EmbedBuilder().setColor("#36393F").setDescription("```js\n"+err+"\n```")],
                components: [client.bugActionRow]
            });
        });
    }
};