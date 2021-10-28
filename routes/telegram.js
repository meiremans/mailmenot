var express = require('express');
const {sendMessage} = require("../services/telegram");
const {createInboxMapping} = require("../services/database");
const {findOrCreateUserMapping} = require("../services/database");
var router = express.Router();

/* GET users listing. */
router.post('/hook', async (req, res, next) => {
  console.log(req.body);
  const message = req.body.message;
  const usermapping = await findOrCreateUserMapping(req.body);

  if(message.entities && message.entities[0]?.type ==="bot_command"){
    const result = await botCommands(req.body,message, usermapping);
    await sendMessage(result,req.body.message.chat.id);
  }
  res.send('respond with a resource');
});

const botCommands = async (telegramUpdate, message, usermapping) => {
  const command = message.text.substring(message.entities[0].offset, message.entities[0].length);
  const arguments = message.text.substring(message.entities[0].length).trim().split(" ");


  if(command === "/help"){
    return 'Commands: \n' +
        '/help: this one \n' +
        '/new inboxName inboxSuffix (optional) make a new named inbox \n'
  }

  //make new named inbox /new inboxName inboxSuffix (optional)
  if (command === "/new") {
    const inboxName = arguments[0];
    const inboxSuffix = arguments[1] ? arguments[1] : arguments[0];
    await createInboxMapping(telegramUpdate, inboxSuffix, inboxName);
    return "inbox created"
  }
  if(command === "/start"){
    return `welcome ${message.chat.first_name} to mailmenot 
    your email prefix is ${usermapping.mailPrefix}
    you can send emails to ${usermapping.mailPrefix}_WHATEVER@${process.env.domain}
    you can create a mapping with /new to give inboxes names (this name will be shown in "FROM"
    For questions or remarks, one place:
    https://github.com/meiremans/mailmenot`

  }

}

module.exports = router;
