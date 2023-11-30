const { Scenes } = require("telegraf");
const { addAdmin } = require("../bdFunctions");
const startReplier = require("../startReplier");

const setNewAdminScene = new Scenes.BaseScene("setNewAdminScene")
const cancelButton = [{text: "Отмена", callback_data: "Отмена"}]

setNewAdminScene.enter(ctx => ctx.reply("Введите chat id пользователя, которого надо сделать админом", {reply_markup: {inline_keyboard: [cancelButton]}}))

setNewAdminScene.action("Отмена", async ctx => {
    await ctx.reply("Добавление нового админа отменено. Перенаправляю в главное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

setNewAdminScene.hears(/^\d+$/, async ctx => {
    var messageText = ctx.message.text
    var { status, message } = await addAdmin(messageText)
    if(status == 1) await ctx.telegram.sendMessage(messageText, "Вы были назначены администратором").catch(err => {
        if(err.response.error_code != 400) console.log(err)
    })
    await ctx.reply(message)
    await ctx.scene.leave()
    await startReplier(ctx)
})

setNewAdminScene.on("message", ctx => ctx.reply("В сообщении содержится что-то кроме цифр, а chat id состоит только из них, отправьте chat id еще раз", {reply_markup: {inline_keyboard: [cancelButton]}}))

module.exports = setNewAdminScene