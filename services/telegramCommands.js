const TelegramCommand = require("../classes/TelegramCommand");
const {blockInbox} = require("./database");
const {findOrCreateUserMapping} = require("./database");
const {createInboxMapping} = require("./database");
const {getAllInboxes} = require("./database");

const parser = async (telegramUpdate) => {
    const conversationId = telegramUpdate.message?.chat?.id;
    const message = telegramUpdate.message;
    const name = telegramUpdate.message.chat.first_name;
    const command = message.text.substring(message.entities[0].offset, message.entities[0].length);
    const args = message.text.substring(message.entities[0].length).trim().split(" ");
    const telegramCommand = commandList.find(x => x.command === command);
    if(telegramCommand){
        return await telegramCommand.executor({conversationId,name, args});
    }else{
        return "What's that? try /help";
    }


}

const listExecutor = async ({conversationId, args}) => {
    const result = await getAllInboxes(conversationId);
    if (!result[0]) return "No named inboxes yet"
    return result.reduce((acc, inbox) => {
        return `${acc} Inbox ${inbox.inboxName} <${inbox.inboxURI}> ${inbox.isBlocked ? "BLOCKED" : "ACTIVE"}\n`
    }, '')
}

const newExecutor = async ({conversationId,name, args}) => {
    try{
    const inboxName = args[0];
    if(!inboxName) return "You must specify an inbox name";
    const inboxSuffix = args[1] ? args[1] : args[0];

    const inbox = await createInboxMapping({conversationId,name, inboxSuffix, inboxName});
    return `inbox ${inbox.inboxURI} created, named as ${inbox.inboxName}`
    }catch(e){
        return `inbox already exists`
    }
}

const startExecutor = async ({conversationId,name}) => {
    const usermapping = await findOrCreateUserMapping({conversationId, name});
    return `welcome ${name} to mailmenot 
    your email prefix is ${usermapping.mailPrefix}
    you can send emails to ${usermapping.mailPrefix}_WHATEVER@${process.env.domain}
    you can create a mapping with /new to give inboxes names (this name will be shown in "FROM"
    /help gives you more information
    
    For questions or remarks, one place:
    https://github.com/meiremans/mailmenot
    `
}

const blockExecutor = async ({conversationId,args}) => {
    const inboxName = args[0];
    const result = await blockInbox(conversationId, inboxName);
    if(result){
        return `inbox ${result.value.inboxName} <${result.value.inboxURI}> is now blocked`
    }else{
        return "Nope this inbox doesn't exist"
    }
}

const helpExecutor = (commandList) => {
    return () => {
        return commandList.reduce((acc,comm) => {
            return `${acc}\n${comm.command}: ${comm.helpText}`
        }, 'Commands:');
    }
}



const commandList = [
    new TelegramCommand({command : "/list", executor : listExecutor , helpText : "list named inboxes"}),
    new TelegramCommand({command : "/new", executor : newExecutor , helpText : "inboxName inboxSuffix (optional) make a new named inbox"}),
    new TelegramCommand({command : "/start", executor : startExecutor , helpText : "start the bot"}),
    new TelegramCommand({command : "/block", executor : blockExecutor , helpText : "inboxName (only named inboxes can be blocked)"})
]
const help = new TelegramCommand({command : "/help", executor : helpExecutor(commandList) , helpText : "This one"})
commandList.push(help);

module.exports = parser;


