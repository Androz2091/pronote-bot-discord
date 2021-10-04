# Pronote Discord Bot

Un bot Discord très simple qui envoie des notifications  dans un salon sur Discord lorsqu'un devoir ou une note est ajouté sur Pronote, ou lorsqu'un enseignant est absent ! 📚  

Si vous êtes plus à l'aise avec Python vous pouvez également utiliser le bot de **[busybox11](https://github.com/busybox11/probote)**, qui sera surement compatible avec la dernière version de Pronote bientôt ! 💫

![screen-exemple](./screen-exemple.png)


## Fonctionnalités

Ce bot *incroyable* peut vous permettre de réaliser plusieurs actions et d'avoirs des informations sur:

### Notifications
- Vos nouvelles notes
    * Indique le niveau de la note
        + La meilleure note de la classe
        + Une note au dessus de la moyenne de la classe
    * Indique **votre note**
    * Indique la **moyenne** de la casse
    * Indique la note la **plus basse**
    * Et indique la note la **plus haute**
    * Indique votre **moyenne** dans la **matière**
    * Indique la **moyenne** de la **classe*
- Puis pas extension, la moyenne générale
    * Moyenne générale de l'**élève**
    * Moyenne générale de la **classe**
    * L'**ancienne** moyenne de l'**élève**
    * L'**ancienne** moyenne de la **classe*
    * La *modification* qu'il y a eu pour l'**élève**
    * La *modification* qu'il y a eu pour la **classe**
- Pour les devoirs
    * La matière
    * Le devoir
    * La date pour le rendre
- Modification de cours
    * Si le cours est annulé ou que le professeur est absent
    * La matière
    * Le professeur
    * La date
- Nouvelles communications
    * L'auteur de la communication
    * Le titre de la communication
    * Le contenu de la communication

### Commandes
- `/cours` pour avoir l'emploie du temps du jour
- `/recheck` pour effectuer de nouveau une vérification
- `/ping` pour avoir le ping du bot et quelques informations
- `/info` pour avoir les informations sur le compte

## Installation

### Node.js
Node.js est requis pour le bon fonctionnement du bot. Il faut donc aller le [télécharger](https://nodejs.org/en/download/current/) sur son site à la **dernière** version, c'est à dire la `16.x.X`


### Windows
* Cloner le repository (`git clone https://github.com/Merlode11/pronote-discord-bot`) ou alors téléchargez la version compressée depuis GitHub
* Renommer le fichier `.env.example` en `.env` et le compléter.
* Lancer le bot avec le ficher bat `start-pronote-bot.bat`
* C'est fini !

### Mac/Linux *Ou aussi Windows, ça fonctionne aussi très bien*
*Il y a juste une étape en plus, ne vous inquiétez pas*

* Cloner le repository (`git clone https://github.com/Merlode11/pronote-discord-bot`) ou alors téléchargez la version compressée depuis GitHub
* Renommer le fichier `.env.example` en `.env` et le compléter.
* Installer les modules (`npm install`) *Via un terminal pointant vers le dossier du bot (`cd EMPLACEMENT_DOSSIER`)*
* Lancer le bot (`node index.js`)
* C'est fini !

## Crédit

Le bot est à l'origine créé par [@Androz2091](https://github.com/Androz2091/pronote-bot-discord). Je lui ai apporté des modifications pour l'améliorer et le rendre plus utile que ce qu'il n'était. 


## Retours
### Bugs
En cas de bug ou de problème d'installation vous pouvez ouvrir une [**`Issue`**](https://github.com/Merlode11/pronote-bot-discord/issues/new?assignees=Merlode11&labels=bug%2C+help+wanted&template=signaler-un-bug.md&title=%5BBUG%5D) ou alors contactez moi sur Discord: `Merlode#8128`
### Suggestions
Si vous avez la moindre suggestion, proposez là dans les [**`Issue`**](https://github.com/Merlode11/pronote-bot-discord/issues/new?assignees=Merlode11&labels=enhancement&template=proposer-une-fonctionnalit-.md&title=%5BSUGGESTION%5D), elles sont là pour ça
### Merci
Merci à vous de me supporter dans cette aventure que je commence tout juste et si vous pouvez laisser une petite star ça ferait vraiment plaisir