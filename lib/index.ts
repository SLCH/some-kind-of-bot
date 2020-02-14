import { ChatClient } from 'dank-twitch-irc';
import { execSync } from 'child_process';

const started = new Date();

const devs = [
    'slch000'
]

const devChannels = [
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

(async function main() {

    let client = new ChatClient({
        username: '',
        password: '',
    });

    client.on("ready", () => console.log("Successfully connected to chat"));
    client.on("close", error => {
    if (error != null) {
        console.error("Client closed due to error", error);
    }
    });

    startDefaultEventHandlers(client);

    client.connect();
})()

function onConnect(c: ChatClient) {
    c.say('slchbot', 'MrDestructoid Connected ❗');
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
                    "Bot running for": `${botRunningTime} seconds`,
                    " ": temps
                };
                response = Object.entries(data).map(([name, value]) => name + ": " + value).join("; ")
                break;
            case('exec'):
                if (!isDev) {
                    return;
                }
                response = execSync(commandText).toString();
                break;
            default:
                break;
        }
        if (response) {
            c.say(responseChannel, response);
        }
    });
}

function startDefaultEventHandlers(c: ChatClient) {
    onConnect(c);
    onReconnect(c);
    listenToChannels(c);
    handleBasicCommands(c);
}
