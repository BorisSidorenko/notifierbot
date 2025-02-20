import { Events } from 'discord.js';
import { checkIfDiscordUserExists, saveDiscordUser, getTargetTelegramChatIds } from '../database.js';

const userCooldowns = new Map();
const COOLDOWN_DURATION = 5000;

function execute(oldSate, newState, sendTelegramMessage) {
    try {
        const isNewlyConnectedUser = !oldSate.channel;
        const isNewlyDisConnectedUser = !newState.channel;

        if (isNewlyConnectedUser|| isNewlyDisConnectedUser) {
            const userId = newState.member.id;
            const userName = newState.member.displayName;

            checkIfDiscordUserExists(userId)
            .then((userIdFromDb) => !userIdFromDb ? saveDiscordUser(userId, userName) : userId)
            .catch((err) => console.log(err.message));

            const currentTime = Date.now();

            if (userCooldowns.has(userId) && currentTime - userCooldowns.get(userId) < COOLDOWN_DURATION) {
                return
            }
            userCooldowns.set(userId, currentTime);
            
            const user = isNewlyConnectedUser ? newState.member.displayName : oldSate.member.displayName;
            const channelName = isNewlyConnectedUser ? newState.channel.name : oldSate.channel.name;
            const guildName = isNewlyConnectedUser ? newState.guild.name : oldSate.guild.name;

            const message = isNewlyConnectedUser ? 
                `*${user}* залетел на канал *${channelName}* в ${guildName} и ждёт тебя для жарких каток`
                :
                `*${user}* понял, что команду мечты не дождаться и ливнул с канала *${channelName}* на ${guildName}`;
            
            getTargetTelegramChatIds()
                .then((chatIds) => {
                    !!chatIds && chatIds.forEach(chatId => {
                        sendTelegramMessage(chatId, message);
                    });
                })
                .catch((err) => console.log(err));
        }
    } catch (e) {
        console.log(e);
    }
}

export default {
    name: Events.VoiceStateUpdate,
    execute
}