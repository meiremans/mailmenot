const Imap = require('imap');
const {getInboxMappingByEmailAddress} = require("./database");
const {sendMessage} = require("./telegram");
const {getChatIdByMailPrefix} = require("./database");
const {simpleParser} = require('mailparser');
const util = require('util');
const imapConfig = {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT),
    tls: process.env.IMAP_TLS.toLowerCase() === 'true',
};
const imap = new Imap(imapConfig);
imap.openBoxPromise = util.promisify(imap.openBox);
imap.searchPromise = util.promisify(imap.search);
const simpleParserPromise = util.promisify(simpleParser);


imap.connect();

imap.once('ready', function () {
    console.log("Imap ready");
    listenForMails();
});
imap.once('error', err => {
    console.log(err);
});
imap.once('end', () => {
    console.log('Connection ended');
});

//TODO: rewrite with promises.
const listenForMails = async () => {
    await imap.openBoxPromise('INBOX', false);
    imap.on("mail", async mail => {
        console.log("new mail");
        const results = await imap.searchPromise(['UNSEEN', ['SINCE', new Date()]]);
        const f = imap.fetch(results, {bodies: ''});
        f.on('message', msg => {
            msg.on('body', async stream => {
                const parsed = await simpleParserPromise(stream);
                console.log(parsed.to);
                let user = parsed.to.value[0].address.substr(0, parsed.to.value[0].address.indexOf('_'));
                if (!user) user = parsed.to.value[0].address.substr(0, parsed.to.value[0].address.indexOf('@'));
                const userMapping = await getChatIdByMailPrefix(user);
                const inboxMapping = await getInboxMappingByEmailAddress(parsed.to.value[0].address);
                if (!inboxMapping || !inboxMapping.isBlocked) {
                    if (userMapping) {
                        const text = `
                               From: ${parsed.from.text}
                               To : ${inboxMapping ? inboxMapping.inboxName : ""} ${parsed.to.text} 
                               Subject: ${parsed.subject}
                               Content : ${parsed.text}
                               `
                        await sendMessage(text, userMapping.conversationId);
                    }
                }
            });
            msg.once('attributes', deleteMessage);
        });

    })
}

const deleteMessage = (attrs) => {
    const {uid} = attrs;
    //Also marked as seen, as deleted flag doesn't work instant appearantly
    imap.addFlags(uid, ['Deleted', 'Seen'], () => {
        // Deleted the email as read after reading it
        console.log('Marked as Deleted!');
    });
}
