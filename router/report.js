module.exports = function (app, config, db) {

    app.get("/report/:id", async (req, res) => {
        let article = await db.recommend.get(req.params.id);
        if (!article) return res.status(404).redirect(`${req.params.code}/error`);

        res.status(200).render("./mobile/report/send-report.ejs", {
            article: article,
            data: req.session.account ? await db.account.get(req.session.account.id) : null,
            user: await db.account.get(article.id)
        });
    });

    app.post("/report", async (req, res) => {
        console.log(req.body);
        if (!req.body.id || !req.body.content) return res.status(404).end("Invaild article or content");
        await req.recommend
    });

    app.get("/reportlist/:id", async (req, res) => {
        let article = await db.recommend.get(req.params.id);
        if (!article) return res.status(404).redirect(`${req.params.code}/error`);

        res.status(200).render("./mobile/report/rec-report.ejs", {
            article: article,
            data: req.session.account ? await db.account.get(req.session.account.id) : null,
            user: await db.account.get(article.id)
        });
    });
}