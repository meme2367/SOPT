var express = require('express');
var router = express.Router();



const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');


/*
    METHOD  : GET
    url     : /banner
    메인 배너 가져오기
*/
router.get('/', async(req, res) => {
    let imgJson = [{
        "imgTitle": "banner_1",
        "imgUrl": "https://novel-phinf.pstatic.net/20190601_143/novel_15593458533906D5v8_JPEG/3R_pc_home_697x320.jpg?type=q90"
    },
    {
        "imgTitle": "banner_2",
        "imgUrl": "https://novel-phinf.pstatic.net/20181003_84/novel_1538495295548nfuo3_JPEG/EC9BB9EC868CEC84A4_PC_697X320.jpg?type=q90"
    },
    {
        "imgTitle": "banner_3",
        "imgUrl": "https://novel-phinf.pstatic.net/20190617_238/novel_1560735440912KnHia_JPEG/EC9BB9EC868CEC84A4_PC_697X320.jpg?type=q90"
    }]
    
    res.status(200).send(util.successTrue(statusCode.OK, resMessage.BANNER_SUCCESS, imgJson));

});
module.exports = router;
