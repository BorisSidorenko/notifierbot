import { Events } from 'discord.js';
import { getTargetTelegramChatIds } from '../database.js';

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
            const guildName = isNewlyConnectedUser ? newState.guild.name : oldSate.guild.name;

            const message = isNewlyConnectedUser ? 
                `*${user}* залетел на канал *${channelName}* в ${guildName} и ждёт тебя для жарких каток`
                :
                `*${user}* понял, что команду мечты не дождаться и ливнул с канала *${channelName}* на ${guildName}`;

            getTargetTelegramChatIds()
            .then((res) => {
                getOnlineUsersInDiscord()
                .then((discordUsers) => {
                    const discordUsersToCheck = isNewlyConnectedUser ? discordUsers : [...discordUsers, oldSate.id];
                    res.filter((r) => !discordUsersToCheck.includes(r.discordUserId)).forEach((u) => {
                        sendTelegramMessage(u.telegramChatId, message)
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