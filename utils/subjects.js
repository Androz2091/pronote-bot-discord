module.exports = {
    "histoire_geographie": {
        name: "Histoire-Géographie",
        regex: /Histoire[-\s]G[ée]ograph(ie|\.)|H[-\s]G/i,
        coef: {
            "1": 3,
            "T": 3,
        },
        controleContinu: true,
    },
    "enseignement_scientifique": {
        name: "Enseignement Scientifique",
        regex: /Enseign(ement|\.)[-\s]Scientifique|es/i,
        coef: {
            "1": 3,
            "T": 3,
        },
        controleContinu: true,
    },
    "lva": {
        name: "Langue Vivante A",
        regex: /LV[A1]/i,
        coef: {
            "1": 3,
            "T": 3,
        },
        controleContinu: true,
    },
    "lvb": {
        name: "Langue Vivante B",
        regex: /LV[B2]/i,
        coef: {
            "1": 3,
            "T": 3,
        },
        controleContinu: true,
    },
    "eps": {
        name: "Éducation Physique et Sportive",
        regex: /EPS|Sport|[ée]ducation physique et sportive/i,
        coef: {
            "1": 0,
            "T": 6,
        },
        controleContinu: false,
    },
    "emc": {
        name: "Éducation Morale et Civique",
        regex: /EMC|Ens(eignement|\.)[-\s]moral[-\s]&?[-\s]?civique/i,
        coef: {
            "1": 1,
            "T": 1,
        },
        controleContinu: false,
    },
    "philosophie": {
        name: "Philosophie",
        regex: /Philo(sophie|\.)?/i,
        coef: {
            "1": 8,
            "T": 8,
        },
        controleContinu: false,
    },
    "spe_amc": {
        name: "Spécialité d'Anglais du Monde Contemporain",
        regex: /(spe\s)?AMC(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_art": {
        name: "Spécialité d'Arts",
        regex: /(spe\s)?art(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_bio": {
        name: "Spécialité de Biologie-écologie",
        regex: /(spe\s)?bio(\sspe)?/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_hggsp": {
        name: "Spécialité d'Histoire-Géographie-Géopolitique et Sciences Politiques",
        regex: /(spe\s)?HGGSP(\sspe)|hist\.geo\.geopol\.s.p/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_hlp": {
        name: "Spécialité d'Histoire-Littérature et Philosophie",
        regex: /(spe\s)?hlp(\sspe)|human\.litter\.philo\./i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_llcer": {
        name: "Spécialité de Langues et Littératures Classiques et Étrangères et Régionales",
        regex: /(spe\s)?llcer(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_llca": {
        name: "Spécialité de Langues et Littératures Classiques et Anciennes",
        regex: /(spe\s)?llca(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
    },
    "spe_maths": {
        name: "Spécialité de Mathématiques",
        regex: /(spe\s)?math(s|th[eé]matiques?)(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_nsi": {
        name: "Spécialité de Sciences Numériques et Informatiques",
        regex: /(spe\s?)?nsi(\s?spe)|num([ée]rique|\.)\s?sc(ience|\.)\s?inf((o(rm(atique|\.)|\.)|\.)|\.)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_phch": {
        name: "Spécialité de Physique-Chimie",
        regex: /phch|physique[-\s]chimie/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_svt": {
        name: "Spécialité de Sciences de la Vie et de la Terre",
        regex: /(spe\s)?svt(\sspe)|sciences?[-\s]vie[-\s]&?[-\s]?terre/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_si": {
        name: "Spécialité de Sciences de l'Ingénieur",
        regex: /(spe\s)?Science[-\s](de\sl')?ing[eé]nieur(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    },
    "spe_ses": {
        name: "Spécialité de Sciences Économiques et Sociales",
        regex: /(spe\s)?ses(\sspe)/i,
        coef: {
            "1": 8,
            "T": 16,
        },
        controleContinu: false,
    }
};