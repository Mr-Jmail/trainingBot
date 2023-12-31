const path = require("path");
require('dotenv').config({path: path.join(__dirname, ".env")})
const managerLink = process.env.managerLink
const coachLink = process.env.coachLink
const cron = require('node-cron');
const { Telegraf, Scenes, session } = require("telegraf")
const bot = new Telegraf(process.env.botToken)

const sendingMessageErrorHandler = require("./sendingMessageErrorHandler.js");
const startReplier = require("./startReplier.js");

const { canAccessTrainer, userIsAdmin, nasratTrenirovkami, getUsersToAddTrainings, changeUsersCourses, getCoursesWeeks, getCourseTittle } = require("./bdFunctions");

const deleteAdminScene = require("./scenes/deleteAdminScene.js");
const setNewAdminScene = require("./scenes/setNewAdminScene.js");
const sendingScene = require("./scenes/sendingScene.js");
const manageAccessScene = require("./scenes/manageAccessScene.js");
const manageTrainingsScene = require("./scenes/manageTrainingsScene.js");
const addTrainingScene = require("./scenes/addTrainingScene.js");
const editTrainingScene = require("./scenes/editTrainingScene.js");
const deleteTrainingScene = require("./scenes/deleteTrainingScene.js");
const reviewScene = require("./scenes/reviewScene.js");
const manageCourseScene = require("./scenes/manageCourseScene.js");
const addCourseScene = require("./scenes/addCourseScene.js");
const viewCourseScene = require("./scenes/viewCourseScene.js");
const manageWeeksScene = require("./scenes/manageWeeksScene.js");

var stage = new Scenes.Stage([setNewAdminScene, deleteAdminScene, sendingScene, manageAccessScene, manageTrainingsScene, addTrainingScene, editTrainingScene, deleteTrainingScene, reviewScene, manageCourseScene, addCourseScene, viewCourseScene, manageWeeksScene])

const adminsComposer = require("./composers/adminsComposer.js");
const trainingsComposer = require("./composers/trainingsComposer.js");
const each = require("sync-each");

bot.use(session())
bot.use(stage.middleware())
bot.use(adminsComposer, trainingsComposer)

bot.start(ctx => startReplier(ctx));

bot.action("Личный тренер", async ctx => {
    setTimeout(async () => {
        const backButton = {text: "Назад", callback_data: "backToStart"}
        if(!await canAccessTrainer(ctx.from.id)) return ctx.reply("Чтобы получить доступ к личному тренеру, пожалуйста, отправьте нам сообщение нажав на кнопку \"Написать менеджеру\" 💬🏆", {reply_markup: {inline_keyboard: [[{text: "Написать менеджеру", url: managerLink}], [{text: "Проверить доступ", callback_data: "Личный тренер"}], [backButton]]}}).catch(err => sendingMessageErrorHandler(err))
        ctx.reply("У Вас есть уникальная возможность общаться напрямую с Иваном Ивановым, вашим профессиональным тренером, чтобы получить персональные советы, задать вопросы и обсудить ваши фитнес-цели.\n\nПросто начните разговор, нажав на кнопку \"Написать тренеру\". 💬💪✨", {reply_markup: {inline_keyboard: [[{text: "Написать тренеру", url: coachLink}], [backButton]]}}).catch(err => sendingMessageErrorHandler(err))
    }, 5000);
})

bot.action("backToStart", ctx => startReplier(ctx))

bot.command("send", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return
    ctx.scene.enter("sendingScene")
})

bot.command("manageAccess", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return
    ctx.scene.enter("manageAccessScene")
})

bot.command("manageTrainings", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return;
    ctx.scene.enter("manageTrainingsScene")  
})

bot.command("manageCourse", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return
    ctx.scene.enter("manageCourseScene")
})

bot.command("viewCourse", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return
    ctx.scene.enter("viewCourseScene")
})

bot.command("manageWeeks", async ctx => {
    if(!await userIsAdmin(ctx.from.id)) return
    ctx.scene.enter("manageWeeksScene")
})

bot.command("nasratTrenirovkami", async ctx => await nasratTrenirovkami())


bot.launch();

cron.schedule("0 12 * * 7", async() => {
// ;(async() => {
    var users = await getUsersToAddTrainings()
    each(users, async function(user, next) {
        var errMsg;
        var courseWeeks = await getCoursesWeeks(user.activeCourseId)
        var courseTittle = await getCourseTittle(user.activeCourseId)
        await user.courses.map(course => {
            if(course.id != user.activeCourseId) return
            course.trainings.push()
            if(!courseWeeks[course.week]) return errMsg = `Поздравляю! Вы полностью прошли курс ${courseTittle}! 😎`
            course.trainings.push(...courseWeeks[course.week])
            course.week += 1
        })
        await changeUsersCourses(user.chatId, JSON.stringify(user.courses))
        if(errMsg) await bot.telegram.sendMessage(process.env.managersChatId, `Пользователь "${user.chatId}" полностью прошел курс "${courseTittle}"`).catch(err => sendingMessageErrorHandler(err))
        await bot.telegram.sendMessage(user.chatId, errMsg ?? `В курс «${courseTittle} добавлены новые тренировки! 💪`).catch(err => sendingMessageErrorHandler(err))
        next()
    })
})