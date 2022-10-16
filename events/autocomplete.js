const parseTime0 = (time) => {
    if (typeof time !== "string") {
        time = time.toString();
    }
    if (time.length === 1) {
        return "0" + time;
    }
    return time;
};

const weekString = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

module.exports = async (client, interaction) => {
    if (interaction.options.data.find(o => o.focused)?.name === "date" && ["fichier"].includes(interaction.commandName)) {
        const subject = interaction.options.data.find(o => o.name === "matière").value;
        let data = client.cache.files.map(f => {
            return {
                name: f.subject,
                value: f.subject
            };
        });
        data = data.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
        if (subject) {
            data = data.filter(o => o.name.toLowerCase().includes(subject.toLowerCase()));
        }
        data.splice(25);
        interaction.respond(data);
    } else if (interaction.options.data.find(o => o.focused)?.name === "matière" && !["contenu", "fichier"].includes(interaction.commandName)) {
        const subject = interaction.options.data.find(o => o.name === "matière").value;
        let data = client.cache.marks.subjects.map(s => {
            return {
                name: s.name,
                value: s.name
            };
        });
        if (subject) {
            data = data.filter(o => o.name.toLowerCase().includes(subject.toLowerCase()));
        }
        interaction.respond(data);
    } else if (interaction.options.data.find(o => o.focused)?.name === "matière") {

        const subject = interaction.options.data.find(o => o.name === "matière").value;
        let data = client.cache.contents.map(s => {
            return {
                name: s.subject,
                value: s.subject
            };
        });
        // remove duplicates
        data = data.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
        if (subject) {
            data = data.filter(o => o.name.toLowerCase().includes(subject.toLowerCase()));
        }
        data.splice(25);
        interaction.respond(data);
    } else if (interaction.options.data.find(o => o.focused)?.name === "date" && interaction.commandName !== "contenu") {
        const value = interaction.options.data.find(o => o.name === "date").value;

        let results = [];
        if (value.includes("/")) {
            const parsed = value.split("/");
            const lastValue = parsed[parsed.length - 1];
            if (parsed.length === 3) {
                if (lastValue.length === 4) {
                    const date = new Date(parsed[2], parsed[1] - 1, parsed[0]);
                    if (date) {
                        interaction.respond([{
                            name: value,
                            value: value
                        }]);
                    }
                } else {
                    const actualYear = new Date().getFullYear();
                    for (let i = 0; i < 12; i++) {
                        if ((actualYear + i).toString().includes(lastValue.toLowerCase())) {
                            results.push({
                                name: parseTime0(parsed[0]) + "/" + parseTime0(parsed[1]) + "/" + parseTime0(actualYear + i) + " (" + weekString[new Date(actualYear + i, parsed[1] - 1, parsed[0]).getDay()] + ")",
                                value: parseTime0(parsed[0]) + "/" + parseTime0(parsed[1]) + "/" + parseTime0(actualYear + i)
                            });
                        }
                    }
                }
            } else if (parsed.length === 2) {
                if (lastValue.length === 2) {
                    const actualYear = new Date().getFullYear();
                    for (let i = 0; i < 12; i++) {
                        results.push({
                            name: parseTime0(parsed[0]) + "/" + parseTime0(parsed[1]) + "/" + parseTime0(actualYear + i) + " (" + weekString[new Date(actualYear + i, parsed[1] - 1, parsed[0]).getDay()] + ")",
                            value: parseTime0(parsed[0]) + "/" + parseTime0(parsed[1]) + "/" + parseTime0(actualYear + i)
                        });
                    }
                } else {
                    // complete for month
                    const actualYear = new Date().getFullYear();
                    for (let i = 0; i < 12; i++) {
                        if ((i + 1).toString().includes(lastValue.toLowerCase())) {
                            results.push({
                                name: parseTime0(parsed[0]) + "/" + parseTime0(i + 1) + "/" + parseTime0(actualYear) + " (" + weekString[new Date(actualYear, i, parsed[0]).getDay()] + ")",
                                value: parseTime0(parsed[0]) + "/" + parseTime0(i + 1) + "/" + parseTime0(actualYear)
                            });
                        }
                    }
                }
            } else if (parsed.length === 1) {
                if (lastValue.length === 2) {
                    const actualYear = new Date().getFullYear();
                    for (let i = 0; i < 12; i++) {
                        results.push({
                            name: parseTime0(parsed[0]) + "/" + parseTime0(i + 1) + "/" + parseTime0(actualYear) + " (" + weekString[new Date(actualYear, i, parsed[0]).getDay()] + ")",
                            value: parseTime0(parsed[0]) + "/" + parseTime0(i + 1) + "/" + parseTime0(actualYear)
                        });
                    }
                } else {
                    const actualYear = new Date().getFullYear();
                    for (let i = 0; i < 31; i++) {
                        if ((i + 1).toString().includes(lastValue.toLowerCase())) {
                            results.push({
                                name: parseTime0(i + 1) + "/" + parseTime0(new Date().getMonth() + 1) + "/" + parseTime0(actualYear) + " (" + weekString[new Date(actualYear, new Date().getMonth(), i + 1).getDay()] + ")",
                                value: parseTime0(i + 1) + "/" + parseTime0(new Date().getMonth() + 1) + "/" + parseTime0(actualYear)
                            });
                        }
                    }
                }
            } else {
                const actualYear = new Date().getFullYear();
                for (let i = 0; i < 31; i++) {
                    results.push({
                        name: parseTime0(i + 1) + "/" + parseTime0(new Date().getMonth() + 1) + "/" + parseTime0(actualYear) + " (" + weekString[new Date(actualYear, new Date().getMonth(), i + 1).getDay()] + ")",
                        value: parseTime0(i + 1) + "/" + parseTime0(new Date().getMonth() + 1) + "/" + parseTime0(actualYear)
                    });
                }
            }
        } else {
            const actualYear = new Date().getFullYear();
            for (let i = 0; i < 31; i++) {
                results.push({
                    name: parseTime0(i + 1) + "/" + parseTime0(new Date().getMonth() + 1) + "/" + parseTime0(actualYear) + " (" + weekString[new Date(actualYear, new Date().getMonth(), i + 1).getDay()] + ")",
                    value: parseTime0(i + 1) + "/" + parseTime0(new Date().getMonth() + 1) + "/" + parseTime0(actualYear)
                });
            }
        }
        results.splice(25);
        interaction.respond(results);
    } else if (interaction.options.data.find(o => o.focused)?.name === "date" && interaction.commandName === "contenu") {
        const value = interaction.options.data.find(o => o.focused).value;
        const subject = interaction.options.data.find(o => o.name === "matière").value;

        const contents = client.cache.contents.filter(c => c.subject === subject);
        // const parsed = value.split(/\s/);
        // let parsedDate = parsed.split("/");
        // let parsedTime = parsed.replace("h");
        let results = [];
        for (const content of contents) {
            if (value) {
                if ((content.from.toLocaleDateString() + " " + parseTime0(content.from.getHours())).includes(value)) {
                    results.push({
                        name: weekString[content.from.getDay()] + " " + content.from.toLocaleDateString() + " " + parseTime0(content.from.getHours()) + "h",
                        value: content.from.toLocaleDateString() + " " + parseTime0(content.from.getHours())
                    });
                }
            } else {
                results.push({
                    name: weekString[content.from.getDay()] + " " + content.from.toLocaleDateString() + " " + parseTime0(content.from.getHours()) + "h",
                    value: content.from.toLocaleDateString() + " " + parseTime0(content.from.getHours())
                });
            }
        }
        results = results.reverse();
        results.splice(25);
        interaction.respond(results);
    } else if (interaction.options.data.find(o => o.name === "cas")?.options.find(o => o.focused)?.name === "cas" && interaction.commandName === "config") {
        const {casList} = require("pronote-api-maintained");
        const value = interaction.options.data.find(o => o.name === "cas")?.options.find(o => o.focused).value;
        const results = [];
        for (const cas of casList) {
            if (value && cas.toLowerCase().includes(value.toLowerCase())) {
                results.push({
                    name: cas,
                    value: cas
                });
            } else if (!value) {
                results.push({
                    name: cas,
                    value: cas
                });
            }
        }
        results.splice(25);
        interaction.respond(results);
    } else if (interaction.options.data.find(o => o.focused)?.name === "fichier" && interaction.commandName === "fichier") {
        const value = interaction.options.data.find(o => o.focused).value;
        const subject = interaction.options.data.find(o => o.name === "matière").value;
        const files = client.cache.files.filter(c => c.subject === subject);
        let results = [];
        for (const file of files) {
            if (value) {
                if (file.name.toLowerCase().includes(value.toLowerCase())) {
                    results.push({
                        name: (file.name ?? "Lien") + " (" + file.time.toLocaleDateString() + " " + parseTime0(file.time.getHours()) + "h)",
                        value: file.id
                    });
                }
            } else {
                results.push({
                    name: (file.name ?? "Lien") + " (" + file.time.toLocaleDateString() + " " + parseTime0(file.time.getHours()) + "h)",
                    value: file.id
                });
            }
        }
        results.splice(25);
        interaction.respond(results);
    }
};
