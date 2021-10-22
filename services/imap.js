const Imap = require('imap');
const {sendMessage} = require("./telegram");
const {getChatIdByMailPrefix} = require("./database");
const {simpleParser} = require('mailparser');


const imapConfig = {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT),
    tls: process.env.IMAP_TLS.toLowerCase() === 'true',
};
const imap = new Imap(imapConfig);
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

const listenForMails = () => {
    imap.openBox('INBOX', false, () => {
        imap.on("mail", mail => {
            console.log("new mail");
            imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
                const f = imap.fetch(results, {bodies: ''});
                f.on('message', msg => {
                    msg.on('body', stream => {
                        simpleParser(stream, async (err, parsed) => {
                            // const {from, subject, textAsHtml, text} = parsed;

                            /* Make API call to save the data
                               Save the retrieved data into a database.
                               E.t.c
                            */
                            console.log(parsed.to);
                            let user = parsed.to.value[0].address.substr(0, parsed.to.value[0].address.indexOf('_'));
                            if(!user) user = parsed.to.value[0].address.substr(0, parsed.to.value[0].address.indexOf('@'));
                            const userMapping  =  await getChatIdByMailPrefix(user);
                            if(userMapping){
                                await sendMessage(parsed.text,userMapping.conversationId);
                            }
                        });
                    });
                    msg.once('attributes', attrs => {
                        const {uid} = attrs;
                        imap.addFlags(uid, ['Deleted', 'Seen'], () => {
                            // Deleted the email as read after reading it
                            console.log('Marked as Deleted!');
                        });
                    });
                });
            })
        });
    });
};