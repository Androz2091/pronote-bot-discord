const matieresData = require("./matieres-data.json");
const config = require("./config.json");
const fetchDevoirs = require("./fetchDevoirs");

const Discord = require("discord.js");
const client = new Discord.Client();

let cache = require("./cache.json");

const beautify = require("json-beautify");
const { promises } = require("fs");
const updateCache = async (devoirs) => {
    cache = devoirs;
    return await promises.writeFile("./cache.json", beautify(devoirs, null, 4, 100));
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

const syncCache = async () => {
    const devoirs = await fetchDevoirs(config.entUsername, config.entPassword);
    updateCache(devoirs);
};

const check = async () => {
    const devoirs = await fetchDevoirs(config.entUsername, config.entPassword);
    const devoirsAdded = getAdded(devoirs);
    updateCache(devoirs);
    devoirsAdded.forEach((devoir) => {
        const matiereData = matieresData[devoir.matiereName];
        const embed = new Discord.MessageEmbed()
        .setTitle(`${matiereData.emoji} | Nouveau devoir en ${matiereData.formattedName}`)
        .setURL("https://adrienne-bolland.ecollege.haute-garonne.fr/sg.do?PROC=TRAVAIL_A_FAIRE&ACTION=AFFICHER_ELEVES_TAF&filtreAVenir=true")
        .addField("Contenu", devoir.contenu)
        .addField("Devoir à faire/rendre pour le", devoir.aRendre.split("Pour le ")[1], true)
        .addField("Devoir donné le", devoir.donneLe.split("Donné le ")[1], true)
        .addField("Fichiers en pièce jointe", devoir.files <= 0 ? "Aucun fichier attaché." : devoir.files.map((file) => {
            const fileParts = file.title.split("-");
            fileParts.pop();
            return `[${fileParts.join("-")}](${file.link}) (${file.size})`
        }).join("\n"), false)
        .setColor("#70C7A4");
        client.channels.cache.get(matiereData.channelID || "693773027233759272").send(embed).then((e) => {
            e.react("✅");
        });
    });
};

setInterval(() => {
    check();
}, 60000*15);

client.on("ready", () => {
    console.log(`Ready. Logged as ${client.user.tag}!`);
    client.user.setActivity("Pronote", {
        type: "WATCHING"
    });
});

client.on("message", async (message) => {
    if(message.content === "!check" && message.author.id === config.ownerID){
        check();
    }
    if(message.content === "!cache" && message.author.id === config.ownerID){
        syncCache();
    }
});

const clean = text => {
    if (typeof(text) === "string")
      return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
  }

client.on("message", message => {
    const args = message.content.split(" ").slice(1);
   
    if (message.content.startsWith("!eval")) {
      try {
        const code = args.join(" ");
        let evaled = eval(code);
   
        if (typeof evaled !== "string")
          evaled = require("util").inspect(evaled);
   
        message.channel.send(clean(evaled), {code:"xl"});
      } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
      }
    }
  });

client.login(config.token);
