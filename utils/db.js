const fs = require("fs");

module.exports = client => {
    client.db = {};

    /**
     * Écrit l'objet dans le cache et met à jour la variable
     * @param {object} newCache Le nouvel objet
     */
    client.db.writeCache = (newCache) => {
        client.cache = newCache;
        fs.writeFileSync(newCache.classe ? "cache_"+newCache.classe.toUpperCase()+".json" : "cache.json", JSON.stringify(newCache, null, 4), "utf-8");
    };

    /**
     * Réinitialise le cache
     * @param {string|null} classe La classe du cache à réinitialiser
     */
    client.db.resetCache = (classe = null) => client.db.writeCache({
        classe: classe,
        homeworks: [],
        marks: {
            subjects: []
        },
        lessonsAway: [],
        infos: [],
        contents: [],
        files: [],
    });
};