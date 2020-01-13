const Telegraf = require('telegraf');

var NotifierBot = function (telegramToken, telegramIDList, helpText) {
    this._telegramToken = telegramToken;
    this._telegramIDList = telegramIDList;
    this._errorHandlerCallback = null;

    this._helpText = helpText;
    this._bot = new Telegraf(telegramToken);


    this._bot.start((ctx) => ctx.reply('Welcome to notifier bot! '+this._helpText))
    this._bot.help((ctx) => ctx.reply(this._helpText))
    const command = "/myid";
    this._bot.command(command, function(ctx){
        const receivedText = ctx.message.text;
        const receivedTitle = receivedText.substring(command.length+1);
        const userID = ctx.message.from.id;
        const chatID = ctx.chat.id;
        ctx.reply("Your id is "+userID+" and your chat id is "+chatID);
    })
    this._bot.on('message', function(ctx){
        ctx.reply('Oops, this is not a command. Get help by typing /help')
    })
    this._bot.launch()
};

NotifierBot.prototype.notifyUsers = function (message) {
    const IDList = this._telegramIDList;
    const self = this;
    IDList.forEach(ID => {
        this._bot.telegram.sendMessage(ID, message).catch(function(err){
            if(self._errorHandlerCallback) {
                self._errorHandlerCallback(err)
            } else {
                console.log("Error handler is not set.")
            }
        })
    });
}

NotifierBot.prototype.setErrorHandler = function (callback) {
    this._errorHandlerCallback = callback;
}

module.exports = NotifierBot;