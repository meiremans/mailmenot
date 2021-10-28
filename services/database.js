const { MongoClient } = require('mongodb');
console.log("process.env.MONGODB")
console.log(process.env.MONGODB)
const uri = process.env.MONGODB;

const ObjectID = MongoClient.ObjectID;
let db;
let collection, inboxCollection;

exports.init = async () => {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db("mailmenot");
    collection = db.collection('users');
    await collection.createIndex({ conversationId: 1 }, { unique: true });

    inboxCollection = db.collection('inboxes');
    await inboxCollection.createIndex({ inboxURI: 1 }, { unique: true });
}

exports.getNewId = () => new ObjectID();

exports.findOrCreateUserMapping = async (telegramUpdate) => {
    const conversationId = telegramUpdate.message?.chat?.id;
    if (!conversationId) return; //then it's an edited message, ignore this
    const result = await collection.findOne({conversationId : telegramUpdate.message.chat.id});
    if(!result){
        const user = {
            conversationId : telegramUpdate.message.chat.id,
            mailPrefix : `other${telegramUpdate.message.chat.first_name.toLowerCase()}`
        }
        const result = await collection.insertOne(user);
        return{_id : result.insertedId, ...user};
    }else{
        return result;
    }
}

exports.createInboxMapping = async (telegramUpdate,inboxSuffix, inboxName) => {
   const userMapping = await this.findOrCreateUserMapping(telegramUpdate);

   const inbox = {
       conversationId : userMapping.conversationId,
       inboxURI : `${userMapping.mailPrefix}_${inboxSuffix}`,
       inboxName
   }
    inboxCollection.insertOne(inbox);
}

exports.getInboxMappingByEmailAddress = async (inboxURI) => {
   return await inboxCollection.findOne(inboxURI);
}

exports.getChatIdByMailPrefix = async (mailPrefix) => {
    return await collection.findOne({mailPrefix: mailPrefix.toLowerCase()});
}

exports.close = () => {
    client.close();
}