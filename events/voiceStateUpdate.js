import { Events } from 'discord.js';
import { getTargetTelegramChatIds } from '../database.js';
import { getRandomMessageFromMessages } from '../message.js';

const userCooldowns = new Map();

function execute(oldSate, newState, getOnlineUsersInDiscord, sendTelegramMessage) {
    try {
        const isNewlyConnectedUser = !oldSate.channel;
        const isNewlyDisConnectedUser = !newState.channel;

        if (isNewlyConnectedUser|| isNewlyDisConnectedUser) {
            const userId = newState.member.id;

            const currentTime = Date.now();

            if (userCooldowns.has(userId) && currentTime - userCooldowns.get(userId) < process.env.COOLDOWN_DURATION) {
                return
            }
            userCooldowns.set(userId, currentTime);
            
            const user = isNewlyConnectedUser ? newState.member.displayName : oldSate.member.displayName;
            const channelName = isNewlyConnectedUser ? newState.channel.name : oldSate.channel.name;
            
            getTargetTelegramChatIds()
            .then((res) => {
                getOnlineUsersInDiscord()
                .then((discordUsers) => {
                    const discordUsersToCheck = isNewlyConnectedUser ? discordUsers : [...discordUsers, oldSate.id];
                    res.filter((r) => !discordUsersToCheck.includes(r.discordUserId)).forEach((u) => {
                        sendTelegramMessage(u.telegramChatId, getRandomMessageFromMessages(user, channelName, isNewlyConnectedUser));
                    });
                })
            })
        }
    } catch (e) {
        console.log(e);
    }
}

export default {
    name: Events.VoiceStateUpdate,
    execute
}