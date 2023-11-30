const { Scenes } = require("telegraf");
const { addAdmin, deleteAdmin, userIsAdmin } = require("../bdFunctions");
const startReplier = require("../startReplier");

const deleteAdminScene = new Scenes.BaseScene("deleteAdminScene")
const backToStartReplierButton = [{text: "Отмена", callback_data: "backToStartReplier"}]
const backToSceneStartButton = [{text: "Назад", callback_data: "backToSceneStart"}]

deleteAdminScene.enter(ctx => ctx.reply("Введите chat id пользователя, которого надо удалить из админов", {reply_markup: {inline_keyboard: [backToStartReplierButton]}}))

deleteAdminScene.action("backToStartReplier", async ctx => {
    await ctx.reply("Перебрасываю в главное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

deleteAdminScene.action("backToSceneStart", ctx => ctx.scene.reenter())

deleteAdminScene.hears(/^\d+$/, async ctx => {
    var messageText = ctx.message.text
    var inline_keyboard = [backToSceneStartButton]
    if(!await userIsAdmin(messageText)) return await ctx.reply(`Пользователь ${messageText} не является админом`, {reply_markup: {inline_keyboard}})
    await deleteAdmin(messageText)
    await ctx.reply(`Пользователь ${messageText} больше не является администратором`, {reply_markup: {inline_keyboard}})
    await ctx.telegram.sendMessage(messageText, "Вы были разжалованы с должности администратора").catch(err => console.log(err))
    await ctx.scene.leave()
})

deleteAdminScene.on("message", ctx => ctx.reply("В сообщении содержится что-то кроме цифр, а chat id состоит только из них, отправьте chat id еще раз", {reply_markup: {inline_keyboard: [backToSceneStartButton]}}))

module.exports = deleteAdminScene