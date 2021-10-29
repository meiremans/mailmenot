const createError = require('http-errors');
const {getTemplate} = require("./templates/upgradeMessage");
const express = require('express');
require('dotenv').config();
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const telegramRouter = require('./routes/telegram');
const database = require('./services/database');
const telegram = require('./services/telegram');

const app = express();

database.init()
    .then(db => versionUpdate(db))
    .then((updateMessage) => {
  console.log(updateMessage);
      if(updateMessage){
        const users = database.getAllUsers();
        const sendMessages = users.map(x => telegram.sendMessage(updateMessage,x.conversationId, "html"));
        Promise.all(sendMessages);
      }
  const imap = require('./services/imap'); //on require it will start listening

// view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  app.use('/telegram', telegramRouter);
  app.db = database.db;


// catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

// error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  app.emit('appStarted');
}).catch(e => {
  console.error(e);
});

const versionUpdate = async (db) => {
  const systeminfo = db.collection('systeminfo');

  const version = await systeminfo.findOne({_id : "version"});
  const newVersion =  require('./package.json').version;
  if(!version || version.value !== newVersion){
    console.warn('will upgrade data to latest version');
    try{
      systeminfo.insertOne({_id : "version", value : newVersion});
      const changelog = require('./changelog');
      return getTemplate(changelog[newVersion]);
    }catch(e){
      console.error("upgrade failed",e);
    }

  }else{
    console.log(`mailmenot is running V${version.value}`);
  }

}

module.exports = app;
