var express = require('express');
var router = express.Router();

//현재 위치 경로: localhost:3000/
router.use('/homework', require('./homework/index'))


module.exports = router;
