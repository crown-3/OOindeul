module.exports = (app, config, db, modules) => {
    app.get("/signup", async (req, res) => {
        res.render("./mobile/account/signup.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });

    app.get("/verify/:type/:code", async (req, res) => {
        let types = ["mail", "otp"];
        if (!types.includes(req.params.type)) return res.status(404).render("./mobile/www/Error.html");
        let user = await db.account.raw()
        user = user.find(i => i.data.uuid == req.params.code);
        if (!user || user.data.verify) return res.status(404).render("./mobile/www/Error.html");
        await db.serial.set(`${req.params.code}.checked`, true);
        await db.account.set(`${user.ID}.verify`, true);

        try {
            let transporter = nodemailer.createTransport({
                host: "localhost",
                port: 25,
                secure: false,
                tls: {
                    rejectUnauthorized: false
                }
            });

            let mailOptions = {
                from: 'OOindeul@OO.xyz',
                to: user.data.email,
                subject: 'OO인들 메일인증 [버그로 인한 재인증 요청]',
                html: `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                    <style>
                
                        *{
                            --bg-primaryvar:#F6C700;
                            --bg-secondary:#000;
                            --bg-A:#b49300;
                            --bg-default:#fff;
                            --bg-input:#262626;
                            --bg-input2:#3B3B3B;
                            --bg-inputpr:#707070;
                            --bg-light1:#A2A2A2;
                            --bg-light2:#E3E3E3;
                            box-sizing: border-box;
                        }
                
                        .title{
                            text-align: center;
                            font-weight: bold; font-size:25px;
                            margin-top: 25px;
                        }
                
                        .des{
                            text-align: center;
                            font-size: 14px;
                        }
                
                        .textline{
                            text-align: center;
                            font-size: 10px;
                        }
                
                        .recoverytext{
                            text-align: center;
                            font-weight: bold;
                            font-size: 13px;
                            color: var(--bg-secondary);
                            margin-top: 15px;
                        }
                
                        .recoverykey{
                            font-size: 11px;
                            text-align: center;
                            font-weight: bold;
                            margin-top:5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="title">OO인들</div>
                    <div class="des">이 메일에 답장하지 말아 주십시오.</div>
                    <div class="maincontent">
                        
                        <div class="textline">
                            ________________________________________________
                        </div>
                        
                        <div class="recoverytext">복구 키</div>
                        <div class="recoverykey">
                            ${user.data.recovery.split("-")[4]}
                        </div>
                    </div>
                </body>
                </html>`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('error: ' + error);
                }
                else {
                    console.log('Email sent: ' + info.response);
                }
                transporter.close()
            });
        } catch (error) {
            res.status(200).end(error);
            console.log(error);
            return
        }

        res.render("./mobile/account/TFSU", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null,
            key: user.data.recovery.split("-")[4]
        });
    });

    app.post("/signup", async (req, res) => {
        try {
            let random = modules.randomcode();
            let ran = modules.randomcode();
            let getip = await modules.ip.getClientIp(req);
            if (!req.body || !req.body.name || !req.body.number || !req.body.id || !req.body.pw || !req.body.email || !req.body.serial) return res.status(200).end("Body is not valid");
            if (await db.account.get(req.body.id) || await db.account.get(req.body.email)) return res.status(200).end("exist");
            await db.account.set(req.body.id, { name: req.body.name, number: req.body.number, pw: modules.sha256(req.body.pw), email: req.body.email, serial: req.body.serial, verify: false, ips: [getip], uuid: random, recovery: ran });
            await db.serial.set(`${req.body.serial}.requested`, true);
            
            try {
                let transporter = nodemailer.createTransport({
                    host: "localhost",
                    port: 25,
                    secure: false,
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                let mailOptions = {
                    from: 'OOindeul@gmail.com',
                    to: req.body.email,
                    subject: 'OO인들 메일인증',
                    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <html xmlns="http://www.w3.org/1999/xhtml">
                    <head>
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <title>HTML Email Template</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style type="text/css">
                        * {
                            color: #fff;
                        }
                
                        button {
                            font-size: 15px;
                            height: 30px;
                            width: 170px;
                            display: block;
                            margin: 0 auto;
                            font-family: 나눔스퀘어;
                            border-radius: 50px;
                            background-color: #F6C700;
                            border: solid 1px #F6C700;
                            font-weight: bold;
                            transition: .2s;
                        }
                
                        .recoverytext {
                            text-align: center;
                            font-weight: bold;
                            font-size: 13px;
                            color: #fff;
                        }
                
                        .recoverykey {
                            width: 190px;
                            height: 25px;
                            background: #E3E3E3;
                            border-top: none;
                            border-left: none;
                            border-right: none;
                            border-bottom: 1px solid #707070;
                            border-radius: 0;
                            margin: 5px auto;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                        }
                
                        .recoverykey-wrap {
                            font-size: 11px;
                            font-family: consolas;
                            color: #262626;
                            text-align: center;
                        }
                    </style>
                    </head>
                    <body style="background-color: black; text-align: center">
                        <h1><a href="http://OOindeul/">OO인들</a></h1>
                        <br><br>
                    <div class="recoverytext">요청자 아이피</div>
                    <div class="recoverykey">
                        <div class="recoverykey-wrap" style="background-color: whitesmoke; width: 100%; color: black; text-align: center">
                            ${getip}
                        </div>
                    </div>
                    <br><br>
                    <a href="http://OOindeul/verify/mail/${random}"><button>인증하기</button></a>
                    </body>
                    </html>`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log('error: ' + error);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                    }
                    transporter.close()
                });
            } catch (error) {
                console.log(error);
                res.status(200).end(error);
                return
            }
            res.status(200).end("yes")
        } catch (e) {
            console.log(e);
            res.status(200).end(e);
        }
    });

    app.post("/serial_check", async (req, res) => {
        if (!req.body || !req.body.serial || !req.body.number) return res.status(200).end("Body is not valid");
        let serial = await db.serial.get(req.body.serial);
        if (!serial || serial.number != req.body.number) {
            res.status(200).end("Serial is not defined");
        } else if (serial.checked) {
            res.status(200).end("exist");
        } else if (serial.requested) {
            res.status(200).end("check");
        } else {
            res.status(200).end("yes");
        }
    });
}