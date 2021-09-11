module.exports = function (config, db, modules) {
    let Discord = modules.Discord,
        client = new Discord.Client({ intents: [Discord.Intents.ALL] });

    client.on("ready", () => {
        console.log(client.user.tag);
    });

    client.on("guildMemberAdd", async (member) => {
        let userDB = await db.account.raw();
        userDB = userDB.find(u => u.data.discord == member.user.id);
        if (!userDB) return member.kick();
    });

    client.on("guildMemberRemove", async (member) => {
        let userDB = await db.account.raw();
        userDB = userDB.find(u => u.data.discord == member.user.id);
        if (!userDB) return;
        await db.account.set(`${userDB.ID}.discord`, null);
    });

    client.login(config.token);
};