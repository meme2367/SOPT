var express = require('express');
var router = express.Router();

//현재 위치 경로: localhost:3000/
router.use('/user', require('./user/index'))
router.use('/webtoon', require('./webtoon/index'))
router.use('/episode', require('./episode/index'))
router.use('/banner', require('./banner/index'))
router.use('/comments', require('./comments/index'))


module.exports = router;
