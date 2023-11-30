const { Composer } = require("telegraf");
const { userIsAdmin } = require("../bdFunctions");
const adminsComposer = new Composer();

adminsComposer.command("addAdmin", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return;
    ctx.scene.enter("setNewAdminScene")
})

adminsComposer.command("deleteAdmin", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return;
    ctx.scene.enter("deleteAdminScene")
})

module.exports = adminsComposer