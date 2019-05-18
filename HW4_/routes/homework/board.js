//module.exports = mysql.createPool(dbConfig);


var express = require('express');
var router = express.Router();
var crypto = require('crypto-promise');
var json2csv = require('async-json2csv');

var fs = require("fs");
var csvtojson = require('csvtojson');
var dateTime = require('node-datetime');


const pool = require('../../config/dbconfig'); 

//homework/board
//저장된 전체 게시물 불러오기
router.get('/', (req, res)=>{
    pool.getConnection(function(err,connection){
        console.log("connection test\n");
        console.log(connection);
        connection.query('select * from board', function (err, rows) {

            if(err){

                connection.release();

                throw err;

            }else{
            	res.json(rows);
            }

            connection.release();

        });

    });

});

//homework/board/:idx
//게시물 고유 boardIdx가 Idx인 게시글 불러오기
router.get('/:idx', (req, res)=>{
	pool.getConnection(function(err,connection){

        connection.query(`select * from board where  boardIdx = '${req.params.idx}'`, function (err, rows) {

            if(err){

                connection.release();

                throw err;

            }else if(rows.length === 0){
            	res.json('Error: 일치하는 게시물이 없습니다.');
            
            }else{
            	res.json(rows);
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
    if (!req.body.title) {
        res.status(200).send('게시물 Id나 title이 정확하지 않습니다.');
    } else {


    	
    	//try/catch로 await의 오류 잡음
    	try{
    		var dt = dateTime.create();
    		const salt = await crypto.randomBytes(32);
            
    		pool.getConnection(function(err,connection){
                console.log("test\n");
                console.log(connection);
            		connection.query('insert into board (title,content,writer,writetime,boardPw,salt) values (?,?,?,?,?,?)',[req.body.title,req.body.content,req.body.writer,dt.format('Y-m-d H:M:S'),req.body.boardPw,salt.toString('base64')],function(err,rows,fields){

            if(err){

                connection.release();

                throw err;

            }else{
            	res.json(rows);
            }

            connection.release();

       		 });

   		 });

    	}catch(err){
    		atus(200).send('게시물 저장에 실패했습니다.');
    	}
	}

});

//homework/board
//게시물 삭제
//body: boardIdx, 추가로 password도 넣음
//게시물 고유 idx와 같은 게시물을 삭제합니다.
router.delete('/', (req, res)=>{

	pool.getConnection(function(err,connection){

		 
        connection.query(`select * from board where  boardIdx = '${req.body.boardIdx}'`, function (err, rows) {

            if(err){

                connection.release();

                throw err;

            }else if(rows.length === 0){
				connection.release();            	
            	return res.json('Error: 일치하는 게시물이 없습니다.');
            
            }else{
            	console.log("test\n");
            	console.log(rows);
           		const hashedPw = crypto.pbkdf2(req.body.boardPw.toString(), rows[0].salt, 1000, 32, 'SHA512');
                const hashedPw_db =   crypto.pbkdf2(rows[0].boardPw.toString(), rows[0].salt, 1000, 32, 'SHA512');

                 if(hashedPw_db.toString('base64') == hashedPw.toString('base64')){
                 	connection.query(`delete from board where boardIdx= '${req.body.boardIdx}'`, function (err, rows) {
                 		 if(err){
                 		 	console.log("Err\n");
                 		 	console.log(err);
                				connection.release();
				                throw err;
			            }

			            res.send('게시물을 삭제했습니다.');
                 });


            	}
        	}

			connection.release();            

        });

    });

});


module.exports = router;