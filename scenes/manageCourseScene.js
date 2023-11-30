const { Scenes } = require("telegraf");
const { getAllCourses, deleteCourse, getCourseTittle } = require("../bdFunctions");
const genCoursesKeyboard = require("../genCoursesKeyboard");
const startReplier = require("../startReplier");

var manageCourseScene = new Scenes.BaseScene("manageCourseScene")

manageCourseScene.enter(ctx => {
    ctx.reply("Что хотите сделать?", {reply_markup: {inline_keyboard: [[{text: "Создать курс", callback_data: "addCourse"}], [{text: "Удалить курс", callback_data: "deleteCourse"}], [{text: "Отмена", callback_data: "backToStartReplier"}]]}})
})

manageCourseScene.action("backToSceneStart", ctx => ctx.scene.reenter())

manageCourseScene.action("backToStartReplier", async ctx => {
    await ctx.reply("Перенаправляю в основное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

manageCourseScene.action("addCourse", ctx => {
    ctx.scene.enter("addCourseScene")
})

manageCourseScene.action("deleteCourse", async ctx => {
    var courses = await getAllCourses()
    var inline_keyboard = genCoursesKeyboard(courses, "removeCourseId")
    inline_keyboard.push([{text: "Назад", callback_data: "backToSceneStart"}])
    await ctx.reply("Выберите курс, который хотите удалить", {reply_markup: {inline_keyboard}})
})

manageCourseScene.action(/removeCourseId/ig, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("removeCourseId", "")
    var courseTittle = await getCourseTittle(courseId)
    await ctx.reply(`Вы уверены, что хотите удалить курс "${courseTittle}"?`, {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `confirmDelitingCourse${courseId}`}, {text: "Назад", callback_data: "deleteCourse"}]]}})
})

manageCourseScene.action(/confirmDelitingCourse/ig, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("confirmDelitingCourse", "")
    var courseTittle = await getCourseTittle(courseId)
    await deleteCourse(courseId)
    await ctx.reply(`Курс "${courseTittle}" успешно удален`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "deleteCourse"}]]}})
})

module.exports = manageCourseScene