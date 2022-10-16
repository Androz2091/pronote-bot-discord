const { EmbedBuilder, ApplicationCommandOptionType, ChannelType } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: {
        description: "Configurer le .env depuis Discord",
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "salon-devoirs",
                description: "Définir le salon où seront envoyés les devoirs",
                options: [
                    {
                        type: ApplicationCommandOptionType.Channel,
                        name: "salon",
                        description: "Le salon où seront envoyés les devoirs",
                        required: true,
                        channelTypes: [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.PublicThread, ChannelType.PrivateThread]
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "salon-notes",
                description: "Définir le salon où seront envoyés les notes",
                options: [
                    {
                        type: ApplicationCommandOptionType.Channel,
                        name: "salon",
                        description: "Le salon où seront envoyés les notes",
                        required: true,
                        channelTypes: [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.PublicThread, ChannelType.PrivateThread]
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "salon-modifications",
                description: "Définir le salon où seront envoyés les modifications d'emploi du temps",
                options: [
                    {
                        type: ApplicationCommandOptionType.Channel,
                        name: "salon",
                        description: "Le salon où seront envoyés les modifications d'emploi du temps",
                        required: true,
                        channelTypes: [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.PublicThread, ChannelType.PrivateThread]
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "salon-info",
                description: "Définir le salon où seront envoyés les informations",
                options: [
                    {
                        type: ApplicationCommandOptionType.Channel,
                        name: "salon",
                        description: "Le salon où seront envoyés les informations",
                        required: true,
                        channelTypes: [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.PublicThread, ChannelType.PrivateThread]
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "nom-utilisateur",
                description: "Définir le nom d'utilisateur à utiliser pour se connecter à l'ENT",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "nom",
                        description: "Le nom d'utilisateur à utiliser pour se connecter à l'ENT",
                        required: true,
                        autocomplete: false,
                        minLength: 4,
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "mot-de-passe",
                description: "Définir le mot de passe à utiliser pour se connecter à l'ENT",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "mot-de-passe",
                        description: "Le mot de passe à utiliser pour se connecter à l'ENT",
                        required: true,
                        autocomplete: false,
                        minLength: 4,
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "url",
                description: "Définir l'URL de l'ENT",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "url",
                        description: "L'URL de l'ENT",
                        required: true,
                        autocomplete: false,
                        minLength: 16,
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "cas",
                description: "Si l'ENT utilise un CAS, définir le CAS",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "cas",
                        description: "Le CAS de l'ENT",
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "debug",
                description: "Activer ou désactiver le mode debug",
                options: [
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "debug",
                        description: "Activer ou désactiver le mode debug",
                        required: true,
                        autocomplete: false
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "auto-update",
                description: "Activer ou désactiver la mise à jour automatique",
                options: [
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "auto-update",
                        description: "Activer ou désactiver la mise à jour automatique",
                        required: true,
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "voir",
                description: "Voir la configuration actuelle",
                options: [
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "mot-de-passe",
                        description: "Voir le mot de passe (uniquement pour le créateur du bot)",
                        required: false,
                    }
                ]
            }
        ],
    },
    execute: async (client, interaction) => {
        const updateEnv = (key, value) => {
            const env = fs.readFileSync("./.env", "utf8");
            const regex = new RegExp(`^${key}=(.*)$`, "m");
            const newEnv = env.replace(regex, `${key}="${value}"`);
            fs.writeFileSync("./.env", newEnv);
            require("dotenv").config();
            process.env[key] = value;
        };

        if (interaction.options.getSubcommand() === "salon-devoirs") {
            const channel = interaction.options.getChannel("salon");
            if (!channel) {
                return interaction.editReply({
                    content: "Veuillez spécifier un salon valide",
                    ephemeral: true
                });
            }
            updateEnv("HOMEWORKS_CHANNEL_ID", channel.id);
            return await interaction.editReply(`Le salon devoirs a été défini sur ${channel}`);
        }
        else if (interaction.options.getSubcommand() === "salon-notes") {
            const channel = interaction.options.getChannel("salon");
            if (!channel) {
                return interaction.editReply({
                    content: "Veuillez spécifier un salon valide",
                    ephemeral: true
                });
            }
            updateEnv("MARKS_CHANNEL_ID", channel.id);
            return await interaction.editReply(`Le salon notes a été défini sur ${channel}`);
        }
        else if (interaction.options.getSubcommand() === "salon-modifications") {
            const channel = interaction.options.getChannel("salon");
            if (!channel) {
                return interaction.editReply({
                    content: "Veuillez spécifier un salon valide",
                    ephemeral: true
                });
            }
            updateEnv("AWAY_CHANNEL_ID", channel.id);
            return await interaction.editReply(`Le salon modifications a été défini sur ${channel}`);
        }
        else if (interaction.options.getSubcommand() === "salon-info") {
            const channel = interaction.options.getChannel("salon");
            if (!channel) {
                return interaction.editReply({
                    content: "Veuillez spécifier un salon valide",
                    ephemeral: true
                });
            }
            updateEnv("INFOS_CHANNEL_ID", channel.id);
            return await interaction.editReply(`Le salon info a été défini sur ${channel}`);
        }
        else if (interaction.options.getSubcommand() === "nom-utilisateur") {
            const username = interaction.options.getString("nom");
            if (!username) {
                return interaction.editReply({
                    content: "Veuillez spécifier un nom d'utilisateur valide",
                    ephemeral: true
                });
            }
            updateEnv("PRONOTE_USERNAME", username);
            return await interaction.editReply(`Le nom d'utilisateur a été défini sur ${username}`);
        }
        else if (interaction.options.getSubcommand() === "mot-de-passe") {
            const password = interaction.options.getString("mot-de-passe");
            if (!password) {
                return interaction.editReply({
                    content: "Veuillez spécifier un mot de passe valide",
                    ephemeral: true
                });
            }
            updateEnv("PRONOTE_PASSWORD", password);
            return await interaction.editReply("Le mot de passe a été défini");
        }
        else if (interaction.options.getSubcommand() === "url") {
            const url = interaction.options.getString("url");
            if (!url) {
                return interaction.editReply({
                    content: "Veuillez spécifier une URL valide",
                    ephemeral: true
                });
            }
            updateEnv("PRONOTE_URL", url);
            return await interaction.editReply(`L'URL a été définie sur ${url}`);
        }
        else if (interaction.options.getSubcommand() === "cas") {
            const cas = interaction.options.getString("cas");
            const { casList } = require("pronote-api-maintained");

            if (!cas || !casList.includes(cas)) {
                return interaction.editReply({
                    content: "Veuillez spécifier un CAS valide",
                    ephemeral: true
                });
            }
            updateEnv("PRONOTE_CAS", cas);
            return await interaction.editReply(`Le CAS a été défini sur ${cas}`);
        }
        else if (interaction.options.getSubcommand() === "debug") {
            const debug = interaction.options.getBoolean("debug");
            updateEnv("DEBUG_MODE", debug);
            return await interaction.editReply(`Le mode debug a été défini sur ${debug}`);
        }
        else if (interaction.options.getSubcommand() === "auto-update") {
            const autoUpdate = interaction.options.getBoolean("auto-update");
            updateEnv("AUTO_UPDATE", autoUpdate);
            return await interaction.editReply(`La mise à jour automatique a été définie sur ${autoUpdate}`);
        }
        else if (interaction.options.getSubcommand() === "voir") {
            const env = fs.readFileSync("./.env", "utf8");
            const regex = new RegExp("^PRONOTE_PASSWORD=(.*)$", "m");
            let password = "\*\*\*\*\*\*\*\*";

            if (interaction.options.getBoolean("mot-de-passe")) {
                if ((client.application.owner?.members && client.application.owner?.members.has(interaction.user.id)) || client.application.owner?.id === interaction.user.id) {
                    password = env.match(regex)[1];
                }
            }

            const embed = new EmbedBuilder()
                .setTitle("Configuration actuelle")
                .setColor("#70C7A4")
                .addFields([
                    {
                        name: "Salon devoirs",
                        value: (process.env.HOMEWORKS_CHANNEL_ID ? `<#${process.env.HOMEWORKS_CHANNEL_ID}>` : "Non défini") + `\n</config salon-devoirs:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Salon notes",
                        value: (process.env.MARKS_CHANNEL_ID ? `<#${process.env.MARKS_CHANNEL_ID}>` : "Non défini") + `\n</config salon-notes:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Salon modifications",
                        value: (process.env.AWAY_CHANNEL_ID ? `<#${process.env.AWAY_CHANNEL_ID}>` : "Non défini") + `\n</config salon-modifications:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Salon info",
                        value: (process.env.INFOS_CHANNEL_ID ? `<#${process.env.INFOS_CHANNEL_ID}>` : "Non défini") + `\n</config salon-info:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Nom d'utilisateur",
                        value: process.env.PRONOTE_USERNAME + `\n</config nom-utilisateur:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Mot de passe",
                        value: "||" + password + "||" + `\n</config mot-de-passe:${interaction.commandId}>`,
                    },
                    {
                        name: "URL",
                        value: process.env.PRONOTE_URL + `\n</config url:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "CAS",
                        value: process.env.PRONOTE_CAS + `\n</config cas:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Mode debug",
                        value: process.env.DEBUG_MODE + `\n</config debug:${interaction.commandId}>`,
                        inline: true
                    },
                    {
                        name: "Mise à jour automatique",
                        value: process.env.AUTO_UPDATE + `\n</config auto-update:${interaction.commandId}>`,
                        inline: true
                    }
                ]);
            return await interaction.editReply({
                embeds: [embed],
                ephemeral: interaction.options.getBoolean("mot-de-passe")
            });
        }
    },
};