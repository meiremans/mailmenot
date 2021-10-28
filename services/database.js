const { MongoClient } = require('mongodb');
let uri;
if(process.env.NODE_ENV === "test"){
    console.log(process.env.NODE_ENV);
    console.log("process.env.MONGODB_TEST")
    console.log(process.env.MONGODB_TEST)
    uri = process.env.MONGODB_TEST;
}else{
    console.log(process.env.NODE_ENV);
    console.log("process.env.MONGODB")
    console.log(process.env.MONGODB)
    uri = process.env.MONGODB;
}


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

exports.db = db;


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
    try{
        const userMapping = await this.findOrCreateUserMapping(telegramUpdate);

        const inbox = {
            conversationId : userMapping.conversationId,
            inboxURI : `${userMapping.mailPrefix}_${inboxSuffix}@${process.env.DOMAIN}`,
            inboxName
        }
        inboxCollection.insertOne(inbox);
    }catch(e){
        console.error(e);
    }

}

exports.getInboxMappingByEmailAddress = async (inboxURI) => {
   return await inboxCollection.findOne({inboxURI : inboxURI});
}

exports.getChatIdByMailPrefix = async (mailPrefix) => {
    return await collection.findOne({mailPrefix: mailPrefix.toLowerCase()});
}

exports.close = () => {
    client.close();
}