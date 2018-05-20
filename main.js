/*
 *  This file is part of RuneScape-Discord Chat Sync
 *  Copyright (C) 2018 Alejandro Ramos
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const RuneScapeSync = require("./RuneScapeSync");
const Queue = require("./Queue");
const DiscordSync = require("./DiscordSync");

let toRuneScapeQueue = new Queue(RuneScapeSync.toQueueListener);
let fromRuneScapeQueue = new Queue(() => {
    while (fromRuneScapeQueue.length() > 0) {
        toDiscordQueue.push(fromRuneScapeQueue.getMessage(0), fromRuneScapeQueue.getAuthor(0));
        fromRuneScapeQueue.shift();
    }
});

let toDiscordQueue = new Queue(DiscordSync.toQueueListener);
let fromDiscordQueue = new Queue(() => {
    while (fromDiscordQueue.length() > 0) {
        toRuneScapeQueue.push(fromDiscordQueue.getMessage(0), fromDiscordQueue.getAuthor(0));
        fromDiscordQueue.shift();
    }
});

let rs = new RuneScapeSync(toRuneScapeQueue, fromRuneScapeQueue);
let discord = new DiscordSync(toDiscordQueue, fromDiscordQueue);

(async() => {
    rs.start();
    discord.start();
})();

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});
const fs = require("fs");

const config = require("./config.json");

function shutdown() {
    console.log("\n" + getDateTime() + ": Shutting down!");
    Promise.all([rs.shutdown(), discord.shutdown()]);
    process.exit();
}

readline.on("line", (input) => {
    switch (input) {
        case "html":
            let html = rs.getHTML();
            if (html !== undefined) {
                const name = getDateTime().replace(/:/g, ".") + ".html";
                fs.writeFile(config.configs.htmlDumpDirectory + name, html, (err) => {
                    if (!err) {
                        console.log("Saved HTML data as: " + name);
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log("Error: Can not get HTML data because the browser is not ready yet");
            }
            break;
        case "restart":
            Promise.all([rs.restart(), discord.restart()]);
            break;
        case "screenshot":
            let screenshot = rs.getScreenshot();
            if (screenshot !== undefined) {
                const name = getDateTime().replace(/:/g, ".") + ".png";
                fs.writeFile(config.configs.screenshotDirectory + name, screenshot, (err) => {
                    if (!err) {
                        console.log("Saved screenshot as: " + name);
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log("Error: Can not take screenshot because the browser is not ready yet");
            }
            break;
        case "shutdown":
            shutdown();
            break;
        default:
            console.log("Unknown command: " + input);
            break;
    }
});

readline.on("close", () => {
    shutdown();
});

function getDateTime() {
    let date = new Date();
    return date.getUTCFullYear() + ":" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + ":" + ("0" + date.getUTCDate()).slice(-2) + ":" + ("0" + date.getUTCHours()).slice(-2) + ":" + ("0" + date.getUTCMinutes()).slice(-2) + ":" + ("0" + date.getUTCSeconds()).slice(-2);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}