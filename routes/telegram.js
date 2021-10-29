var express = require('express');
const {getAllInboxes} = require("../services/database");
const {blockInbox} = require("../services/database");
const {sendMessage} = require("../services/telegram");
const {createInboxMapping} = require("../services/database");
const {findOrCreateUserMapping} = require("../services/database");
const telegramCommandsParser = require("../services/telegramCommands");
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


  if(message.entities && message.entities[0]?.type ==="bot_command"){
    const result = await telegramCommandsParser(req.body);
    await sendMessage(result,req.body.message.chat.id);
  }else{
    await sendMessage("I'm just a bot, I can't reply... yet. ",req.body.message.chat.id);
  }
  res.send('');
});

module.exports = router;
