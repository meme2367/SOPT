var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
var json2csv = require('async-json2csv');
var csv = require("csvtojson");
const fs = require("fs");

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

//현재 위치 경로: localhost:3000/training/info

//localhost:3000/training/info/:id (GET Method)
//id 라는 파라미터는 학생의 학번을 뜻합니다
router.get('/:id', (req, res) => {
    const readCsv = (fileName) => { //promise 객체를 반환하는 함수를 만들어줍니다.
        return new Promise((resolve, reject) => {
            /* 
            사실상 csvtojson 모듈 자체에서 promise를 사용하고 있습니다.
            .then 이라는 메소드를 보면 아시겠죠? 
            원래 해당 모듈을 사용할 때 promise처럼 사용해야 하지만 여러분들이 promise를 어떻게 사용하는지
            이해를 돕기 위해 밑의 방법으로 코딩한 것 이오니 나중에 promise가 이해가 가시면 csv를 promise 객체 안에서 사용하지 마시고
            따로 사용해보세요!!!!
            */
            csv().fromFile(fileName).then((jsonObj) => {
                //jsonObj는 읽어들인 파일의 객체를 담은 변수입니다.
                //파일에 아무것도 들어있지 않을 때에도 실패라고 가정합니다!
                if (jsonObj != null) {
                    //만약 읽어들인 객체가 null 값이 아닐 때 == 객체를 잘 읽었다 == 성공
                    //promise에서 작업 성공 시 resolve 메소드에 담아서 보냅니다.
                    //메소드 안에 들어가는 값은 전달되는 값이라고 생각하시면 됩니다.
                    resolve(jsonObj);
                } else {
                    //promise에서 작업 실패 시 reject 메소드에 담아서 보냅니다.
                    reject(resMessage.READ_FAIL);
                }
            })
        })
    }

    readCsv('studentInfo.csv')
        .then((studentData) => {
            //해당 promise가 성공했으면 then 메소드의 첫번째 매개변수인 함수가 실행됩니다.
            //학생 정보가 담긴 JSON 배열에서 입력받은 학번과 같은 학생이 있는지 확인
            for (var i = 0; i < studentData.length; i++) {
                if (studentData[i].id == req.params.id) {
                    break;
                }
            }

            if (i < studentData.length) {
                //만약 있는 경우 나이와 솔트값은 JSON 객체에서 삭제하고 response 전송
                delete studentData[i].age;
                delete studentData[i].salt;
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.STUDENT_SELECT_SUCCESS, studentData[i]));
            } else {
                //없을경우 실패 response 메세지 전송
                res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_STUDENT));
            }
        }, (message) => {
            //해당 promise가 실패했으면 then 메소드의 두번째 매개변수인 함수가 실행됩니다.
            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
        });
});

//localhost:3000/training/info (POST Method)
router.post('/', async(req, res) => {
    //body = { "id": 20160946, "name":"김현진", "univ": "동덕여대", "major": "컴퓨터학과", "age": 23}
/*
    {
    "id":"32157184",
    "title":"boare_title1",
    "contents":"게시물내용",
    "pw":"1234"
}
*/
    //저장 시 필수 값인 학번(id)과 이름(name)이 없으면 실패 response 전송
    if (!req.body.id || !req.body.name) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const stuInfo = {
            id: req.body.id,
            name: req.body.name,
            univ: req.body.univ,
            major: req.body.major,
            age: req.body.age
        }

        //try/catch로 await의 오류 잡음
        try {
            //나이 값을 해싱하기 위한 랜덤 바이트 생성
            const salt = await crypto.randomBytes(32);
            //나이 값 해싱
            //해당 모듈에서는 해싱하는 값이 string type이여야 하기 때문에 정수로 들어온 나이를 문자로 바꿔줍니다.
            const hashedAge = await crypto.pbkdf2(stuInfo.age.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

            stuInfo.salt = salt.toString('base64');
            stuInfo.age = hashedAge.toString('base64');

            const options = {
                data: [stuInfo],
                fields: ['id', 'name', 'univ', 'major', 'age', 'salt'],
                header: true
            }

            //async-json2csv 모듈을 사용한 것 입니다.
            //위의 options를 똑같이 지켜줘야 여러분이 아는 csv 파일 형태로 저장되오니 꼭 지켜주세요.
            const stuInfoCsv = await json2csv(options);
            fs.writeFileSync('studentInfo.csv', stuInfoCsv);

            //파일 저장까지 완료되면 성공 response를 날립니다.
            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        } catch (err) {
            //에러 발생 시 실패 response를 날립니다.
            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
        }
    }
});

module.exports = router;