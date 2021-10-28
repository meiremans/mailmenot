var express = require('express');
const {blockInbox} = require("../services/database");
const {sendMessage} = require("../services/telegram");
const {createInboxMapping} = require("../services/database");
const {findOrCreateUserMapping} = require("../services/database");
var router = express.Router();

router.get('/hook', async (req, res, next) => {
  res.send('POST to this endpoint');
});

router.post('/hook', async (req, res, next) => {
  console.log(req.body);
  if(req.body.edited_message) {
    await sendMessage("sneaky sneaky edits are not supported",req.body.edited_message.chat.id);
    res.send('');
    return;
  }
  const message = req.body.message;

  const usermapping = await findOrCreateUserMapping(req.body);
  if(!usermapping) return   res.send('');

  if(message.entities && message.entities[0]?.type ==="bot_command"){
    const result = await botCommands(req.body,message, usermapping);
    await sendMessage(result,req.body.message.chat.id);
  }else{
    await sendMessage("I'm just a bot, I can't reply... yet. ",req.body.message.chat.id);
  }
  res.send('');
});

const botCommands = async (telegramUpdate, message, usermapping) => {
  const conversationId = telegramUpdate.message?.chat?.id;
  const command = message.text.substring(message.entities[0].offset, message.entities[0].length);
  const arguments = message.text.substring(message.entities[0].length).trim().split(" ");


  if(command === "/help"){
    return 'Commands: \n' +
        '/help: this one \n' +
        '/new inboxName inboxSuffix (optional) make a new named inbox \n' +
        '/block inboxName (only named inboxes can be blocked)'
  }

  //make new named inbox /new inboxName inboxSuffix (optional)
  if (command === "/new") {
    const inboxName = arguments[0];
    const inboxSuffix = arguments[1] ? arguments[1] : arguments[0];
    const inbox = await createInboxMapping(telegramUpdate, inboxSuffix, inboxName);
    return `inbox ${inbox.inboxURI} created, named as ${inbox.inboxName}`
  }
  if(command === "/start"){
    return `welcome ${message.chat.first_name} to mailmenot 
    your email prefix is ${usermapping.mailPrefix}
    you can send emails to ${usermapping.mailPrefix}_WHATEVER@${process.env.domain}
    you can create a mapping with /new to give inboxes names (this name will be shown in "FROM"
    /help gives you more information
    
    For questions or remarks, one place:
    https://github.com/meiremans/mailmenot
    `
  }

  if(command === "/block"){
    const inboxName = arguments[0];
    const result = await blockInbox(conversationId, inboxName);
    if(result){
      return `inbox ${result.value.inboxName} <${result.value.inboxURI}> is now blocked`
    }
  }

  return "What's that? try /help";

}

module.exports = router;
