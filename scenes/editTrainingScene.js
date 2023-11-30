const { Scenes } = require("telegraf");
const { getAllTrainings, getTrainingsMessages, editTraining, getTrainingsTittle } = require("../bdFunctions");
const startReplier = require("../startReplier");
const sendMessages = require("../sendMessages");
const addMessages = require("../addMessages");
const genTrainingsKeyboard = require("../genTrainingsKeyboard");

var editTrainingScene = new Scenes.BaseScene("editTrainingScene")

editTrainingScene.enter(async ctx => {
    ctx.scene.session.state = { messages: [], readyToRecevieMessages: false }
    var trainings = await getAllTrainings()
    console.log(trainings);
    const backButton = [{text: "Назад", callback_data: "backToManageTrainingsScene"}]
    
    if(trainings.length == 0) return await ctx.reply("Нечего редактировать, ни одна тренировка не добавлена", {reply_markup: {inline_keyboard: [backButton]}})

    var inline_keyboard = genTrainingsKeyboard(trainings, 1, "editTrainingId")
    inline_keyboard.push(backButton)
    ctx.telegram.sendMessage(ctx.from.id, "Какую тренировку редактируем?", {reply_markup: {inline_keyboard}}).catch(err => console.log(err))
})

editTrainingScene.action(/previous|next/ig, async ctx => {
    var newPage = Number(ctx.callbackQuery.data.replace(ctx.match[0], ""))
    console.log(newPage);
    if(newPage == 0) return
    var trainings = await getAllTrainings()
    var inline_keyboard = genTrainingsKeyboard(trainings, newPage, "editTrainingId")
    inline_keyboard.push([{text: "Назад", callback_data: "backToManageTrainingsScene"}])
    await ctx.editMessageReplyMarkup({inline_keyboard}).catch(err => {
        console.log(err);
        ctx.reply("Какую тренировку редактируем", {reply_markup: {inline_keyboard}}).catch(err => console.log(inline_keyboard[0]))
    })
})

editTrainingScene.action("backToManageTrainingsScene", async ctx => ctx.scene.enter("manageTrainingsScene"))

editTrainingScene.action(/editTrainingId/g, async ctx => {
    var trainingId = ctx.callbackQuery.data.replace("editTrainingId", "")
    console.log(trainingId);
    var messages = await getTrainingsMessages(trainingId).catch(err => console.log(err))
    console.log(messages);
    await ctx.reply("Так сейчас выглядит тренировка:")
    await sendMessages(messages, ctx).catch(err => console.log(err))
    await ctx.reply("Что хотите сделать?", {reply_markup: {inline_keyboard: [[{text: "Добавить сообщение", callback_data: `prepareToAddMessage${messages.length}trainingId${trainingId}`}], [{text: "Удалить сообщение", callback_data: `prepareToDeleteMessage${messages.length}trainingId${trainingId}`}], [{text: "Назад", callback_data: "toStartOfScene"}]]}})
})

editTrainingScene.action("toStartOfScene", ctx => ctx.scene.reenter())

editTrainingScene.action(/prepareToAddMessage|prepareToDeleteMessage/g, async ctx => {
    var [ messagesLength, trainingId ] = ctx.callbackQuery.data.replace(ctx.match[0], "").split("trainingId")
    await ctx.reply(ctx.match[0] == "prepareToAddMessage" ? "Каким по счету будет новое сообщение?" : "Какое сообщение по счету хотите удалить?", {reply_markup: {inline_keyboard: genNumbersKeyboard(ctx.match[0].replace("prepareTo", ""), trainingId, messagesLength)}})
})

editTrainingScene.action(/toDoAddMessage/g, async ctx => {
    var [ trainingId, messageNumber ] = ctx.callbackQuery.data.replace("toDoAddMessageId", "").split("MessageNumber")
    ctx.scene.session.state.readyToRecevieMessages = true
    var messages = await getTrainingsMessages(trainingId).catch(err => console.log(err))
    await ctx.reply("Отправьте новое(ые) сообщение(я), а затем нажмите кнопку \"Завершить запись сообщения(й)\"", {reply_markup: {inline_keyboard: [[{text: "Завершить запись сообщения(й)", callback_data: `stopAdding${trainingId}MsgNumber${messageNumber}`}], [{text: "Назад", callback_data: `prepareToAddMessage${messages.length}trainingId${trainingId}`}]]}})
})

editTrainingScene.action(/stopAdding/g, async ctx => {
    ctx.scene.session.state.readyToRecevieMessages = false
    var [ trainingId, messageNumber ] = ctx.callbackQuery.data.replace(ctx.match[0], "").split("MsgNumber")
    console.log(trainingId)
    console.log(messageNumber)
    var oldMessages = await getTrainingsMessages(trainingId)
    var messages = [...oldMessages.splice(0, messageNumber - 1), ...ctx.scene.session.state.messages, ...oldMessages.splice(messageNumber - 1)]
    await editTraining(trainingId, "messages", JSON.stringify(messages))
    await ctx.reply("Сообщения успешно добавлены, теперь тренировка выглядит вот так:")
    await sendMessages(await getTrainingsMessages(trainingId), ctx).catch(err => console.log(err).messages)
    await ctx.reply("Какое-то сообщение", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `editTrainingId${trainingId}`}]]}})
})

editTrainingScene.action(/toDoDeleteMessage/, async ctx => {
    var [ trainingId, messageNumber ] = ctx.callbackQuery.data.replace("toDoDeleteMessageId", "").split("MessageNumber")
    var messages = await getTrainingsMessages(trainingId)
    await ctx.reply(`Вы уверены, что хотите удалить ${messageNumber}е сообщение из тренировки "${await getTrainingsTittle(trainingId)}"?`, {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `confirmDeletingMessage${messageNumber}TrainingId${trainingId}`}, {text: "Назад", callback_data: `prepareToDeleteMessage${messages.length}trainingId${trainingId}`}]]}})
})

editTrainingScene.action(/confirmDeletingMessage/g, async ctx => {
    var [ messageNumber, trainingId ] = ctx.callbackQuery.data.replace("confirmDeletingMessage", "").split("TrainingId")
    var messages = await getTrainingsMessages(trainingId)
    var newMessages = messages.filter((_, counter) => counter != messageNumber - 1)
    await editTraining(trainingId, "messages", JSON.stringify(newMessages)).catch(err => console.log(err))
    await ctx.reply("Сообщение успешно удалено, теперь тренировка выглядит вот так:")
    await sendMessages(await getTrainingsMessages(trainingId), ctx).catch(err => console.log(err))
    await ctx.reply("Какое-то сообщение", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `editTrainingId${trainingId}`}]]}})
})

editTrainingScene.on("message", async ctx => {
    if(!ctx.scene.session.state.readyToRecevieMessages) {
        await ctx.reply("Давайте идти по порядку")
        return await ctx.scene.reenter()
    }
    await addMessages(ctx)
})

function genNumbersKeyboard(action, trainingId, lastNumber) {
    var inline_keyboard = [[]]
    console.log(action)
    console.log(trainingId)
    if(action == "AddMessage") lastNumber = Number(lastNumber) + 1
    for(var i = 1, j = 0; i <= lastNumber; i++) {
        var button = {text: i, callback_data: `toDo${action}Id${trainingId}MessageNumber${i}`}
        if(inline_keyboard[j].length == 2) { inline_keyboard.push([button]); j++ }
        else inline_keyboard[j].push(button)
    }
    inline_keyboard.push([{text: "Назад", callback_data: `editTrainingId${trainingId}`}])
    return inline_keyboard
}

module.exports = editTrainingScene