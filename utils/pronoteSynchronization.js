require("dotenv").config();
const pronote = require("pronote-api-maintained");

/**
 * Synchronise le client.cache avec Pronote et se charge d'appeler les fonctions qui envoient les notifications
 * @returns {void}
 */

module.exports = async (client) => {
    let hasAlready = client.session;
    if (!client.session) {
        const cas = (process.env.PRONOTE_CAS && process.env.PRONOTE_CAS.length > 0 ? process.env.PRONOTE_CAS : "none");
        client.session = await pronote.login(process.env.PRONOTE_URL, process.env.PRONOTE_USERNAME, process.env.PRONOTE_PASSWORD, cas, "student").catch(console.error);
        client.session.setKeepAlive(true);
    }
    const session = client.session;

    // Connexion à Pronote
    if (!session) return;

    // Vérification des devoirs
    const homeworks = await session.homeworks(Date.now(), session.params.lastDay);
    if (homeworks) {
        const newHomeworks = homeworks.filter((work) => !(client.cache.homeworks.some((cacheWork) => cacheWork.description === work.description)));
        if (newHomeworks.length > 0) {
            newHomeworks.forEach((work) => {
                client.notif.homework(work);
            });

        }

        // Mise à jour du client.cache pour les devoirs
        client.db.writeCache({
            ...client.cache,
            homeworks
        });
    }

    const marks = await session.marks("trimester");
    const marksNotifications = [];
    marks.subjects.forEach((subject) => {
        const cachedSubject = client.cache.marks.subjects.find((sub) => sub.name === subject.name && sub.color === subject.color);
        if (cachedSubject) {
            const newMarks = subject.marks.filter((mark) => !(cachedSubject.marks.some((cacheMark) => cacheMark.id === mark.id)));
            newMarks.forEach((mark) => marksNotifications.push({ subject, mark }));
        } else {
            subject.marks.forEach((mark) => marksNotifications.push({ subject, mark }));
        }
    });
    if (marksNotifications.length > 0) {
        const marksCache = JSON.parse(JSON.stringify(client.cache.marks));
        const date = new Date();
        const madeMarks = [];
        marksNotifications.forEach(n => {
            const subject = client.cache.marks.subjects.find(s => n.subject.name === s.name);
            if (!subject) {
                client.cache.marks.subjects.push(Object.assign(n.subject, {averagesHistory: [{
                    date,
                    student: n.subject.averages.student,
                    studentClass: n.subject.averages.studentClass,
                }]
                }));
                madeMarks.push(n.subject.name);
            } else subject.marks.push(n.mark);
            if (!madeMarks.includes(n.subject.name)) {
                subject.averages = n.subject.averages;
                if (!subject.averagesHistory) subject.averagesHistory = [];
                subject.averagesHistory.push({
                    date,
                    student: n.subject.averages.student,
                    studentClass: n.subject.averages.studentClass,
                });
                client.cache.marks.subjects[client.cache.marks.subjects.findIndex(s => n.subject.name === s.name && n.subject.name === s.name)] = subject;
                madeMarks.push(n.subject.name);
            }
        });
        if (!client.cache.marks.averages) client.cache.marks.averages = {
            student: 0,
            studentClass: 0,
            history: []
        };
        client.cache.marks.averages.student = marks.averages.student;
        client.cache.marks.averages.studentClass = marks.averages.studentClass;

        if (!client.cache.marks.averages.history) client.cache.marks.averages.history = [];
        client.cache.marks.averages.history.push({
            date,
            student: marks.averages.student,
            studentClass: marks.averages.studentClass
        });

        client.notif.mark(marksNotifications, marksCache);
    }
    // Mise à jour du client.cache pour les notes
    client.db.writeCache(client.cache);

    const nextWeekDay = new Date();
    nextWeekDay.setDate(nextWeekDay.getDate() + 30);
    const timetable = await session.timetable(new Date(), nextWeekDay);
    const awayNotifications = [];
    timetable.filter((lesson) => lesson.isAway || lesson.isCancelled).forEach((lesson) => {
        if (!client.cache.lessonsAway.some((lessonID) => lessonID === lesson.id)){
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

    const infos = await session.infos();
    const infosNotifications = [];
    infos.forEach(info => {
        if (!client.cache.infos.some((infId) => infId === info.id)){
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

    const today = new Date();
    const hour = `${today.getHours()}`.length === 1 ? `0${today.getHours()}` : today.getHours();
    const min = `${today.getMinutes()}`.length === 1 ? `0${today.getMinutes()}` : today.getMinutes();
    const sec = `${today.getSeconds()}`.length === 1 ? `0${today.getSeconds()}` : today.getSeconds();
    const time = hour + ":" + min + ":" + sec;

    const day = `${today.getDate()}`.length === 1 ? `0${today.getDate()}` : today.getDate();
    const month = `${today.getMonth()+1}`.length === 1 ? `0${today.getMonth()+1}` : (today.getMonth()+1);
    const date = day+"/"+ month+"/"+today.getFullYear();

    if (!hasAlready) {
        await client.session.logout();
        client.session = null;
    }

    return console.log(date + " " + time + " | Une vérification vient juste d'être effectuée !");
};