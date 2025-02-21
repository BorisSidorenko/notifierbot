
const newlyConnectedMessages = [
    '${userName} пытается набрать на твой пейджер из канала ${channelName}, но тот почему-то недоступен...',
    '${userName} залетел на канал ${channelName} и ждёт тебя для жарких каток'
]

const newlyDisconnectedMessages = [
    '${userName} понял, что команду мечты не дождаться и ливнул с канала ${channelName} на RussianGame'
]

export const getRandomMessageFromMessages = (userName, channelName, isConnectedMessage) => {
    const messages = isConnectedMessage ? newlyConnectedMessages : newlyDisconnectedMessages;
    const messageTemplate = messages[Math.floor(Math.random() * messages.length)];
    return messageTemplate.replace('${userName}', userName).replace('${channelName}', channelName);
}

