const multer = require('multer'),
    upload = multer({ dest: './files/', limits: { fileSize: 8 * 1024 * 1024 } });

module.exports = (app, config, db, modules) => {
    webhook = new modules.Discord.WebhookClient("webhook_id", "webhook_token");
    app.get("/recommend", async (req, res) => {
        if (!req.session.account) return res.status(200).redirect("/login");
        res.status(200).render("./mobile/recommendation/RecommendationMain.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });

    app.post("/requestRecommends", async (req, res) => {
        let articleDb = await db.recommend.raw();
        let page = req.body?.page;
        if (!page || articleDb.length < page * 5) return res.status(200).end(JSON.stringify([]));
        let users = await db.account.raw();
        let data = [];
        for (let i = (page * 5) - 1; i <= (page * 5) + 5; i++) {
            if (!data[i]) break;
            user = users.find(u => u.ID == articleDb[i].data.id);
            data.push({
                ID: articleDb[i].ID,
                name: user.data.name,
                number: user.data.number,
                date: articleDb[i].data.date,
                status: articleDb[i].data.status,
                files: articleDb[i].data.files,
                title: articleDb[i].data.title,
                agrees: articleDb[i].data.agrees?.length ?? 0,
                replys: articleDb[i].data.replys?.length ?? 0,
                index: i
            });
        };
        res.status(200).end(JSON.stringify(data));
    });

    app.get("/recommend/write", async (req, res) => {
        if (!req.session.account) return res.status(200).redirect("/login");
        res.status(200).render("./mobile/recommendation/RecommendationWrite.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
    });

    app.post("/recommend/write", upload.any('file'), async (req, res) => {
        if (!req.session.account) return res.status(500).end("Invaild account");
        let code = modules.randomcode()
        await db.recommend.set(code, {
            title: req.body.title,
            content: req.body.content,
            files: req.files,
            id: req.session.account.id,
            status: 0,
            date: modules.moment().tz("Asia/Seoul").format('YYYY-MM-DD / HH:mm:ss'),
            replys: [],
            agrees: [],
            report: [[], [], [], [], [], [], [], [], []]
        });
        await db.account.type(`${req.session.account.id}.recommend`) != "array" ? await db.account.set(`${req.session.account.id}.recommend`, code) : await db.account.push(`${req.session.account.id}.recommend`, code)
        let user = await db.account.get(req.session.account.id);
        let embed = new modules.Discord.MessageEmbed()
            .setTitle(`새로운 건의가 등록되었습니다.`)
            .setDescription(`건의자 : ${user.name}`)
            .addField("제목", req.body.title)
            .addField("파일 유뮤", req.files[0] ? "O" : "X");
        let button = new modules.Discord.MessageButton()
            .setStyle("LINK")
            .setLabel("글 보기")
            .setURL(`http://${config.host}/recommend/${code}`);
        webhook.send({ embeds: [embed], components: [[button]] })
        res.status(200).end(code);
    });

    app.get("/recommend/:code", async (req, res) => {
        res.status(200).render("./mobile/recommendation/RecommendationBoard.ejs", {
            data: req.session.account ? await db.account.get(req.session.account.id) : null
        });
        // if (!req.session.account) return res.status(200).redirect(`/login/${req.path.replace(/\//g, "※")}`);
        // let article = await db.recommend.get(req.params.code);
        // if (!article) return res.status(404).redirect(`${req.params.code}/error`);
        // let user = await db.account.get(article.id);
        // res.status(200).render("./mobile/recommendation/RecommendationBoard.ejs", {
        //     data: req.session.account ? await db.account.get(req.session.account.id) : null,
        //     article: article,
        //     id: req.params.code,
        //     session: req.session,
        //     user: user,
        //     users: await db.account.raw()
        // });
    });

    app.post("/recommend/agree/:code", async (req, res) => {
        if (!req.session.account) return res.status(200).end("Invaild account");
        let article = await db.recommend.get(req.params.code);
        if (!article) return res.status(404).end("Invaild article");
        let getip = await modules.ip.getClientIp(req);
        // console.log(article.agrees)
        let index = article.agrees.indexOf(article.agrees.find(i => i.id == req.session.account.id));
        if (article.agrees.find(i => i.id == req.session.account.id)) {
            let d = article.agrees
            d.splice(index, 1)
            await db.recommend.set(`${req.params.code}.agrees`, d);
        } else {
            await db.recommend.push(`${req.params.code}.agrees`, { "ip": getip, "id": req.session.account.id, "date": modules.moment().tz("Asia/Seoul").unix() });
        }
        article = await db.recommend.get(req.params.code);
        res.status(200).end(`${article.agrees.length}`);
    });

    app.post("/recommend/:code", async (req, res) => {
        if (!req.session.account || !req.body.reply) return res.status(200).end("Invaild Reply or Account");
        let article = await db.recommend.get(req.params.code);
        if (!article) return res.status(404).end("Invaild article");
        let getip = await modules.ip.getClientIp(req);
        await db.recommend.push(`${req.params.code}.replys`, { "ip": getip, "id": req.session.account.id, "reply": req.body.reply, "date": modules.moment().tz("Asia/Seoul").format("YYYY-MM-DD / HH:mm:ss") });
        res.status(200).end("Yes");
    });

    app.get("/recommend/:code/download/:download", async (req, res) => {
        if (!req.session.account) return res.status(200).redirect("/login");
        let article = await db.recommend.get(req.params.code);
        if (!article || !article.files.find(i => i.filename == req.params.download)) return res.status(404).redirect(`/${req.params.code}/${req.params.download}/error`);
        res.status(200).download(`./files/${req.params.download}`, article.files.find(i => i.filename == req.params.download).originalname);
    });
}