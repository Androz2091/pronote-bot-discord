// noinspection NonAsciiCharacters

// eslint-disable-next-line no-unused-vars
const { File } = require("pronote-api-maintained");
const fetch = require("node-fetch");
const { AttachmentBuilder } = require("discord.js");


module.exports = (client) => {
    client.functions = {
        /**
         * Like Array.prototype.forEach but asynchronous
         * @param array {Array} The array to loop through
         * @param callback {Function} The function to execute for each element
         * @return {Promise<void>}
         */
        asyncForEach: async (array, callback) => {
            for (let index = 0; index < array.length; index++) {
                await callback(array[index], index, array);
            }
        },
        /**
         * Remove all accents from a string
         * @param str {String} The string to remove accents from
         * @return {String}
         */
        transliterate: (str) => {
            const ru = {
                é: "e",
                è: "e",
                ê: "e",
                ë: "e",
                É: "E",
                È: "E",
                Ê: "E",
                Ë: "E",
                à: "a",
                â: "a",
                ä: "a",
                À: "A",
                Â: "A",
                Ä: "A",
                ô: "o",
                ö: "o",
                Ö: "O",
                Ô: "O",
                û: "u",
                ù: "u",
                Ù: "U",
                Û: "U",
                ï: "i",
                Ï: "I",
                ÿ: "y",
                Ÿ: "Y",
            };
            return str
                .split("")
                .map((char) => ru[char] || char)
                .join("");
        },
        /**
         * Verify if a string is valid
         * @param data {String} The string to verify
         * @param error {ErrorConstructor} The error message to send if the string is invalid
         * @param errorMessage {String} The error message to send if the string is invalid
         * @param allowEmpty {Boolean} If the string can be empty
         * @return {string} The string
         */
        verifyString: (
            data,
            error = Error,
            errorMessage = `Expected a string, got ${data} instead.`,
            allowEmpty = true,
        ) => {
            if (typeof data !== "string") throw new error(errorMessage);
            if (!allowEmpty && data.length === 0) throw new error(errorMessage);
            return data;
        },
        /**
         * Split a string into chunks if it's too long
         * @param text {String} The string to split
         * @param maxLength {Number} The maximum length of each chunk
         * @param char {String} The character to split the string with
         * @param prepend {String} The string to prepend to each chunk
         * @param append {String} The string to append to each chunk
         * @return {string[]|*[]} The chunks
         */
        splitMessage: (text, { maxLength = 2000, char = "\n", prepend = "", append = "" } = {}) => {
            text = client.functions.verifyString(text);
            if (text.length <= maxLength) return [text];
            let splitText = [text];
            if (Array.isArray(char)) {
                while (char.length > 0 && splitText.some(elem => elem.length > maxLength)) {
                    const currentChar = char.shift();
                    if (currentChar instanceof RegExp) {
                        splitText = splitText.flatMap(chunk => chunk.match(currentChar));
                    } else {
                        splitText = splitText.flatMap(chunk => chunk.split(currentChar));
                    }
                }
            } else {
                splitText = text.split(char);
            }
            if (splitText.some(elem => elem.length > maxLength)) throw new RangeError("SPLIT_MAX_LEN");
            const messages = [];
            let msg = "";
            for (const chunk of splitText) {
                if (msg && (msg + char + chunk + append).length > maxLength) {
                    messages.push(msg + append);
                    msg = prepend;
                }
                msg += (msg && msg !== prepend ? char : "") + chunk;
            }
            return messages.concat(msg).filter(m => m);
        },
        /**
         * Set the time in a string
         * @param time {Date} The time to set
         * @return {String} the time in a string
         */
        parseTime: (time= new Date) => {
            const hour = `${time.getHours()}`.length === 1 ? `0${time.getHours()}` : time.getHours();
            const min = `${time.getMinutes()}`.length === 1 ? `0${time.getMinutes()}` : time.getMinutes();
            const sec = `${time.getSeconds()}`.length === 1 ? `0${time.getSeconds()}` : time.getSeconds();
            const hours = hour + ":" + min + ":" + sec;

            const day = `${time.getDate()}`.length === 1 ? `0${time.getDate()}` : time.getDate();
            const month = `${time.getMonth() + 1}`.length === 1 ? `0${time.getMonth() + 1}` : (time.getMonth() + 1);
            const date = day + "/" + month + "/" + time.getFullYear();

            return `${date} ${hours}`;
        },

        /**
         * Get a pronote file properties
         * @param file {File} The pronote file
         * @return {Object} The file properties
         * @property {String} name The file name
         * @property {String} url The file url
         * @property {String} type The file type
         * @property {String} date The file date
         * @property {ArrayBuffer} buffer The file buffer
         * @property {AttachmentBuilder} attachment The file attachment
         */
        getFileProperties: async (file) => {
            const newFile = {
                name: file.name,
                url: file.url,
                subject: file.subject,
                time: file.time,
            };

            if (file.type === 1) {
                await new Promise((resolve, reject) => {
                    fetch(file.url, {
                        method: "GET"
                    }).then(response => {
                        return response.buffer();
                    }).then(async buffer => {
                        newFile.buffer = buffer;
                        newFile.type = "file";
                        newFile.attachment = new AttachmentBuilder(buffer, {
                            name: file.name,
                        });
                        resolve();
                    }).catch(reject);
                }).catch(console.error);
            } else {
                await new Promise((resolve, reject) => {
                    fetch(file.url, {
                        method: "GET",
                        followRedirects: true
                    }).then(response => {
                        newFile.url = response.url;
                        newFile.type = "link";
                        resolve();
                    }).catch(reject);
                }).catch(console.error);
            }
            return newFile;
        },
        /**
         * Set a file name as a Discord compatible name
         * @param name {String} The file name
         * @return {String} The Discord compatible name
         */
        setFileName: (name) => {
            return client.functions.transliterate(name).replace(/[^a-zA-Z0-9.\s\-_]/g, "").replace(/\s/g, "_");
        }
    };
};