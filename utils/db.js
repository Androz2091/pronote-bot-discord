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
     */
    client.db.resetCache = (classe) => client.db.writeCache({
        classe: classe,
        homeworks: [],
        marks: {
            subjects: []
        },
        lessonsAway: [],
        infos: []
    });
};