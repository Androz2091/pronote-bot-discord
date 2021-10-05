const fs = require("fs");

module.exports = client => {
    /**
     * Écrit l'objet dans le cache et met à jour la variable
     * @param {object} newCache Le nouvel objet
     */
    client.db.writeCache = (newCache) => {
        client.cache = newCache;
        fs.writeFileSync("cache.json", JSON.stringify(newCache, null, 4), "utf-8");
    };
    /**
     * Réinitialise le cache
     */
    client.db.resetCache = () => client.db.writeCache({
        homeworks: [],
        marks: {
            subjects: []
        },
        lessonsAway: []
    });
};