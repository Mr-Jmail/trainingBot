const { Scenes } = require("telegraf");
const startReplier = require("../startReplier");

var manageTrainingsScene = new Scenes.BaseScene("manageTrainingsScene")

manageTrainingsScene.enter(ctx => ctx.reply("Что вы хотите сделать?", {reply_markup : {inline_keyboard: [[{text: "Добавить тренировку", callback_data: "addTraining"}], [{text: "Редактировать тренировку", callback_data: "editTraining"}], [{text: "Удалить тренировку", callback_data: "deleteTraining"}], [{text: "Отмена", callback_data: "backToStart"}]]}}))

manageTrainingsScene.action("addTraining", ctx => {
    ctx.scene.enter("addTrainingScene")
})

manageTrainingsScene.action("editTraining", ctx => {
    ctx.scene.enter("editTrainingScene")
})

manageTrainingsScene.action("deleteTraining", ctx => {
    ctx.scene.enter("deleteTrainingScene")
})

manageTrainingsScene.action("backToStart", async ctx => {
    await ctx.reply("Перенаправляю в основное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

module.exports = manageTrainingsScene