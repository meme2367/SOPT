//module.exports = mysql.createPool(dbConfig);

var express = require('express');
var router = express.Router();
var crypto = require('crypto-promise');

const pool = require('../../config/dbconfig'); 

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');
//connection.query(query);

//homework/signup
//회원가입
//body :id,name,password
//저장할 정보: userIdx,id,name,password,salt
router.post('/signup',  async (req, res)=>{
   
    var sql = `select * from user where id = '${req.body.id}'`;
     try{
        var connection = await pool.getConnection();
        var rows = await connection.query(sql);

    } catch (err) {
        console.log(err);
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.JOIN_FAIL));

    }finally{
        connection.release();
    }

            if(!rows){
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SIGNUP_FAIL));

            }else if(rows.length != 0){
                //가입한 회원 존재
                res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.EXIST_ID));

            }else{
                    //회원가입
                    const salt = await crypto.randomBytes(32);
                    const hashedPw =  await crypto.pbkdf2(req.body.password.toString(), salt.toString('base64'), 1000, 32, 'SHA512');
                    connection.query('insert into user (id,name,password,salt) value(?,?,?,?)',[req.body.id,req.body.name,hashedPw.toString('base64'), salt.toString('base64')],function(err,rows,fields){
                        if(!err){
                            console.log(hashedPw.toString('base64'), salt.toString('base64'));
                            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SIGNUP_SUCCESS));
                        }else{
                        
                            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.SIGNUP_FAIL));
                        }
                    });
            }
       
    
});


//homework/signin
//로그인
//body : id,password
//db에서 해당 id를 가진 row의 Salt값으로 해싱한 뒤, 비밀번호 일치 여부 판단
//응답받는 클라이언트는 존재하지 않는 아이디인지, 틀린 비밀번호인지 알수 없게 처리

router.post('/signin',(req, res)=>{


          pool.getConnection(function(err,connection){

                var sql = `select * from user where id = '${req.body.id}'`;

        connection.query(sql, function (err, rows) {

            if(err){
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LOGIN_FAIL));
            }else if(rows === 0){
                 res.status(200).send(util.successFalse(statusCode.NOT_FOUND, resMessage.LOGIN_FAIL));
            }else{


                        var dbsalt  = rows[0].salt;

                        crypto.pbkdf2(req.body.password.toString('base64'),dbsalt, 1000, 32, 'SHA512',async(err,hashedPw)=>{

                         if(!err && (hashedPw.toString('base64') ==rows[0].password)){
                                res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS));

                    }else{
                        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.LOGIN_FAIL));
                    }

                });

            }

            connection.release();


        });

    });

});

module.exports = router;

