import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { Client, GatewayIntentBits } from 'discord.js';
import { DB, saveNewUser, updateTelegramUser } from './database.js';
import voiceStateUpdate from './events/voiceStateUpdate.js';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
})

client.login(process.env.DISCORD_TOKEN);

const getOnlineUsersInDiscord = () => {
    return new Promise((resolve, reject) => {
        client.guilds.fetch(process.env.DISCORD_GUILD_ID)
        .then((guild) => 
            guild.members.fetch()
            .then((res) => {
                let users = res.filter((member) => member.voice.channelId === process.env.DISCORD_DOTA_CHANNEL_ID || member.voice.channelId === process.env.DISCORD_CS_CHANNEL_ID)
                users = users.map((member) => member.id);
                resolve(users);
            })
            .catch((err) => reject(err))
        )
        .catch((err) => reject(err))
    })
}

const telegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

telegramBot.onText(/\/start _([^_]+)_([^_]+)/, (msg, match) => {
    const [, discordId, discordUserName] = match;
    const chatIdFromMsg = msg.chat.id;
    const userNameFromMsg = msg.chat.username;

    saveNewUser(chatIdFromMsg, userNameFromMsg, discordId, discordUserName)
    .then(() => telegramBot.sendMessage(chatIdFromMsg, 'Ты подписался!'))
    .catch((err) => console.log(err.message));
});

telegramBot.onText(/\/stop/, (msg, match) => {
    const chatIdFromMsg = msg.chat.id;
    const userNameFromMsg = msg.chat.username;
    updateTelegramUser(chatIdFromMsg, userNameFromMsg, 0)
    .then(() => telegramBot.sendMessage(chatIdFromMsg, 'Ну всё давай, бб...'))
    .catch((err) => console.log(err.message));
});

const sendTelegramMessage = (chatId, message) => telegramBot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });

if (voiceStateUpdate.once) {
    client.once(
        voiceStateUpdate.name, 
        (oldSate, newState) => voiceStateUpdate.execute(
            oldSate, 
            newState, 
            getOnlineUsersInDiscord,
            sendTelegramMessage
        ));
} else {
    client.on(
        voiceStateUpdate.name, 
        (oldSate, newState) => voiceStateUpdate.execute(
            oldSate, 
            newState, 
            getOnlineUsersInDiscord,
            sendTelegramMessage
        ));
}

console.log("App is up and running!");