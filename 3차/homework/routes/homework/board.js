//node_modules폴더는 용량이 커서 삭제했습니다.
//package.json에 다 저장해놨으니 npm i 해주세요.

var express = require('express');
var router = express.Router();
var crypto = require('crypto-promise');
var json2csv = require('async-json2csv');

var fs = require("fs");
var csvtojson = require('csvtojson');
var dateTime = require('node-datetime');


var util = require('../../module/utils/utils');
var statusCode = require('../../module/utils/statusCode');
var resMessage = require('../../module/utils/responseMessage');

//localhost:3000/homework/board/:id (GET Method)
//게시물 고유 Id가 Id인 게시글 불러오기
///csvtojson모듈사용
//promise나 async / async나 await

router.get('/:id', (req, res)=>{
    csvtojson().fromFile('board.csv').then((jsonObj)=>{
        return new Promise((resolve,reject)=>{
            if (jsonObj != null)
                resolve(jsonObj);
            else
                reject(resMessage.READ_FAIL);

        }).then((boardData) => {
            //게시물 JSON배열에서 입력받은 ID와 같은 ID가 있는지 확인
            for (var i = 0; i < boardData.length; i++) {
                
                if (boardData[i].id == req.params.id)
                    break;

            }
    
            if (i < boardData.length) {
                delete boardData[i].pw;
                delete boardData[i].salt;
                
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.READ_SUCCESS, boardData[i]));
            } else {
                res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            }
        },(message) =>{
            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
        });
    });
});

//localhost:3000/homework/board/ (POST Method)
//게시물 저장
//저장할 정보 :게시물 고유 id, 게시물 제목title, 게시물 내용contents, 게시물 작성 시간time, 게시물 비밀번호pw, 솔트 값salt
// 저장 시 같은 제목의 글이 있을 경우 실패 메시지를 반환.
//

/*
id,title,contents,time,pw,salt
32157184,boare_title,게시물내용,2019-05-09 23:45:52,cnBQoWF3DOz0ciTiCS0bUnpurGck/AAqC2oux57rN5g=,62eYdy8zi56nSrMFhrdnc8kheLLMZolaZ9AaBY8jiyA=
*/
router.post('/', async(req, res) => {
    //body = id, title, contents,res_time, pw, salt
    //저장 시 필수 값인 게시물Id와 제목(title)이 없으면 실패 response 전송
    if (!req.body.id || !req.body.title) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {


        var dt = dateTime.create();      

        const boardData = {
            id: req.body.id,
            title: req.body.title,
            contents: req.body.contents,
            pw: req.body.pw,
            time:dt.format('Y-m-d H:M:S')
        }

        //try/catch로 await의 오류 잡음
        try {
            const salt = await crypto.randomBytes(32);
            boardData.salt = salt.toString('base64');

            //pw
            const hashedPw = await crypto.pbkdf2(boardData.pw.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

            boardData.pw = hashedPw.toString('base64');
            const options = {
                data: [boardData],
                fields: ['id', 'title', 'contents', 'time', 'pw', 'salt'],
                header: true
            }

            
            const stuInfoCsv = await json2csv(options);
            fs.writeFileSync('board.csv', stuInfoCsv);

            //파일 저장까지 완료되면 성공 response를 날립니다.
            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        } catch (err) {
            //에러 발생 시 실패 response를 날립니다.
            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
        }
    }
});



//게시물 수정
//게시물 고유 Id32157184와 같은 게시물을 수정된 값으로 다시 저장합니다.(게시물 작성 시간까지 같이 수정해주세요)
router.put('/', (req, res)=>{
    csvtojson().fromFile('board.csv').then((jsonObj)=>{
        return new Promise((resolve,reject)=>{
            if (jsonObj != null)
                resolve(jsonObj);
            else
                reject(resMessage.READ_FAIL);
        }).then(async (boardData) => {


            //게시물 JSON배열에서 입력받은 ID와 같은 ID가 있는지 확인
            for (var i = 0; i < boardData.length; i++) {
                
                if (boardData[i].id == req.body.id)
                {
                    var dt = dateTime.create();
                    //board.csv에 저장한 솔트값으로 hashpw
                    const hashedPw = await crypto.pbkdf2(req.body.pw.toString(), boardData[i].salt, 1000, 32, 'SHA512');
                    
                    if(boardData[i].pw == hashedPw.toString('base64')){
                    

                        boardData[i].title = req.body.title;
                        boardData[i].contents = req.body.contents;
                        boardData[i].time = dt.format('Y-m-d H:M:S');


                        const options = {
                        data: boardData,
                        fields: ['id', 'title', 'contents', 'time', 'pw', 'salt'],
                        header: true
                        }

                    
                        const stuInfoCsv = await json2csv(options);
                        fs.writeFileSync('board.csv', stuInfoCsv);

                        //파일 저장까지 완료되면 성공 response를 날립니다.
                        res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));


                    }else{
                        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MISS_MATCH_PW));
                    }
                }
                    

            }

        },(message) =>{
            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
            
        });
    });
});
/*

*/



//게시물 삭제
//게시물 고유 Id와 같은 게시물을 삭제합니다.
router.delete('/', (req, res) => {
    csvtojson().fromFile('board.csv').then((jsonObj)=>{
        return new Promise((resolve,reject)=>{
            if (jsonObj != null)
                resolve(jsonObj);
            else
                reject(resMessage.READ_FAIL);
        }).then(async (boardData) => {
            //게시물 JSON배열에서 입력받은 ID와 같은 ID가 있는지 확인
            for (var i = 0; i < boardData.length; i++) {
                
                if (boardData[i].id == req.body.id)
                {
                    const hashedPw = await crypto.pbkdf2(req.body.pw.toString(), boardData[i].salt, 1000, 32, 'SHA512');
                    
                    if(boardData[i].pw == hashedPw.toString('base64')){
                        //pw같을 때 삭제
                        //splice(start_index,delete_count)
                        boardData.splice(i, 1);
                        console.log(boardData);

                        const options = {
                        data: boardData,
                        fields: ['id', 'title', 'contents', 'time', 'pw', 'salt'],
                        header: true
                        }

                    
                        const stuInfoCsv = await json2csv(options);
                        fs.writeFileSync('board.csv', stuInfoCsv);

                        //파일 저장까지 완료되면 성공 response를 날립니다.
                        res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));


                    }else{
                        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MISS_MATCH_PW));
                    }
                }



            }

        },(message) =>{
            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
            
        });
});
});


module.exports = router;