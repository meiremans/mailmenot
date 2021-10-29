class TelegramCommand{
    constructor({command, executor, helpText}){
        this.command = command;
        this.executor = executor;
        this.helpText = helpText;
    }
}

module.exports = TelegramCommand;