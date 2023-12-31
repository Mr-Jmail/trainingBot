const path = require("path");
require('dotenv').config({path: path.join(__dirname, ".env")})
const managerLink = process.env.managerLink
const { Composer } = require("telegraf");
const sendMessages = require("../sendMessages");
const { getUsersTraining, getTrainingsMessages, getActiveCourseId, changeUsersCourses, getUsersCourses } = require("../bdFunctions");
const sendingMessageErrorHandler = require("../sendingMessageErrorHandler");

var trainingsComposer = new Composer()

trainingsComposer.action("Начать тренировку", async ctx => {
    const backButton = {text: "Назад", callback_data: "backToStart"}
    var activeCourseId = await getActiveCourseId(ctx.from.id)
    if(!activeCourseId) return ctx.reply("📩 Упс, кажется у вас пока нет доступа к нашим тренировкам.\nЧтобы получить доступ и начать свой фитнес-путь, пожалуйста, отправьте сообщение нам нажав на кнопку \"Написать менеджеру\" , и наш менеджер предоставит доступ к нашим курсам тренировок", {reply_markup: {inline_keyboard: [[{text: "Написать менеджеру", url: managerLink}], [{text: "Проверить доступ", callback_data: "Начать тренировку"}], [backButton]]}}).catch(err => sendingMessageErrorHandler(err))
    var idOfTrainingToSend = await getUsersTraining(ctx.from.id, activeCourseId)
    console.log(idOfTrainingToSend);
    if(!idOfTrainingToSend) return await ctx.reply("🌟 Поздравляем, вы успешно завершили все тренировки на этой неделе! Отдохнитесь и восстановитесь, чтобы быть готовыми к следующей неделе тренировок.\nОни станут доступны в начале следующей недели.\nПомните, восстановление так же важно, как и тренировка! 💤💪", {reply_markup: {inline_keyboard: [[backButton]]}}).catch(err => sendingMessageErrorHandler(err))
    var messages = await getTrainingsMessages(idOfTrainingToSend).catch(err => console.log(err))
    
    if(messages.length == 0) return await ctx.reply("Произошла ошибка, тренировка не найдена. Обратитесь к менеджеру, чтобы сообщить о проблеме проблему", {reply_markup: {inline_keyboard: [[{text: "Написать менеджеру", url: managerLink}]]}}).catch(err => sendingMessageErrorHandler(err))
    
    await sendMessages(messages, ctx).catch(async err => console.log(err))
    await ctx.reply("После выполнения всех упражнений, нажмите на кнопку ниже👇", {reply_markup: {inline_keyboard: [[{text: "Завершить тренировку", callback_data: "endTraining" + idOfTrainingToSend}]]}}).catch(err => sendingMessageErrorHandler(err))
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