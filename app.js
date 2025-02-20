import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { Client, GatewayIntentBits } from 'discord.js';
import { DB, saveNewUser } from './database.js';
import voiceStateUpdate from './events/voiceStateUpdate.js';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
})

client.login(process.env.DISCORD_TOKEN);

const telegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

telegramBot.on('message', (msg) => {
    const [, discordId, discordUserName] = msg.text.split("_");
    const chatIdFromMsg = msg.chat.id;
    const userNameFromMsg = msg.chat.username;

    saveNewUser(chatIdFromMsg, userNameFromMsg, discordId, discordUserName)
    .then(() => telegramBot.sendMessage(chatIdFromMsg, 'Received your message'))
    .catch((err) => console.log(err.message));
});

const sendTelegramMessage = (chatId, message) => telegramBot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });

if (voiceStateUpdate.once) {
    client.once(
        voiceStateUpdate.name, 
        (oldSate, newState) => voiceStateUpdate.execute(
            oldSate, 
            newState, 
            sendTelegramMessage
        ));
} else {
    client.on(
        voiceStateUpdate.name, 
        (oldSate, newState) => voiceStateUpdate.execute(
            oldSate, 
            newState, 
            sendTelegramMessage
        ));
}

console.log("App is up and running!");