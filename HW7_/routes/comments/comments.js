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



//에피소드 회차별 댓글 목록
router.get('/:webtoon_id/:ep_id', async(req, res) => {
   //db에서 선택한 웹툰idx에 맞는 에피소드 가져옴
   const webtoon_id = req.params.webtoon_id;
   const ep_id = req.params.ep_id;
   var sql = "SELECT * FROM comments WHERE webtoon_id = ? and ep_id = ?";
   let commentlist = {};
   //var sql =  `select * from user where id = '${req.body.id}'`;
  
    try{
        var connection = await pool.getConnection();
        var rows = await connection.query(sql,[webtoon_id,ep_id]);

    } catch (err) {
        console.log(err);
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.GET_COMMNETS_FAIL));

    }finally{
        connection.release();
    }

   if(!rows) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.COMMENTS_DB_ERROR));
   } else if (rows == 0) {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.COMMENTS_EMPTY)); 
   } else {

              
              for(var i = 0;i<rows.length;i++){
                console.log("\nRows[0]\n");
                console.log(rows);
                try{
                  var row = await connection.query('select id from user where id = (?)',[rows[i]['user_id']]);  
                }catch(err){
                  console.log(err);
                  res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.GET_COMMENTS_FAIL));
                }finally{
                  console.log("commentlist\n");

                  commentlist = rows;
                  console.log("commentlisttest");

                  console.log(commentlist);
                }
              }


              if(!commentlist){
                    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.GET_COMMENTS_FAIL));
                }else{
                  res.status(200).send(util.successTrue(statusCode.OK, resMessage.GET_COMMENTS_SUCCESS,rows));
                }
    }

});


//댓글 삭제
router.delete('/', async(req, res)=>{



           try{
        
      const sql = `SELECT id FROM user WHERE id = ?`;
        var con = await pool.getConnection();
        var rowss = await con.query(sql,req.body.user_id);

    } catch (err) {

        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));

    }finally{
      con.release();
    }

    if(!rowss){
      res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));

    }else if(rowss == 0){
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMMENTS_NOT_EXISTS));

    }


        try{

            var connection = await pool.getConnection();

            //var sql =  `select * from user where id = '${req.body.id}'`;
            //var rows = await connection.query(`select * from comments where  user_id = '${req.body.user_id} and ep_id = '${req.body.ep_id} and webtoon_id = '${req.body.webtoon_id} and comment_id = '${req.body.comment_id} `);

            var rows = await connection.query(`select * from comments where comment_id = ? and user_id = ?`,[req.body.comment_id,req.body.user_id]);

            


          } catch (err) {
                                    
                                    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMMENTS_NOT_EXISTS));

          }finally{
            connection.release();
          }                                

    
            if(!rows){ 

              res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));
              
            }else if(rows == 0){
              res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMMENTS_NOT_EXISTS));
            }
            else{
              pool.getConnection(function(err,conn){
            
              conn.query(`delete from comments where comment_id = ?`, [req.body.comment_id],function (err, rows_) {
                if(err){
                  res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));
                  }else{
                    res.status(200).send(util.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
                  }
              });
          });
            }
      
    });




                  



//댓글 등록
//episode/upload


//댓글 쓰기

router.post('/', upload.single("commentimg"), async (req, res) => {

        let commentDataJson = {
        commentimg: req.file.location,
        user_id: req.body.user_id,
        commentcontent: req.body.commentcontent,
        commentdate: moment().format("YYYY-MM-DD"),
        ep_id: req.body.ep_id,
        webtoon_id:req.body.webtoon_id
        }

       //var sql =  `select * from user where id = '${req.body.id}'`;
  


         if (commentDataJson.commentimg == undefined || commentDataJson.user_id == undefined || 
          commentDataJson.commentcontent == undefined || commentDataJson.ep_id == undefined || commentDataJson.webtoon_id == undefined) {
        console.log(req.file)
        res.status(400).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE))
        }

    try{
        
      const sql = `SELECT id FROM user WHERE id = ?`;
        var conn = await pool.getConnection();
        var rows = await conn.query(sql,commentDataJson.user_id);

    } catch (err) {

        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.POST_COMMNETS_FAIL));

    }finally{
      conn.release();
    }


try{
        
      const sql = `SELECT * FROM comments WHERE webtoon_id = ? and ep_id = ? and user_id = ? and commentcontents = ?`;
        var con = await pool.getConnection();
        var rowss = await con.query(sql,[commentDataJson.webtoon_id,commentDataJson.ep_id,commentDataJson.user_id,commentDataJson.commentcontent]);

    } catch (err) {
        
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.POST_COMMENTS_FAIL));

    }finally{
      con.release();
    }


    if (!rowss ) {
                
              res.status(400).send(util.successFalse(statusCode.OK, resMessage.POST_COMMENTS_FAIL));

    } else if(rowss == 0){


       try{
                  var connection = await pool.getConnection();
                  var result = await connection.query('insert into comments (webtoon_id,ep_id,user_id,commentimg,commentcontents,commentdate)values (?,?,?,?,?,?)',[commentDataJson.webtoon_id,commentDataJson.ep_id,commentDataJson.user_id,commentDataJson.commentimg,commentDataJson.commentcontent,commentDataJson.commentdate]);  
                }catch(err){
                  console.log("err\n");
                  console.log(err);
                  res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.POST_COMMENTS_FAIL));
                }finally{
                  connection.release();
                }

                if(!result){
                    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.POST_COMMENTS_FAIL));
                }else{
                  res.status(200).send(util.successTrue(statusCode.OK, resMessage.POST_COMMENTS_SUCCESS,commentDataJson));
                }
  
    } else{

              
               
               res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMMENTS_EXISTS));
    }


})

module.exports = router;

              