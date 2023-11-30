const { Scenes, TelegramError } = require("telegraf");
const addMessages = require("../addMessages");
const sendMessages = require("../sendMessages");
const each = require("sync-each");
const { getUsersForSending } = require("../bdFunctions");
const startReplier = require("../startReplier");

var sendingScene = new Scenes.BaseScene("sendingScene")

sendingScene.enter(ctx => {
    ctx.scene.session.state = { onlyWithTrainingAccess: null, sendToUsersWithTrainerAccess: null, waitingForMessage: false, messages: [], results: {
        triedToSend: 0,
        successfullytSent: 0,
        blockedUsers: 0,
        otherErrors: 0,
    }}
    ctx.reply("Кому отправить сообщение?", {reply_markup: {inline_keyboard: [[{text: "Пользователям с доступом", callback_data: "withAccess"}], [{text: "Всем пользователям", callback_data: "toAll"}], [{text: "Отмена", callback_data: "backToStartReplier"}]]}})
})

sendingScene.action("backToStartScene", ctx => ctx.scene.reenter())

sendingScene.action("backToStartReplier", async ctx => {
    await ctx.reply("Перенаправляю в основное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

sendingScene.action(/withAccess|toAll/, ctx => {
    ctx.scene.session.state.onlyWithTrainingAccess = ctx.callbackQuery.data == "withAccess"
    ctx.reply("Отправлять сообщение пользователям, у которых есть доступ к личному тренеру?", {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: "sendToUsersWithTrainerAccess"}, {text: "Нет", callback_data: "withoutTrainerAccess"}], [{text: "Назад", callback_data: "backToStartScene"}]]}})
})

sendingScene.action(/sendToUsersWithTrainerAccess|withoutTrainerAccess/, ctx => {
    ctx.scene.session.state.sendToUsersWithTrainerAccess = ctx.callbackQuery.data == "sendToUsersWithTrainerAccess"
    ctx.scene.session.state.waitingForMessage = true
    ctx.reply("Отправьте сообщения для рассылки, когда закончите, нажмите кнопку ниже", {reply_markup: {inline_keyboard: [[{text: "Готово", callback_data: "done"}], [{text: "Назад", callback_data: ctx.scene.session.state.onlyWithTrainingAccess ? "withAccess" : "toAll"}]]}})
})

sendingScene.action("done", async ctx => {
    await ctx.reply(`Сейчас я вам отправлю, как пользователи увидят эту рассылку:`)
    await sendMessages(ctx.scene.session.state.messages, ctx).catch(err => console.log(err))
    await ctx.reply(`Эти сообщения будут отправлены ${ctx.scene.session.state.onlyWithTrainingAccess ? "только пользователям с доступом к какому-то курсу" : "как пользователям с доступом к какому-то курсу, так и пользователям без доступа"}. Также сообщения${ctx.scene.session.state.sendToUsersWithTrainerAccess ? " " : " не "}будут отправлены пользователям, у которых есть доступ к личному тренеру`)
    await ctx.reply("Все отлино? Начинаю рассылку?", {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: "startSending"}, {text: "Назад", callback_data: ctx.scene.session.state.sendToUsersWithTrainerAccess ? "sendToUsersWithTrainerAccess" : "withoutTrainerAccess"}]]}})
})

sendingScene.action("startSending", async ctx => {
    var users = await getUsersForSending(ctx.scene.session.state.onlyWithTrainingAccess, ctx.scene.session.state.sendToUsersWithTrainerAccess)
    console.log("Users:");
    console.log(users);
    await each(users, async function(user, next) {
        var errRecived = false;
        await sendMessages(ctx.scene.session.state.messages, ctx, user)
        .catch(err => {
            errRecived = true
            if(err.response.error_code == 403) ctx.scene.session.state.results.blockedUsers += 1
            else {
                ctx.scene.session.state.results.otherErrors += 1
                console.log(err)
            }
        })
        if(!errRecived) ctx.scene.session.state.results.successfullytSent += 1
        ctx.scene.session.state.results.triedToSend += 1
        next()
    }, async function() {
        var { triedToSend, successfullytSent, blockedUsers, otherErrors } = ctx.scene.session.state.results
        await ctx.reply(`<b>Результат рассылки:</b>\n\nКол-во пользователей, которым были отправлены сообщения: ${triedToSend}\n\nКол-во пользователей, которые получили сообщения: ${successfullytSent}\n\nКол-во пользователей, которые не полученны сообщения, т.к заблокировали бота: ${blockedUsers}\n\nКол-во пользователей, которые не получили сообщения по каким-то другим причинам: ${otherErrors}`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToStartReplier"}]]}, parse_mode: "HTML"}).catch(err => console.log(err))
    })
})

sendingScene.on("message", async ctx => {
    var { onlyWithTrainingAccess, sendToUsersWithTrainerAccess, waitingForMessage } = ctx.scene.session.state
    console.log(`onlyWithTrainingAccess: ${onlyWithTrainingAccess}\nsendToUsersWithTrainerAccess: ${sendToUsersWithTrainerAccess}\nwaitingForMessage: ${waitingForMessage}`);
    if([ onlyWithTrainingAccess, sendToUsersWithTrainerAccess, waitingForMessage ].some(el => el == null)) {
        await ctx.reply("Давайте идти по порядку. Запускаю добавление новой рассылки заново")
        await ctx.scene.reenter()
        console.log("reenetering")
        return
    }
    await addMessages(ctx)
})


module.exports = sendingScene