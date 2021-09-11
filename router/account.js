module.exports = function (app, config, db, modules) {
    app.get("/profile", async (req, res) => {
        if (!req.session.account) return res.status(200).redirect("/login")
        res.status(200).render("./mobile/account/Profile.ejs", {
            data: await db.account.get(req.session.account.id)
        });
    });

    app.get("/login", (req, res) => {
        console.log(req.path)
        res.status(200).render("./mobile/account/Login.ejs");
    });

    app.get("/login/:path", (req, res) => {
        res.status(200).render("./mobile/account/Login.ejs");
    });

    app.post("/login", async (req, res) => {
        let user = await db.account.get(`${req.body.id}`);
        Object.assign(user, { id: req.body.id })
        console.log(user)
        if (!user || user.pw != modules.sha256(req.body.pw)) {
            res.status(200).end("Account is not defined");
        } else if (!user.verify) {
            res.status(200).end("Account is not verify");
        } else {
            req.session.account = user;
            res.status(200).end("Allow");
        }
    });

    app.get("/logout", async (req, res) => {
        if (req.session?.account) {
            req.session.destroy();
        };
        res.redirect("/");
    });

    app.get("/pwchange", async (req, res) => {
        res.render("./mobile/account/PasswordChanging.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });

    app.get("/controlPanel", async (req,res) => {
        res.render("./mobile/account/ControlPanel.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });
}