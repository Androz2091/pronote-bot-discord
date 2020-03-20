const channels = require("./channels.json");

const config = require("./config.json");

const fetchDevoirs = require("./fetchDevoirs");

const Discord = require("discord.js");
const client = new Discord.Client();

let cache = require("./cache.json");

const beautify = require("json-beautify");
const { promises } = require("fs");
const updateCache = async (devoirs) => {
    cache = devoirs;
    return await promises.writeFile("cache.json", beautify(devoirs, null, 4, 100));
}

const getAdded = (devoirs) => {
    const added = [];
    devoirs.forEach((devoir) => {
        if(!cache.some((d) => d.content === devoir.content)){
            added.push(devoir);
        }
    });
    return added;
};

const check = async () => {
    const devoirs = await fetchDevoirs(config.entUsername, config.entPassword);
    const devoirsAdded = getAdded(devoirs);
    updateCache(devoirs);
    devoirsAdded.forEach((devoir) => {
        const embed = new Discord.MessageEmbed()
        .setAuthor("Nouveau devoir en "+devoir.matiere, client.user.displayAvatarURL())
        .addField("Contenu", devoir.content)
        .addField("Date", devoir.date, true)
        .setColor("#70C7A4");
        const channel = channels.find((e) => e[1] === devoir.matiere)[0];
        if(!channel) return client.channels.get("690299067502297190").send(embed);
        client.channels.cache.get(channel).send(embed).then((e) => {
            e.react("👀");
        });
    });
};

setInterval(() => {
    check();
}, 60000*15);

client.on("ready", () => {
    console.log(`Ready. Logged as ${client.user.tag}!`);
});

client.on("message", async (message) => {
    if(message.content === "!check" && message.author.id === config.ownerID){
        check();
    }
});

client.login(config.token);
