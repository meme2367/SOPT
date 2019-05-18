//module.exports = mysql.createPool(dbConfig);

var express = require('express');
var router = express.Router();
var crypto = require('crypto-promise');

const pool = require('../../config/dbconfig'); 

//connection.query(query);

//homework/signup
//회원가입
//body :id,name,password
//저장할 정보: userIdx,id,name,password,salt
router.post('/signup',  async (req, res)=>{
    const salt = await crypto.randomBytes(32);
     pool.getConnection(function(err,connection){

        var sql = `select * from user where id = '${req.body.id}'`;
        console.log("test\n");
        console.log(connection);
        connection.query(sql, function (err, rows) {

            if(err){
                console.log(err);
                connection.release();

                throw err;

            }else if(rows.length != 0){
                res.json('Error: Username exists!');
            
            }else{
                    //회원가입
                    
                    // create salt

                    connection.query('insert into user (id,name,password,salt) value(?,?,?,?)',[req.body.id,req.body.name,req.body.password, salt.toString('base64')],function(err,rows,fields){
                    if(!err){
                        return res.json('success:join success');
                    }else{
                        res.send('err: '+err);
                    }

                    });
            
            }

            connection.release();//pool 반납

        });


    });

});

//homework/signin
//로그인
//body : id,password
//db에서 해당 id를 가진 row의 Salt값으로 해싱한 뒤, 비밀번호 일치 여부 판단
//응답받는 클라이언트는 존재하지 않는 아이디인지, 틀린 비밀번호인지 알수 없게 처리
router.post('/signin', (req, res)=>{
      

	  pool.getConnection(function(err,connection){

	  	var sql = `select * from user where id = '${req.body.id}'`;

        connection.query(sql, function (err, rows) {

            if(err){

                connection.release();

                throw err;

            }else if(rows === 0){

            	return res.status(401).json({
                	error: "LOGIN FAILED",
                	code: 1
            	});
            }else{


            		var dbsalt  = rows[0].salt;
					var hashedPw = crypto.pbkdf2(req.body.password.toString(), dbsalt, 1000, 32, 'SHA512');

                    if(!err && (hashedPw == rows[0].password)){
                        console.log("test===========\n");
                        console.log(rows)

                        return res.json({
            				success: true
            			});

                    }else{
                        return res.send('wrong password: '+err);
                    }

        
            }

            connection.release();

           
        });

    });

});

module.exports = router;