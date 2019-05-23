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

//homework/board
//저장된 전체 게시물 불러오기(salt,boardPw제외)
router.get('/', (req, res)=>{
    pool.getConnection(function(err,connection){

        connection.query('SELECT boardIdx, title, content, writer, writetime FROM board', function (err, rows) {

            if(err){
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));

            }else if(rows.length === 0){
                res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.READ_SUCCESS));

            }else{
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS,rows));
                
            }

            connection.release();

        });

    });

});
//homework/board/:idx
//게시물 고유 boardIdx가 Idx인 게시글 불러오기(salt,boardPw제외)
router.get('/:idx', (req, res)=>{
        pool.getConnection(function(err,connection){

        connection.query(`select boardIdx, title, content, writer, writetime from board where  boardIdx = '${req.params.idx}'`, function (err, rows) {

            if(err){
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.READ_FAIL));

            }else if(rows.length === 0){
                res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.READ_SUCCESS));

            }else{
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS,rows));
                
            }

            connection.release();

        });

    });

});


//homework/board
//게시물 저장
//body : title,content,boardPw,writer(글 작성자idx)
//저장할 정보: boardidx, writer,title,content,writetime,boardPw,salt(게시물시간 서버코드에서 넣기)
router.post('/', async(req, res)=>{


    //저장 시 필수 값인 게시물Id와 제목(title)이 없으면 실패 response 전송
    if (!req.body.title || !req.body.boardPw || !req.body.writer) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {


        //try/catch로 await의 오류 잡음
        try{
                var dt = dateTime.create();
                const salt = await crypto.randomBytes(32);
                const hashedPw = await crypto.pbkdf2(req.body.boardPw.toString(), salt.toString('base64'), 1000, 32, 'SHA512');
                pool.getConnection(function(err,connection){
                connection.query('insert into board (title,content,writer,writetime,boardPw,salt) values (?,?,?,?,?,?)',[req.body.title,req.body.content,req.body.writer,dt.format('Y-m-d H:M:S'),hashedPw.toString('base64'), salt.toString('base64')],function(err,rows,fields){

            if(err){
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SAVE_FAIL));

            }else if(rows.length===0){
                res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.NULL_VALUE));
            }else{
                res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
            }
                 });
                 });

        }catch(err){
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SAVE_FAIL));
        }finally{
            connection.release();
        }

        }

});



//homework/board
//게시물 삭제
//body: boardIdx,boardPw
//게시물 고유 idx와 같은 게시물을 삭제합니다.
router.delete('/', (req, res)=>{

        pool.getConnection(function(err,connection){
            connection.query(`select * from board where  boardIdx = '${req.body.boardIdx}'`, function (err, rows) {

            if(err){
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));
            }else if(rows.length === 0){
                res.status(200).send(util.successFalse(statusCode.NO_CONTENT, resMessage.DELETE_FAIL));
            }else{

                crypto.pbkdf2(req.body.boardPw.toString('base64'),rows[0].salt, 1000, 32, 'SHA512',async(err,hashedPw)=>{
                         if((hashedPw.toString('base64') ==rows[0].boardPw)){

                                connection.query(`delete from board where boardIdx= '${req.body.boardIdx}'`, function (err, rows_) {
                                        if(err){
                                            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));
                                        }else{
                                            //게시물 삭제
                                            res.status(200).send(util.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
                                        }
                                    });

                    }else {
                        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.DELETE_FAIL));
                    }

                });
                

            }

                connection.release();

        });

    });

});

                    

module.exports = router;
