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
    return db;
}

exports.db = db;

exports.getNewId = () => new ObjectID();

exports.getAllUsers = async () => await collection.find({}).toArray();

exports.findOrCreateUserMapping = async ({conversationId,name}) => {
    if (!conversationId) return; //then it's an edited message, ignore this
    const result = await collection.findOne({conversationId});
    if(!result){
        const user = {
            conversationId,
            mailPrefix : `other${name.toLowerCase()}`
        }
        const result = await collection.insertOne(user);
        return{_id : result.insertedId, ...user};
    }else{
        return result;
    }
}

exports.blockInbox = async (conversationId, inboxName) =>{
     return await inboxCollection.findOneAndUpdate({conversationId,inboxName},{$set : {isBlocked : true}},{returnNewDocument : true});
}

exports.createInboxMapping = async ({conversationId,name,inboxSuffix, inboxName}) => {
    try{
        const userMapping = await this.findOrCreateUserMapping({conversationId,name});

        const inbox = {
            conversationId : userMapping.conversationId,
            inboxURI : `${userMapping.mailPrefix}_${inboxSuffix}@${process.env.DOMAIN}`,
            inboxName,
            isBlocked : false
        }
        inboxCollection.insertOne(inbox);
        return inbox;
    }catch(e){
        console.error(e);
    }

}
exports.getAllInboxes = async (conversationId) => {
    return await inboxCollection.find({conversationId : conversationId}).toArray();
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


