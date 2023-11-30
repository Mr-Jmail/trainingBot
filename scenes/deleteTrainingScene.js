const { Scenes } = require("telegraf");
const { deleteTraining, getAllTrainings, getTrainingsTittle } = require("../bdFunctions");
const startReplier = require("../startReplier");
const genTrainingsKeyboard = require("../genTrainingsKeyboard");

var deleteTrainingScene = new Scenes.BaseScene("deleteTrainingScene")

deleteTrainingScene.action("backToManageTrainingsScene", async ctx => ctx.scene.enter("manageTrainingsScene"))

deleteTrainingScene.action("backToSceneStart", async ctx => ctx.scene.reenter())

deleteTrainingScene.enter(async ctx => {
    ctx.scene.session.state = { messages: [], readyToRecevieMessages: false }
    var trainings = await getAllTrainings()
    console.log(trainings);

    const backButton = [{text: "Назад", callback_data: "backToManageTrainingsScene"}]

    if(trainings.length == 0) return await ctx.reply("Нечего удалять, ни одна тренировка не добавлена", {reply_markup: {inline_keyboard: [backButton]}})

    var inline_keyboard = genTrainingsKeyboard(trainings, 1, "deleteTrainingId")
    inline_keyboard.push(backButton)
    await ctx.reply("Какую тренировку хотите удалить?", {reply_markup: {inline_keyboard}})
})

deleteTrainingScene.action(/previous|next/ig, async ctx => {
    var newPage = Number(ctx.callbackQuery.data.replace(ctx.match[0], ""))
    console.log(newPage);
    if(newPage == 0) return
    var trainings = await getAllTrainings()
    var inline_keyboard = genTrainingsKeyboard(trainings, newPage, "deleteTrainingId")
    inline_keyboard.push([{text: "Назад", callback_data: "backToManageTrainingsScene"}])
    await ctx.editMessageReplyMarkup({inline_keyboard}).catch(err => {
        console.log(err);
        ctx.reply("Какую тренировку хотите удалить?", {reply_markup: {inline_keyboard}})
    })
})

deleteTrainingScene.action(/deleteTrainingId/g, async ctx => {
    var trainingId = ctx.callbackQuery.data.replace("deleteTrainingId", "")
    var trainingTittle = await getTrainingsTittle(trainingId)
    await ctx.reply(`Вы уверены, что хотите удалить тренировку ${trainingTittle}?`, {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `confirmDelitingTraining${trainingId}`}], [{text: "Назад", callback_data: "cancelDeleting"}]]}})
})

deleteTrainingScene.action("cancelDeleting", ctx => ctx.scene.reenter())

deleteTrainingScene.action(/confirmDelitingTraining/g, async ctx => {
    var trainingId = ctx.callbackQuery.data.replace("confirmDelitingTraining", "")
    var trainingTittle = await getTrainingsTittle(trainingId)
    await deleteTraining(trainingId).catch(err => console.log(err))
    await ctx.reply(`Тренировка "${trainingTittle}" успешно удалена`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}})
})


module.exports = deleteTrainingScene