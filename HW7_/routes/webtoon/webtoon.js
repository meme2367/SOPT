//module.exports = mysql.createPool(dbConfig);


var express = require('express');
var router = express.Router();
var crypto = require('crypto-promise');
var json2csv = require('async-json2csv');

var fs = require("fs");
var csvtojson = require('csvtojson');
var dateTime = require('node-datetime');


const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const pool = require('../../config/dbconfig');
const upload = require('../../config/multer');
const moment = require('moment');



//웹툰 등록
//webtoon/

router.post('/', upload.single('thumbnail'), async(req, res) => {



    const webtoonthumbnail = req.file.location
    if (webtoonthumbnail == undefined) {
        console.log(req.file)
        res.status(400).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE))
    }
    const webtoontitle = req.body.title
    const webtoonwriter = req.body.writer
    const webtoonid = req.body.webtoon_id
    if (webtoontitle == undefined ||
        webtoonwriter == undefined) {
        console.log(req.body)
        res.status(400).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE))
    }
    const jsonData = {
        webtoon_id:webtoonid,
        title: webtoontitle,
        writer: webtoonwriter,
        thumbnail: webtoonthumbnail,
        date:moment().format("YYYY-MM-DD"),
    }

  try{
        
      const sql = `SELECT webtoon_id FROM webtoon WHERE webtoonwriter = ? and webtoontitle= ?`;
        var connect = await pool.getConnection();
        var row = await connect.query(sql,[webtoonwriter,webtoontitle]);

    } catch (err) {
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EXIST_WEBTOON));

    }finally{
        connect.release();
    }



    pool.getConnection(function(err,connection){
        connection.query('INSERT INTO webtoon(webtoon_id,webtoontitle, webtoonwriter, webtoonthumbnail,webtoondate) VALUES (?,?,?,?,?)',[jsonData.webtoon_id,jsonData.title,jsonData.writer,jsonData.thumbnail,jsonData.date],function(err,rows,fields){
            
            if(err){

                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SAVE_FAIL));

            }else if(rows.length===0){
                res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.NULL_VALUE));
            }else{
                res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS,jsonData));
            }
         });
    });
    

})



router.get('/:sort', async(req, res) => {
    const sort = req.params.sort;

    if(sort == 0) {
        const mainquery = 'SELECT webtoontitle,webtoonwriter,webtoonthumbnail,webtoondate FROM webtoon ORDER BY webtoonlike DESC'; //인기

            pool.getConnection(function(err,connection){
                connection.query(mainquery,function(err,rows){
                    if(err){
                        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));

                    }else if(rows.length === 0){
                        res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.READ_SUCCESS));

                    }else{
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.MAIN_SUCCESS,rows));
                        
                    }

                    connection.release();
                });
            });

    } else if (sort == 1){
        const mainquery = 'SELECT webtoontitle,webtoonwriter,webtoonthumbnail,webtoondate FROM webtoon ORDER BY webtoondate DESC'; //신작

            pool.getConnection(function(err,connection){
                connection.query(mainquery,function(err,rows){
                    if(err){
                        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));

                    }else if(rows.length === 0){
                        res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.READ_SUCCESS));

                    }else{
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.MAIN_SUCCESS,rows));
                        
                    }

                    connection.release();
                });
            });
        
    } else if (sort == 2) {
         const mainquery = 'SELECT webtoontitle,webtoonwriter,webtoonthumbnail,webtoondate FROM webtoon WHERE webtoonfinished = 1'; //완결
    

            pool.getConnection(function(err,connection){
                connection.query(mainquery,function(err,rows){
                    if(err){
                        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));

                    }else if(rows.length === 0){
                        res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.READ_SUCCESS));

                    }else{
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.MAIN_SUCCESS,rows));
                        
                    }

                    connection.release();
                });
            });

    }        
});




module.exports = router;
