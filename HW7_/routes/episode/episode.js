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



//에피소드 목록
router.get('/:webtoonid', async(req, res) => {
   //db에서 선택한 웹툰idx에 맞는 에피소드 가져옴
   const webtoonid = req.params.webtoonid;

   var sql = "SELECT * FROM episode WHERE webtoon_id = ? ORDER BY episodedate DESC";

    try{
        var connection = await pool.getConnection();
        var rows = await connection.query(sql,[webtoonid]);

    } catch (err) {
        console.log(err);
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.GET_EPISODE_FAIL));

    }finally{
        connection.release();
    }

   if(!rows) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.EPISODE_DB_ERROR));
   } else if (rows == 0) {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.EPISODE_EMPTY)); 
   } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.GET_EPISODE_SUCCESS, rows)); 
   }

});


//에피소드회차등록
//episode/:webtoon_id/:ep_id

router.post('/:webtoon_id/:ep_id', upload.fields([{name : 'thumnail'}, {name : 'content'}]), async(req, res) => {


        
     const bodyJson = {
        episodetitle : req.body.title,
        episodethumnail : req.files.thumnail[0].location,
        episodecontentimg : req.files.content[0].location,
        episodedate:moment().format("YYYY-MM-DD"),
     };





        try{




            var sql ='select episodetitle,ep_id,webtoon_id from episode where webtoon_id = ? and ep_id = ? and episodetitle = ?';
            var conn = await pool.getConnection();
                        
            var row = await conn.query(sql,[req.params.webtoon_id,req.params.ep_id,bodyJson.episodetitle]);




          } catch (err) {
                       console.log("err\n");
                        console.log(err);
              res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EPISODE_EXISTS));

          }finally{
              conn.release();
            }


var insertsql ='INSERT INTO episode (episodetitle, ep_id,episodedate, episodethumnail, webtoon_id, episodecontentimg) VALUE (?, ?, ?, ?, ?,?)';

    pool.getConnection(function(err,connection){
        connection.query(insertsql,[req.params.webtoon_id,req.params.ep_id,bodyJson.episodetitle],function(err,rows,fields){
           
          if(err){
              res.status(200).send(utils.successTrue(statusCode.OK, resMessage.EPISODE_SAVE_FAIL)); 
            }else{

                            
                  if(!rows){
                      res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EPISODE_SAVE_FAIL));

                  }else if(rows.length===0){
                              res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.NULL_VALUE));
                  }else {
                  
                    res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.EPISODE_SAVE_SUCCESS));

                  }

            }

          });

       });
       console.log("rowstest\n");
       console.log(rows);



})

//에피소드 회차
//episode/:webtoon_id/:ep_id
router.get('/:webtoon_id/:ep_id', async(req, res) => {
   //db에서 선택한 웹툰idx에 맞는 에피소드 가져옴
   const webtoon_id = req.params.webtoon_id;
   const ep_id = req.params.ep_id;

   var sql = "SELECT * FROM episode WHERE webtoon_id = ? and ep_id = ? ORDER BY episodedate DESC";

    try{
        var connection = await pool.getConnection();
        var rows = await connection.query(sql,[webtoon_id,ep_id]);

    } catch (err) {
        console.log(err);
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.GET_EPISODE_FAIL));

    }finally{
        connection.release();
    }

   if(!rows) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.EPISODE_DB_ERROR));
   } else if (rows == 0) {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.EPISODE_EMPTY)); 
   } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.GET_EPISODE_SUCCESS, rows)); 
   }

});




module.exports = router;
