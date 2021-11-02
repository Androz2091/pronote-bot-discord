const fs = require("fs");
const scriptName = __filename.split(/[\\/]/).pop().replace(".js", "");

module.exports = {
    forDebug: true,
    data: {
        name: scriptName,
        description: "Modifie les arguments des slash commands",
        options: [],
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
        const commands = await client.application.commands.fetch();
        await fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).forEach(file => {
            delete require.cache[require.resolve(`../commands/${file}`)];
            const commandData = require(`../commands/${file}`);
            const command = commands.find(c => c.name === file.replace(".js", ""));
            if (!command) {
                if (process.env.DEBUG_MODE === "true") {
                    client.application.commands.create(commandData.data).catch(console.error);
                } else if (!commandData.forDebug) client.application.commands.create(commandData.data).catch(console.error);
            } else if (command.description !== commandData.data.description || command.options !== commandData.data.options) {
                command.edit(commandData.data);
            }
        });
        return interaction.editReply("✅ | Les commandes ont bien été rechargées");
    }
};