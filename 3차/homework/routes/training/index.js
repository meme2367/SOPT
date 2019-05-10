var express = require('express');
var router = express.Router();

//현재 위치 경로: localhost:3000/training

router.use('/info', require('./info'));

module.exports = router;