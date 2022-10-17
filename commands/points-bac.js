const { EmbedBuilder, SelectMenuBuilder, ActionRowBuilder, ApplicationCommandOptionType } = require("discord.js");

const fs = require("fs");

delete require.cache[require.resolve("../utils/subjects")];
const subjects = require("../utils/subjects");

const nameGenerator = (subject) => {
    if (subjects[subject]) {
        return subjects[subject].name;
    } else if (subject === "specialite") {
        return "Spécialité abandonnée";
    } else if (subject.startsWith("opt")) {
        return "Option " + subject.replace("opt", "");
    } else if (subject.startsWith("specialite")) {
        return "Spécialité " + subject.replace("opt", "");
    } else if (subject === "fr_ecrit") {
        return "Écrit de français *(Épreuve)*";
    } else if (subject === "fr_oral") {
        return "Oral de français *(Épreuve)*";
    } else if (subject === "grand_oral") {
        return "Grand oral *(Épreuve)*";
    }
    return subject.charAt(0).toUpperCase() + subject.slice(1);
};

module.exports = {
    data: {
        description: "Voir le nombre de points que vous avec actuellement pour le BAC",
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: "fr-oral",
                description: "Note de l'épreuve de français orale de première",
                required: false,
                minValue: 0,
                maxValue: 20,
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: "fr-ecrit",
                description: "Note de l'épreuve de français écrite de première",
                required: false,
                minValue: 0,
                maxValue: 20,
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: "philosophie",
                description: "Note de l'épreuve de philosophie en terminale",
                required: false,
                minValue: 0,
                maxValue: 20,
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: "grand-oral",
                description: "Note de l'épreuve du grand oral en terminale",
                required: false,
                minValue: 0,
                maxValue: 20,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "specialite1",
                description: "Note de l'épreuve de spécialité 1 en terminale. Si vous avez plusieurs notes, séparez-les par \",\"",
                required: false,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "specialite2",
                description: "Note de l'épreuve de spécialité 1 en terminale. Si vous avez plusieurs notes, séparez-les par \",\"",
                required: false,
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                name: "sauver",
                description: "Sauvegarde les notes pour ne pas avoir à les rentrer à chaque fois",
                required: false,
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                name: "skip",
                description: "Passer les erreurs qui demandent de choisir la matière",
                required: false,
            }
        ],
    },
    execute: async (client, interaction) => {
        const session = client.session;
        const classe = session.user.studentClass.name;

        if (!classe.startsWith("1") && !classe.toUpperCase().startsWith("T")) {
            return await interaction.editReply("❌ | Vous n'êtes pas dans une classe de bac");
        }

        const caches = fs.readdirSync("./").filter(f => f.endsWith(".json") && f.startsWith("cache_"));
        const notes = {
            "1": {
                subjects: [],
                subjectAverage: {
                    "histoire_geographie": 0,
                    "enseignement_scientifique": 0,
                    "lva": 0,
                    "lvb": 0,
                    "emc": 0,
                    "specialite": 0,
                    "opt1": 0,
                    "opt2": 0,
                }
            },
            "T": {
                subjects: [],
                subjectAverage: {
                    "histoire_geographie": 0,
                    "enseignement_scientifique": 0,
                    "lva": 0,
                    "lvb": 0,
                    "eps": 0,
                    "emc": 0,
                    "opt1": 0,
                    "opt2": 0,
                    "philosophie": 0,
                    "specialite1": 0,
                    "specialite2": 0,
                    "grand_oral": 0,
                }
            },
        };
        caches.forEach(cache => {
            const data = require("../" + cache);
            notes[data.classe?.startsWith("1") ? "1" : "T"].subjects = data.marks.subjects.map(subject => {
                return {
                    name: subject.name,
                    average: subject.averages.student,
                };
            });
            if (data.classe?.startsWith("1") && data.marks.bac_fr) {
                notes["1"].subjectAverage["fr_oral"] = data.marks.bac_fr.oral;
                notes["1"].subjectAverage["fr_ecrit"] = data.marks.bac_fr.ecrit;
            }
            if (data.classe?.startsWith("T") && data.marks.bac) {
                notes["T"].subjectAverage["philosophie"] = data.marks.bac.philosophie;
                notes["T"].subjectAverage["grand_oral"] = data.marks.bac.grand_oral;
                notes["T"].subjectAverage["specialite1"] = data.marks.bac.specialite1;
                notes["T"].subjectAverage["specialite2"] = data.marks.bac.specialite2;
            }
        });

        if (interaction.options.getInteger("fr-oral")) {
            notes["1"].subjectAverage["fr_oral"] = interaction.options.getInteger("fr-oral") ?? 0;
        }
        if (interaction.options.getInteger("fr-ecrit")) {
            notes["1"].subjectAverage["fr_ecrit"] = interaction.options.getInteger("fr-ecrit") ?? 0;
        }
        if (interaction.options.getInteger("philosophie")) {
            notes["T"].subjectAverage["philosophie"] = interaction.options.getInteger("philosophie") ?? 0;
        }
        if (interaction.options.getInteger("grand-oral")) {
            notes["T"].subjectAverage["grand_oral"] = interaction.options.getInteger("grand-oral") ?? 0;
        }
        if (interaction.options.getString("specialite1")) {
            notes["T"].subjectAverage["specialite1"] = interaction.options.getString("specialite1") ? interaction.options.getString("specialite1").split(",").map(note => parseInt(note)).reduce((a, b) => a + b, 0) / (interaction.options.getString("specialite1") ?? "").split(",").length : 0;
        }
        if (interaction.options.getString("specialite2")) {
            notes["T"].subjectAverage["specialite2"] = interaction.options.getString("specialite1") ? interaction.options.getString("specialite2").split(",").map(note => parseInt(note)).reduce((a, b) => a + b, 0) /(interaction.options.getString("specialite2") ?? "").split(",").length : 0;
        }
        if (interaction.options.getBoolean("sauver")) {
            const data1 = require("../" + caches.find(c => c.split("_")[1].startsWith("1")));
            data1.marks.bac_fr = {
                oral: notes["1"].subjectAverage["fr_oral"],
                ecrit: notes["1"].subjectAverage["fr_ecrit"],
            };
            fs.writeFileSync(data1.classe ? "cache_"+data1.classe.toUpperCase()+".json" : "cache.json", JSON.stringify(data1, null, 4), "utf-8");
            const dataT = require("../" + caches.find(c => c.split("_")[1].startsWith("T")));
            dataT.marks.bac = {
                philosophie: notes["T"].subjectAverage["philosophie"],
                grand_oral: notes["T"].subjectAverage["grand_oral"],
                specialite1: notes["T"].subjectAverage["specialite1"],
                specialite2: notes["T"].subjectAverage["specialite2"],
            };
            fs.writeFileSync(dataT.classe ? "cache_"+dataT.classe.toUpperCase()+".json" : "cache.json", JSON.stringify(dataT, null, 4), "utf-8");
        }

        let total = 0;
        let errors = [];
        let founds = {
            "1":[],
            "T":[],
        };
        // 1ère
        Object.keys(notes["1"].subjectAverage).forEach(subject => {
            if (![ "opt1", "opt2", "specialite", "fr_ecrit", "fr_oral" ].includes(subject)) {
                let actSubjects = notes["1"].subjects.filter(s => s.name.match(subjects[subject]?.regex));
                if (actSubjects.length === 1) {
                    founds["1"].push(actSubjects[0].name);
                    notes["1"].subjectAverage[subject] = actSubjects[0].average * subjects[subject]?.coef["1"];
                    total += notes["1"].subjectAverage[subject];
                } else if (notes["1"].subjects.length > 0) {
                    errors.push("1|" + subject);
                }
            } else if (subject.startsWith("fr_")) {
                notes["1"].subjectAverage[subject] = notes["1"].subjectAverage[subject] * 5;
                total += notes["1"].subjectAverage[subject];
            } else if (subject.startsWith("opt")) {
                errors.push("1|" + subject);
            }
        });
        // Terminale
        Object.keys(notes["T"].subjectAverage).forEach(subject => {
            if (![ "opt1", "opt2" ].includes(subject)) {
                let actSubjects = notes["T"].subjects.filter(s => s.name.match(subjects[subject]?.regex));
                if (subject === "philosophie") {
                    notes["T"].subjectAverage[subject] = notes["T"].subjectAverage[subject] * 4;
                    total += notes["T"].subjectAverage[subject];
                } else if (subject === "grand_oral") {
                    notes["T"].subjectAverage[subject] = notes["T"].subjectAverage[subject] * 14;
                    total += notes["T"].subjectAverage[subject];
                } else if (subject.startsWith("specialite")) {
                    notes["T"].subjectAverage[subject] = notes["T"].subjectAverage[subject] * 16;
                    total += notes["T"].subjectAverage[subject];
                } else if (actSubjects.length === 1) {
                    if (subjects[subject].controleContinu) {
                        founds["T"].push(actSubjects[0].name);
                        notes["T"].subjectAverage[subject] = actSubjects[0].average * subjects[subject]?.coef["T"];
                        total += notes["T"].subjectAverage[subject];
                    }
                } else if (notes["T"].subjects.length > 0) {
                    errors.push("T|" + subject);
                }
            } else if (subject.startsWith("opt")) {
                errors.push("T|" + subject);
            }
        });

        let specialites1 = Object.keys(subjects).filter(s => s.startsWith("spe") && notes["1"].subjects.find(su => su.name.match(subjects[s].regex)));
        let specialitesT = Object.keys(subjects).filter(s => s.startsWith("spe") && notes["T"].subjects.find(su => su.name.match(subjects[s].regex)));

        if (specialitesT.length > 0 && specialites1.length > 0) {
            let specialite1 = specialites1.filter(s => !specialitesT.includes(s)).shift();
            notes["1"].subjectAverage["specialite"] = notes["1"].subjects.find(s => subjects[specialite1].regex.test(s.name)).average * subjects[specialite1].coef["1"];
            total += notes["1"].subjectAverage["specialite"];
            founds["1"].push(specialite1);
            founds["1"] = founds["1"].concat(specialitesT.map(s => s.name));
        } else {
            errors.push("1|specialite");
        }
        if (notes["1"].subjectAverage["specialite"] === 0 && !errors.includes("1|specialite")) {
            errors.push("1|specialite");
        }

        if (errors.length && !interaction.options.getBoolean("skip")) {
            let subjects = notes[errors[0].split("|")[0]].subjects.filter(s => !founds[errors[0].split("|")[0]].includes(s.name)).map(s => {
                return {
                    label: s.name,
                    description: "Moyenne : " + s.average,
                    value: s.name,
                };
            });

            subjects.splice(24);

            subjects.push({
                label: "Sans notes | Aucune",
                description: "Vous n'avez pas encore de notes pour cette matière, ou vous n'avez pas de matière correspondante.",
                value: "0",
            });


            const select = new SelectMenuBuilder()
                .setCustomId("bac_" + errors[0].split("|")[1])
                .setPlaceholder("Sélectionnez une matière")
                .addOptions(subjects)
                .setMinValues(1)
                .setMaxValues(subjects.length >= 3 ? 3 : 1);


            const row = new ActionRowBuilder()
                .addComponents(select);
            await interaction.editReply({
                content: "❌ | Il y a eu une erreur lors du calcul de la moyenne. Une matière n'a pas été trouvée, veuillez sélectionner la matière correspondant à **" + nameGenerator(errors[0].split("|")[1]) + "** (*"+(errors[0].split("|")[0] === "1" ? "Première" : "Terminale")+"*)",
                components: [row],
            });
        }
        const message = await interaction.fetchReply();
        const filter = i => {
            return i.customId.startsWith("bac_") && i.user.id === interaction.user.id;
        };

        const componentCollector = message.createMessageComponentCollector({ filter, idle: 20000, dispose: true });
        if (!errors.length && !interaction.options.getBoolean("skip")) componentCollector.stop();
        componentCollector.on("collect", async i => {
            let subName = "Aucune";
            let classe = errors[0].split("|")[0];
            const subId = errors[0].split("|")[1];
            const chossedSub = notes[classe].subjects.filter(s => i.values.includes(s.name));
            const average = chossedSub.reduce((a, b) => a + b.average, 0) / chossedSub.length;
            if (i.values.includes("0") || i.values.includes("null")) {
                notes[classe].subjectAverage[subId] = 0;
            } else if (subId.startsWith("opt")) {
                founds[classe] = founds[classe].concat(i.values);
                notes[classe].subjectAverage[subId] = average * 2;
                total += notes[classe].subjectAverage[subId];
                subName = chossedSub.map(s => s.name).join(", ");
            } else if (subId === "specialite") {
                founds[classe] = founds[classe].concat(i.values);
                notes[classe].subjectAverage[subId] = average * 8;
                total += notes[classe].subjectAverage[subId];
                subName = chossedSub.map(s => s.name).join(", ");
            } else {
                founds[classe] = founds[classe].concat(i.values);
                const subject = notes[classe].subjects.find(s => s.name === i.values[0]);
                let subjectName = subId;
                if (!subjects[subjectName]) subjectName = Object.keys(subjects).find(s => subjects[s].regex.test(subject.name));
                notes[classe].subjectAverage[subId] = average * subjects[subjectName].coef[classe];
                total += notes[classe].subjectAverage[subId];
                subName = subject.name;
            }
            errors.shift();
            if (errors.length) {
                classe = errors[0].split("|")[0];
                const subjects = notes[classe].subjects.filter(s => !founds[classe].includes(s.name)).map(s => {
                    return {
                        label: s.name,
                        description: "Moyenne : " + s.average,
                        value: s.name,
                    };
                });

                subjects.splice(24);

                subjects.push({
                    label: "Sans notes | Aucune",
                    description: "Vous n'avez pas encore de notes pour cette matière ou vous n'avez pas de matière correspondante.",
                    value: "0",
                });

                const select = new SelectMenuBuilder()
                    .setCustomId("bac_" + subId)
                    .setPlaceholder("Sélectionnez une matière")
                    .addOptions(subjects)
                    .setMinValues(1)
                    .setMaxValues(subjects.length >= 3 ? 3 : 1);


                const row = new ActionRowBuilder()
                    .addComponents(select);
                await message.edit({
                    content: "❌ | Il y a eu une erreur lors du calcul de la moyenne. Une matière n'a pas été trouvée, veuillez sélectionner la matière correspondant à **" + nameGenerator(errors[0].split("|")[1]) + "** (*"+(classe === "1" ? "Première" : "Terminale")+"*)",
                    components: [row],
                });
            } else {
                componentCollector.stop();
            }
            await i.reply({
                content: "✅ | La matière **"+subName+"** a bien été ajouté à la moyenne !",
                ephemeral: true,
            });
        });
        componentCollector.on("end", async () => {
            if (errors.length && !interaction.options.getBoolean("skip")) {
                await interaction.editReply({
                    content: "❌ | Vous n'avez pas répondu à temps",
                    components: [],
                });
            } else {
                const embed = new EmbedBuilder()
                    .setColor("#70C7A4")
                    .setTitle("Notes du bac de " + session.user.name)
                    .setFooter({text: "Bot par Merlode#8128"})
                    .addFields([
                        {
                            name: "Matières de 1ère",
                            value: Object.keys(notes["1"].subjectAverage).map(subject => {
                                return nameGenerator(subject) + " : " + Math.round(notes["1"].subjectAverage[subject] * 100) / 100;
                            }).join("\n"),
                        },
                        {
                            name: "Matières de Terminale",
                            value: Object.keys(notes["T"].subjectAverage).map(subject => {
                                return nameGenerator(subject) + " : " + Math.round(notes["T"].subjectAverage[subject] * 100) / 100;
                            }).join("\n"),
                        }
                    ]);


                let description = "Moyenne obtenue pour le bac : " + Math.round(total * 100) / 100 + "/2 000";
                if (total >= 1600) {
                    description += "\n\n**Félicitations !** Vous avez obtenu votre bac avec mention **Très bien** !";
                    embed.setThumbnail("https://i.imgur.com/hqYf8Fn.png");
                }
                else if (total >= 1400) {
                    description += "\n\n**Félicitations !** Vous avez obtenu votre bac avec mention **Bien** !";
                    embed.setThumbnail("https://i.imgur.com/ZO9q3YE.png");
                }
                else if (total >= 1200) {
                    description += "\n\n**Félicitations !** Vous avez obtenu votre bac avec mention **Assez bien** !";
                    embed.setThumbnail("https://i.imgur.com/neuhAFJ.png");
                }
                else if (total >= 1000) {
                    description += "\n\n**Félicitations !** Vous avez obtenu votre bac !";
                    embed.setThumbnail("https://i.imgur.com/SyK94Z3.png");
                }
                embed.setDescription(description);

                return await interaction.editReply({
                    content: "✅ | La moyenne a bien été calculée !",
                    embeds: [embed],
                    components: [],
                });
            }
        });
    },
};