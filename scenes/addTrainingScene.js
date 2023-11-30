const { Scenes } = require("telegraf");
const { addTraining, trainingsTittleIsFree } = require("../bdFunctions");
const sendMessages = require("../sendMessages");
const addMessages = require("../addMessages");
const startReplier = require("../startReplier");
const sendingMessageErrorHandler = require("../sendingMessageErrorHandler");

module.exports = new Scenes.WizardScene("addTrainingScene", 
    ctx => {
        ctx.scene.session.state = { messages: [] } // messages = [ { medias: [], mediagroupId: 0} ] или  [{ text: "jfsljfdls" }]
        ctx.reply("Введите название новой тренировки", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToManageTrainingsScene"}]]}}).catch(err => sendingMessageErrorHandler(err))
        return ctx.wizard.next()
    },
    async ctx => {
        if(ctx.callbackQuery?.data == "backToManageTrainingsScene") return ctx.scene.enter("manageTrainingsScene")
        if(!await trainingsTittleIsFree(ctx.message.text)) return await ctx.reply(`Название "${ctx.message.text}" уже занято другой тренировкой. Введите другое`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToManageTrainingsScene"}]]}}).catch(err => sendingMessageErrorHandler(err))
        ctx.scene.session.state.tittle = ctx.message.text
        await ctx.reply(`Запись тренировки "${ctx.scene.session.state.tittle}" началась, отправьте  все сообщения в нужном порядке, затем нажмите кнопку "Завершить формирование тренировки"`, {reply_markup: {inline_keyboard: [[{text: "Завершить формирование тренировки", callback_data: "stopTrainingRecording"}], [{text: "Назад", callback_data: "toSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
        return ctx.wizard.next()
    },
    async ctx => {
        if(ctx.callbackQuery?.data == "toSceneStart") return await ctx.scene.reenter()
        if(ctx.callbackQuery?.data == "accepted") {
            await addTraining(ctx.scene.session.state.tittle, ctx.scene.session.state.messages).catch(err => console.log(err))
            await ctx.reply("Отлично, добавил тренировку", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "toSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
        }
        if(ctx.callbackQuery?.data == "declined") {
            return await ctx.reply("Что хотите сделать?", {reply_markup: {inline_keyboard: [[{text: "Начать добавление тренировки заново", callback_data: "toSceneStart"}], [{text: "Отменить добавление тренировки", callback_data: "cancelAdding"}], [{text: "Назад", callback_data: "stopTrainingRecording"}]]}}).catch(err => sendingMessageErrorHandler(err))
        }
        if(ctx.callbackQuery?.data == "cancelAdding") {
            await ctx.reply("Добавление тренировки отменено, перенаправляю в основное меню").catch(err => sendingMessageErrorHandler(err))
            await ctx.scene.leave()
            return await startReplier(ctx)
        }
        else if(ctx.callbackQuery?.data == "stopTrainingRecording") {
            ctx.scene.session.state.messages.forEach(message => console.log(message))
            await ctx.reply("Вот так тренировка будет отображаться пользователю:").catch(err => sendingMessageErrorHandler(err))
            await sendMessages(ctx.scene.session.state.messages, ctx).catch(err => console.log(err))
            return await ctx.reply("Все отлично, подтверждаю добавление тренировки?", {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: "accepted"}, {text: "Нет", callback_data: "declined"}]]}}).catch(err => sendingMessageErrorHandler(err))
        }
        else await addMessages(ctx)
    }
)