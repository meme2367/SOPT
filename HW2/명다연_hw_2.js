const http = require('http');
const crypto = require('crypto');
const querystring = require('querystring');
const url = require('url');
const fs = require('fs');
const json2csv = require('json2csv');
const csvtojson = require('csvtojson');
const request = require('request');

const server = http.createServer((req,res)=>{
//http://localhost:3000/signin?id=meme2367&pw=1234
	const urlParsed = url.parse(req.url);
	const queryParsed = querystring.parse(urlParsed.query);
	if(urlParsed.pathname==='/signin'){
		


		crypto.randomBytes(32,function(err,buffer){
			if(err){
				

	            res.statusCode = 500;
	            res.setHeader('Content-Type', 'text/plain');
	            res.write(JSON.stringify(result));
	            res.end();
			} else{

				crypto.pbkdf2(queryParsed.pw, buffer.toString('base64'), 10000, 64, 'sha512', (err, hashed) => {
					if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.write(JSON.stringify(result));
                    res.end();
                } else {

                	let hashedpw = hashed.toString('base64');
                	let salt = buffer.toString('base64');

                	const resultCsv = json2csv.parse({
                		id:queryParsed.id,
                		pw:hashedpw,
                		salt:salt
                	});

                	fs.writeFile('getData.csv', resultCsv, (err) => {

	                	if (err) {
	                    
	                    	res.writeHead(500, { 'Content-Type': "text/plain" });
	                    	res.write("error");
	                    	res.end();
	                	} else {
		                    res.writeHead(200, { 'Content-Type': "text/plain;charset=UTF-8" });
	        	            res.write("회원가입에 성공했습니다..");
	    	                res.end();
		                }
					})
				}
				});
			}
	});

}else if(urlParsed.pathname==='/signup'){
		//http://localhost:3000/signup?id=meme2367&pw=1234
		csvtojson()
        .fromFile('getData.csv')
        .then((jsonObj)=>{
        	console.log("jsonobj check");
        	console.log(jsonObj);

            crypto.pbkdf2(queryParsed.pw, jsonObj[0].salt, 10000, 64, 'sha512', (err, hashed)=>{
                if(err)
                    res.end(JSON.stringify({msg: err}));
                else{
                    let hashedPw = hashed.toString('base64');
                    if(hashedPw==jsonObj[0].pw){
                        res.writeHead(200, {'Content-Type':'Application/json'})
                        res.end(JSON.stringify({msg: '로그인 성공!'}));
                    }else{
                        res.writeHead(200, {'Content-Type':'Application/json'})
                        res.end(JSON.stringify({msg: '비밀번호가 틀렸습니다.'}));
                    }
                }
            });
});

		
}else if(urlParsed.pathname==='/info'){
//http://localhost:3000/info

    request({
        uri: 'http://15.164.75.18:3000/homework/2nd',
        method: 'POST',
        form: {name: '명다연', phone: '010-9132-2367'}
    },function (err, response, body) {

    	if(err || response.statusCode != 200){
    		response.writeHead(500, { 'Content-Type': "text/plain" });
	        response.write("error");
	        response.end();
    	}else{
    		const resData = JSON.parse(body);
    		console.log(resData.data);

/*
{ name: '명다연',
  phone: '010-9132-2367',
  colleage: '단국대학교',
  major: '소프트웨어학과',
  email: 'meme91322367@gmail.com' }
*/
			crypto.randomBytes(32,function(err,buffer){
				if(err){
					response.end(JSON.stringify({msg: err}));
				}else{

					crypto.pbkdf2(resData.data.phone, buffer.toString('base64'), 10000, 64, 'sha512', (err, hashed) => {
					
						const resultCsv = json2csv.parse({
                			name:resData.data.name,
                			colleage:resData.data.colleage,
                			major:resData.data.major,
                			email:resData.data.email,
                			phone:hashed.toString('base64')
                		});


						fs.writeFile('getinfoData.csv', resultCsv, (err) => {
		                	if (err) {
		                    	res.writeHead(500, { 'Content-Type': "text/plain" });
		                    	res.write("error");
		                    	res.end();
		                	} else {

		                		csvtojson()
		                		.fromFile('getinfoData.csv')
		                		.then((jsonObj)=>{
		                			res.writeHead(200, {'Content-Type':'Application/json'})
		                			res.end(JSON.stringify({msg: '저장 성공!'}));
								});
			                }
						})


					});	
				}
			});
    }});}

}).listen(3000, (req, res) => {
});