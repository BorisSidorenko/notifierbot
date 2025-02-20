import sqlite3 from 'sqlite3';
const sql3 = sqlite3.verbose();

const DB = new sql3.Database('./notifier.db', connected);

function connected(err) {
    if (err) {
        console.log(err.message);
        return;
    }
    console.log('Connected to the DB');
}

function setupTelegramUsersTable () {
    let sql = `CREATE TABLE IF NOT EXISTS TelegramUsers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        chatId INTEGER NOT NULL, 
        userName TEXT NOT NULL
    )`;
    DB.run(sql, [], (err) => {
        if (err) {
            console.log('error creating TelegramUsers table');
            return;
        }
        console.log('Created TelegramUsers table or the table already exists');
    });
}

function setupDiscordUsersTable () {
    let sql = `CREATE TABLE IF NOT EXISTS DiscordUsers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        userId INTEGER NOT NULL, 
        userName TEXT NOT NULL
    )`;
    DB.run(sql, [], (err) => {
        if (err) {
            console.log('error creating DiscordUsers table');
            return;
        }
        console.log('Created DiscordUsers table or the table already exists');
    });
}

function setupDiscordToTelegramTable () {
    let sql = `CREATE TABLE IF NOT EXISTS DiscordToTelegramUsers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        telegramChatId INTEGER NOT NULL, 
        discordUserId INTEGER NOT NULL,
        FOREIGN KEY (telegramChatId) REFERENCES TelegramUsers (chatId),
        FOREIGN KEY (discordUserId) REFERENCES DiscordUsers (userId)
    )`;
    DB.run(sql, [], (err) => {
        if (err) {
            console.log('error creating DiscordToTelegramUsers table');
            return;
        }
        console.log('Created DiscordToTelegram table or the table already exists');
    });
}

function checkIfDiscordToTelegramUserExists (telegramChatId, discordUserId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT telegramChatId, discordUserId from DiscordToTelegramUsers WHERE telegramChatId = ? AND discordUserId = ?';
        DB.get(sql, [telegramChatId, discordUserId], (err, row) => {
            if (err) reject(err);
            resolve(row?.telegramChatId);
        });
        
    })
}


function checkIfTelegramUserExists (chatId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT chatId from TelegramUsers WHERE chatId = ?';
        DB.get(sql, [chatId], (err, row) => {
            if (err) reject(err);
            resolve(row?.chatId);
        });
        
    })
}

function getTargetTelegramChatIds () {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT chatId from TelegramUsers';
        DB.all(sql, [], (err, rows) => {
            if (err) reject(err);
            resolve(rows?.map((user) => user.chatId));
        })
    })
}

function saveNewUser (telegramChatId, telegramUserName, discordUserId, discordUserName) {
    return Promise.all([
        saveTelegramUser(telegramChatId, telegramUserName),
        saveDiscordUser(discordUserId, discordUserName),
        saveDiscordToTelegramUser(telegramChatId, discordUserId)
    ])
    .then(() => console.log('New user was added successfully'))
    .catch((err) => console.log(err.message));
}

function saveDiscordToTelegramUser (telegramChatId, discordUserId) {
    const sql = 'INSERT INTO DiscordToTelegramUsers(telegramChatId, discordUserId) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
        checkIfDiscordToTelegramUserExists(telegramChatId, discordUserId)
            .then((idFromDb) => {
                if (!idFromDb) {
                    DB.run(sql, [telegramChatId, discordUserId], function (err) {
                        if (err) reject(err);
                        console.log(`New user added to DiscordToTelegramUsers - ${telegramChatId}:${discordUserId}`);
                        resolve(this.lastID);
                    });
                }
            })
    })
}

function saveTelegramUser (chatId, userName) {
    const sql = 'INSERT INTO TelegramUsers(chatId, userName) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
        checkIfTelegramUserExists(chatId)
            .then((idFromDb) => {
                if (!idFromDb) {
                    DB.run(sql, [chatId, userName], function (err) {
                        if (err) reject(err);
                        console.log(`New user added to TelegramUsers - ${userName}:${chatId}`);
                        resolve(this.lastID);
                    });
                }
            })
            .catch((err) => console.log(err.message));
        
    })
}

function checkIfDiscordUserExists (discordUserId) {
    const sql = 'SELECT userId from DiscordUsers WHERE userId = ?';
    return new Promise((resolve, reject) => {
        DB.get(sql, [discordUserId], (err, row) => {
            if (err) reject(err);
            resolve(row?.userId);
        });
        
    })
}

function saveDiscordUser (userId, userName) {
    const sql = 'INSERT INTO DiscordUsers(userId, userName) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
        checkIfDiscordUserExists(userId)
        .then((idFromDb) => {
            if (!idFromDb) {
                DB.run(sql, [userId, userName], function (err) {
                    if (err) reject(err);
                    console.log(`New user added to TelegramUsers - ${userName}:${userId}`);
                    resolve(this.lastID);
                });
            }
        })
        .catch((err) => console.log(err.message));
    })
}


(function setupTables() {
    setupTelegramUsersTable();
    setupDiscordUsersTable();
    setupDiscordToTelegramTable();
})()

export { 
    DB, 
    checkIfTelegramUserExists, 
    saveTelegramUser, 
    checkIfDiscordUserExists, 
    saveDiscordUser,
    getTargetTelegramChatIds,
    saveNewUser
}