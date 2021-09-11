const fetch = require("node-fetch");

module.exports = function (app, config, db) {
    app.get("/", async (req, res) => {
        res.status(200).render("./mobile/www/index.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });

    app.get("/callback", async (req, res) => {
        let code = req.query.code;
        console.log(config.clientId)
        let data = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: "http://localhost:3000/callback",
                scope: "identify"
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        data = await data.json();
        if (data.access_token) {
            let userResult = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    authorization: `${data.token_type} ${data.access_token}`,
                },
            });
            userResult = await userResult.json();
            if (userResult.id) {
                await db.account.set(`${req.session.account.id}.discord`, userResult.id);
                res.redirect("https://discord.gg/VMymJ9W");
            } else {
                res.redirect("/error");
            }
        } else {
            res.redirect("/error");
        }
        console.log(data);
    });

    app.get("/Feedback", async (req, res) => {
        res.status(200).render("./mobile/www/Feedback.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });
}