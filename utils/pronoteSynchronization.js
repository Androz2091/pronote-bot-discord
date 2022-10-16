require("dotenv").config();
const pronote = require("pronote-api-maintained");


/**
 * Synchronise le client.cache avec Pronote et se charge d'appeler les fonctions qui envoient les notifications
 * @param {Client} client Le client Discord
 * @returns {void}
 */

module.exports = async (client) => {
    let hasAlready = client.session;
    if (!client.session) {
        const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
        client.session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas, "student").catch(console.error);
    }
    const session = client.session;

    // Connexion à Pronote
    if (!session) return;

    client.cache.classe = session.user.studentClass.name;

    // Vérification des devoirs
    if (process.env.HOMEWORKS_CHANNEL_ID) {
        let homeworks = await session.homeworks(Date.now(), session.params.lastDay);
        const newHomeworks = homeworks.filter((work) => !(client.cache.homeworks.some((cacheWork) => cacheWork.id === work.id)));
        if (newHomeworks.length > 0) {
            await client.functions.asyncForEach(newHomeworks, (work) => {
                client.notif.homework(work);
            });
        }

        // Mise à jour du client.cache pour les devoirs
        client.db.writeCache({
            ...client.cache,
            homeworks
        });
    }

    // Vérification des notes
    if (process.env.MARKS_CHANNEL_ID) {
        const marks = await session.marks("trimester");
        const marksNotifications = [];
        marks.subjects.forEach((subject) => {
            const cachedSubject = client.cache.marks.subjects.find(sub => sub.name === subject.name && sub.color === subject.color);
            if (cachedSubject) {
                const newMarks = subject.marks.filter((mark) => !(cachedSubject.marks.some((cacheMark) => cacheMark.id === mark.id)));
                newMarks.forEach((mark) => marksNotifications.push({subject, mark}));
            } else {
                subject.marks.forEach((mark) => marksNotifications.push({subject, mark}));
            }
        });
        if (marksNotifications.length > 0) {
            const marksCache = JSON.parse(JSON.stringify(client.cache.marks));
            const date = new Date();
            const madeMarks = [];
            marksNotifications.forEach(n => {
                const subject = client.cache.marks.subjects.find(s => n.subject.name === s.name && n.subject.color === s.color);
                if (!subject) {
                    client.cache.marks.subjects.push(Object.assign(n.subject, {
                        averagesHistory: [{
                            date,
                            student: n.subject.averages.student,
                            studentClass: n.subject.averages.studentClass,
                        }]
                    }));
                    madeMarks.push(n.subject.name);
                } else subject.marks.push(n.mark);
                if (!madeMarks.includes(n.subject.name)) {
                    subject.averages = n.subject.averages;
                    subject.averagesHistory.push({
                        date,
                        student: n.subject.averages.student,
                        studentClass: n.subject.averages.studentClass,
                    });
                    client.cache.marks.subjects[client.cache.marks.subjects.findIndex(s => n.subject.name === s.name)] = subject;
                    madeMarks.push(n.subject.name);
                }
            });
            if (!client.cache.marks.averages) {
                client.cache.marks.averages = {
                    student: 0,
                    studentClass: 0,
                    history: []
                };
            }
            client.cache.marks.averages.student = marks.averages.student;
            client.cache.marks.averages.studentClass = marks.averages.studentClass;
            client.cache.marks.averages.history.push({
                date,
                student: marks.averages.student,
                studentClass: marks.averages.studentClass
            });
            client.notif.mark(marksNotifications, marksCache);
        }
        // Mise à jour du client.cache pour les notes
        client.db.writeCache(client.cache);
    }

    // Vérification des absences
    if (process.env.AWAY_CHANNEL_ID) {
        const nextWeekDay = new Date();
        nextWeekDay.setDate(nextWeekDay.getDate() + 30);
        const timetable = await session.timetable(new Date(), nextWeekDay);
        const awayNotifications = [];
        timetable.filter((lesson) => lesson.isAway || lesson.isCancelled).forEach((lesson) => {
            if (!client.cache.lessonsAway.some((lessonID) => lessonID === lesson.id)) {
                awayNotifications.push({
                    teacher: lesson.teacher,
                    from: lesson.from,
                    subject: lesson.subject,
                    id: lesson.id
                });
            }
        });
        if (awayNotifications.length) {
            awayNotifications.forEach((awayNotif) => client.notif.away(awayNotif));
        }

        client.db.writeCache({
            ...client.cache,
            lessonsAway: [
                ...client.cache.lessonsAway,
                ...awayNotifications.map((n) => n.id)
            ]
        });
    }

    // Vérification des informations
    if (process.env.INFOS_CHANNEL_ID) {
        const infos = await session.infos();
        const infosNotifications = [];
        infos.forEach(info => {
            if (!client.cache.infos.some((infId) => infId === info.id)) {
                infosNotifications.push(info);
            }
        });
        if (infosNotifications.length > 0) {
            infosNotifications.forEach(inf => client.notif.info(inf));
        }
        // Mise à jour du client.cache pour les notes
        client.db.writeCache({
            ...client.cache,
            infos: [
                ...client.cache.infos,
                ...infosNotifications.map((n) => n.id)
            ]
        });

    }

    await client.session.contents(new Date(new Date().getFullYear(), 8, 1), new Date()).then(async (contents) => {
        client.db.writeCache({
            ...client.cache,
            contents: contents.map((content) => {
                return {
                    id: content.id,
                    subject: content.subject,
                    from: content.from,
                    to: content.to,
                };
            })
        });
    });

    await client.session.files().then(async (files) => {
        client.db.writeCache({
            ...client.cache,
            files: files.map(file => {
                file.url = undefined;
                return file;
            })
        });
    });


    if (!hasAlready) {
        await client.session.logout();
        client.session = null;
    }

    return console.log("\x1b[92m" + client.functions.parseTime() + " | Une vérification vient juste d'être effectuée !\x1b[0m");
};