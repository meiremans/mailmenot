var express = require('express');
const {findOrCreateUserMapping} = require("../services/database");
var router = express.Router();

/* GET users listing. */
router.post('/hook', async (req, res, next) => {
  console.log(req.body);
  await findOrCreateUserMapping(req.body);
  res.send('respond with a resource');
});

module.exports = router;
