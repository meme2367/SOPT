var express = require('express');
var router = express.Router();

//현재 위치 경로: localhost:3000/homework

router.use('/board', require('./board'));

module.exports = router;