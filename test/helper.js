const app = require('../bin/www');
const supertest = require('supertest');

exports.g = {db : {}};
const setup = (db) => {
    return Promise.all([
        db.users.deleteMany({}, {}),
        db.inboxes.deleteMany({}, {}),
    ])
};


exports.runBefore = async () => {
    // Create a session
    this.g.request = supertest.agent(app);
    await new Promise(resolve => {
        app.on('appStarted', async () => {
            console.log("app started event");
            // Set some stuff now we have the app started
            console.log("setup finished");
            resolve();
        });
    });
};