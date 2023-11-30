const path = require("path");
require('dotenv').config({path: path.join(__dirname, ".env")})
const managerLink = process.env.managerLink
const { Composer } = require("telegraf");
const sendMessages = require("../sendMessages");
const { getUsersTraining, getTrainingsMessages, getActiveCourseId, changeUsersCourses, getUsersCourses } = require("../bdFunctions");

var trainingsComposer = new Composer()

trainingsComposer.action("Начать тренировку", async ctx => {
    const backButton = {text: "Назад", callback_data: "backToStart"}
    var activeCourseId = await getActiveCourseId(ctx.from.id)
    if(!activeCourseId) return ctx.reply("Сообщение с просьбой написать менеджеру за доступом", {reply_markup: {inline_keyboard: [[{text: "Написать менеджеру", url: managerLink}], [{text: "Проверить доступ", callback_data: "Начать тренировку"}], [backButton]]}})
    var idOfTrainingToSend = await getUsersTraining(ctx.from.id, activeCourseId)
    console.log(idOfTrainingToSend);
    if(!idOfTrainingToSend) return await ctx.reply("На этой неделе пройдены все тренировки, нужно дождаться следующей недели чтобы продолжить", {reply_markup: {inline_keyboard: [[backButton]]}})
    var messages = await getTrainingsMessages(idOfTrainingToSend).catch(err => console.log(err))
    
    if(messages.length == 0) return await ctx.reply("Произошла ошибка, тренировка не найдена. Обратитесь к менеджеру, чтобы сообщить о проблеме проблему", {reply_markup: {inline_keyboard: [[{text: "Написать менеджеру", url: managerLink}]]}})
    
    await sendMessages(messages, ctx).catch(async err => console.log(err))
    await ctx.reply("Когда выполнете все упражнения, нажмите на кнопку ниже", {reply_markup: {inline_keyboard: [[{text: "Завершить тренировку", callback_data: "endTraining" + idOfTrainingToSend}]]}})
})

trainingsComposer.action(/endTraining/ig, async ctx => {
    var courses = await getUsersCourses(ctx.from.id)
    var courseId = await getActiveCourseId(ctx.from.id)
    var trainingId = ctx.callbackQuery.data.replace("endTraining", "")
    
    courses.map(course => {
        if(course.id != courseId) return
        course.trainings = course.trainings.filter(idOfTraining => idOfTraining != trainingId)
    })

    await changeUsersCourses(ctx.from.id, JSON.stringify(courses))
    await ctx.scene.enter("reviewScene", { trainingId })
})


module.exports = trainingsComposer