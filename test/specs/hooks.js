const {
    serial: test
} = require('ava');
const {
    runBefore,
    g
} = require('../helper');

test.before(async () => {
    await runBefore();
    console.log("run before finished")
});


test('[Success] Call get on hook endpoint', async t => {
    console.log("start test")
    const res = await g.request
        .get('/telegram/hook')
        .expect(200);

    console.log(res.body.message)
});

test('[Success] Connect new user', async t => {
    const res = await g.request
        .post('/telegram/hook')
        .send({
            chat: {
                id: 100000000,
                first_name: 'Test',
                last_name: 'ER',
                username: 'test_er',
                type: 'private'
            },
            date: 1635410595,
            text: '/start'
        })
        .expect(200);

});