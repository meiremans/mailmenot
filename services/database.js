const { MongoClient } = require('mongodb');
console.log("process.env.MONGODB")
console.log(process.env.MONGODB)
const uri = process.env.MONGODB;

const ObjectID = MongoClient.ObjectID;
let db;
let collection;

exports.init = async () => {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db("mailmenot");
    collection = db.collection('users');
}

exports.getNewId = () => new ObjectID();

exports.findOrCreateUserMapping = async (telegramUpdate) => {
    const result = await collection.findOne({conversationId : telegramUpdate.message.chat.id});
    if(!result){
        const user = {
            conversationId : telegramUpdate.message.chat.id,
            mailPrefix : `other${telegramUpdate.message.chat.first_name.toLowerCase()}`
        }
       return collection.insert(user);
    }else{
        return result;
    }

}

exports.getChatIdByMailPrefix = async (mailPrefix) => {
    return await collection.findOne({mailPrefix: mailPrefix.toLowerCase()});
}

exports.close = () => {
    client.close();
}