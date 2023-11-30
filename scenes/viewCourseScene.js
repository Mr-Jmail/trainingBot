const { Scenes } = require("telegraf");
const { getAllCourses, getCoursesWeeks, getTrainingsMessages, getTrainingsTittle } = require("../bdFunctions");
const genCoursesKeyboard = require("../genCoursesKeyboard");
const each = require("sync-each");
const sendMessages = require("../sendMessages");
const startReplier = require("../startReplier");

var viewCourseScene = new Scenes.BaseScene("viewCourseScene")

viewCourseScene.enter(async ctx => {
    var courses = await getAllCourses()
    var inline_keyboard = await genCoursesKeyboard(courses, "viewCourse")
    inline_keyboard.push([{text: "Отмена", callback_data: "toStartReplier"}])
    await ctx.reply("Какой курс хотите посмотреть?", {reply_markup: {inline_keyboard}})
})

viewCourseScene.action("toStartReplier", async ctx => {
    await ctx.reply("Перебрасываю в основное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

viewCourseScene.action("toCourseSellection", ctx => ctx.scene.reenter())

viewCourseScene.action(/viewCourse/ig, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("viewCourse", "")
    var weeks = await getCoursesWeeks(courseId)
    console.log(weeks);
    if(weeks.length == 0) return await ctx.reply("В этом курсе не добавлено ни одной недели")
    var inline_keyboard = genNumbersKeyboard(weeks.length, courseId)
    await ctx.reply("Какую неделю?", {reply_markup: {inline_keyboard}})
})

viewCourseScene.action(/viewWeekNumber/ig, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("viewWeekNumber", "").split("CourseId")
    console.log("courseId: " + courseId);
    console.log("weekNumber: " + weekNumber);
    var weeks = await getCoursesWeeks(courseId)
    var week = weeks[weekNumber - 1]
    each(week, async function(trainingId, next) {
        var trainingTittle = await getTrainingsTittle(trainingId)
        await ctx.reply(`Тренировка "${trainingTittle}":`)
        await sendMessages(await getTrainingsMessages(trainingId), ctx)
        next()
    }, async function() {
        await ctx.reply("Какой-то текст", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `viewCourse${courseId}`}]]}})
    })
})

function genNumbersKeyboard(weeksAmount, courseId) {
    var inline_keyboard = [[]]
    for(var i = 1, j = 0; i <= weeksAmount; i++) {
        var button = {text: i, callback_data: `viewWeekNumber${i}CourseId${courseId}`}
        if(inline_keyboard[j].length == 2) { inline_keyboard.push([button]); j++ }
        else inline_keyboard[j].push(button)
    }
    inline_keyboard.push([{text: "Назад", callback_data: "toCourseSellection"}])
    return inline_keyboard
} 

module.exports = viewCourseScene