const express = require("express"),
    app = express(),
    config = require("./config.json"),
    fs = require("fs"),
    path = require("path"),
    https = require('https'),
    session = require('express-session'),
    { Database } = require("quickmongo"),
    db = {
        account: new Database("mongodb://localhost/account"),
        recommend: new Database("mongodb://localhost/recommend"),
        community: new Database("mongodb://localhost/community"),
        serial: new Database("mongodb://localhost/serial"),
    },
    // options = {
    //     ca: fs.readFileSync('./pem/fullchain.pem'),

    //     key: fs.readFileSync('./pem/privkey.pem'),

    //     cert: fs.readFileSync('./pem/cert.pem')
    // },
    modules = {
        sha256: require('./scripts/sha256'),
        aes: require("./scripts/aes"),
        randomcode: require('uuid4'),
        ip: require('request-ip'),
        nodemailer: require('nodemailer'),
        info: {
            smtpServerURL: "smtp.gmail.com",
            authUser: "OOindeul@gmail .com",
            authPass: "cpuproject"
        },
        moment: require('moment-timezone'),
        Discord: require("discord.js")
    }




app.use(session({
    secret: '!@V()I!#KP#VKMLWEBWERJNO',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "client")));
app.set('views', path.join(__dirname, './views'))
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

app.listen(config.port, () => {
    console.log("Web is Ready");
});

// https.createServer(options, app).listen(443);

require("./router/main")(app, config, db);
require("./router/report")(app, config, db);
require("./router/recommend")(app, config, db, modules);
require("./router/account")(app, config, db, modules);
require("./router/register")(app, config, db, modules);
require("./router/discord.js")(config, db, modules);

app.use(function (req, res, next) {
    res.status(404).render("./mobile/www/Error.html");
});