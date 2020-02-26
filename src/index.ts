import 'source-map-support/register';
require('dotenv').config();
// import 'universal-dotenv/register';
import { ChatClient } from 'dank-twitch-irc';
import { execSync } from 'child_process';

const started = new Date();
const buildTime = new Date(process.env.__BUILD_TIME__!);

const devs = [
    'slch000'
]

const devChannels = [
    ...devs,
    'pajlada',
    'supinic',
    'slchbot'
]

const listeningToChannels = [
    ...devChannels,
    'forsen',
    'nymn',
    'roxi',
    'elajjaz',
];

function prepareResponse(r: string): string {
    // const regex = new RegExp(':cntrl:')
    const regex = new RegExp('[^\n\r\t]+');
    const cleared = regex.exec(r)!.join('');
    const cut = cleared.slice(0,200);
    return cut;
}

function onConnect(c: ChatClient) {
    devs.map(channel => {
        c.say(channel, 'MrDestructoid Connected ❗');
    });
}

function onReconnect(c: ChatClient) {
    c.on('RECONNECT', () => {
        devChannels.map(channel => {
            c.say(channel, 'MrDestructoid Reconnected ❗');
        })
    });
}

function listenToChannels(c: ChatClient) {
    listeningToChannels.map(channelName => {
        c.join(channelName);
    })
}

function handleBasicCommands(c: ChatClient) {
    c.on("PRIVMSG", msg => {
        if (!msg.messageText.startsWith("'")) {
            return;
        }

        const commandName = msg.messageText.split(' ')[0].slice(1).toLowerCase();
        const commandArgs = msg.messageText.split(' ').slice(1);
        const commandText = msg.messageText.slice(msg.messageText.indexOf(' ') + 1);
        const senderUsernameLowerCase = msg.senderUsername.toLowerCase();
        const isDev = devs.includes(senderUsernameLowerCase);

        let response: string | null = null;
        let responseChannel = msg.channelName;

        switch (commandName) {
            case('say'):
                if (!isDev) {
                    return;
                }
                if (commandArgs[0].startsWith('#')) {
                    responseChannel = commandArgs[0].slice(1);
                    response = commandText.slice(commandText.indexOf(' '));
                } else {
                    response = commandText;
                }
                break;
            case('ping'):
                const botRunningTime = ((new Date()).getTime() - started.getTime())/1e3;
                let temps = "";
                try {
                    const execRes = execSync("/opt/vc/bin/vcgencmd measure_temp").toString();
                    temps = execRes.slice(execRes.indexOf('=') + 1);
                } catch(e) {

                }
                const data = {
                    "Built at": buildTime.toUTCString(),
                    "Bot running for": `${botRunningTime} seconds`,
                    "Temperature": temps
                };
                response = Object.entries(data).map(([name, value]) => name + ": " + value).join("; ")
                break;
            case('exec'):
                if (!isDev) {
                    return;
                }
                response = execSync(commandText).toString();
                break;
            case('restart'):
                c.say(responseChannel, 'forsenC forsenGun MrDestructoid');
                execSync('pm2 reload bot');
                break;
            default:
                break;
        }
        if (response) {
            c.say(responseChannel, prepareResponse(response));
        }
    });
}

function startDefaultEventHandlers(c: ChatClient) {
    onConnect(c);
    onReconnect(c);
    listenToChannels(c);
    handleBasicCommands(c);
}

function startTwitchBot() {
    if (!process.env.TWITCH_BOT_USERNAME
        || !process.env.TWITCH_BOT_OAUTH) {
            throw new Error('envs undefined');
    }
    let client = new ChatClient({
        // TODO Make a config dict
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_BOT_OAUTH,
    });

    client.on("ready", () => console.log("Successfully connected to chat"));
    client.on("close", error => {
    if (error != null) {
        console.error("Client closed due to error", error);
    }
    });

    startDefaultEventHandlers(client);

    client.connect();
}

(async function main() {
    startTwitchBot();
})()
