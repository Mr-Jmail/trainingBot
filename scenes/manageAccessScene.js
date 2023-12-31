const { Scenes } = require("telegraf");
const { changeAccess, changeTrainerAccess, canAccessTrainer, getAllCourses, getCourseTittle, getActiveCourseId, getUsersCourses, getCoursesWeeks, changeActiveCourse, changeUsersCourses } = require("../bdFunctions");
const startReplier = require("../startReplier");
const genCoursesKeyboard = require("../genCoursesKeyboard");
const sendingMessageErrorHandler = require("../sendingMessageErrorHandler");

var manageAccessScene = new Scenes.BaseScene("manageAccessScene")

manageAccessScene.enter(ctx => {
    ctx.scene.session.state = {}
    ctx.reply("Сообщение аля \"Выберите, что хотите сделать с доступом\"", {reply_markup: {inline_keyboard: [[{text: "Предоставить", callback_data: "Предоставить"}, {text: "Приостановить", callback_data: "Приостановить"}], [{text: "Отмена", callback_data: "backToStartReplier"}]]}}).catch(err => sendingMessageErrorHandler(err))
})

manageAccessScene.action(/Предоставить|Приостановить/, ctx => {
    ctx.scene.session.state.toDo = ctx.callbackQuery.data
    ctx.reply("Введите chatId пользователя", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
})

manageAccessScene.action("backToSceneStart", ctx => ctx.scene.reenter())

manageAccessScene.action("backToStartReplier", async ctx => {
    await ctx.reply("Перенаправляю в основное меню").catch(err => sendingMessageErrorHandler(err))
    await ctx.scene.leave()
    await startReplier(ctx)
})

manageAccessScene.hears(/^\d+$/, async ctx => {
    if(!ctx.scene.session.state.toDo) return ctx.scene.reenter()
    ctx.scene.session.state.usersChatId = ctx.message.text
    if(ctx.scene.session.state.toDo == "Предоставить") {
        var courses = await getAllCourses()
        var inline_keyboard = await genCoursesKeyboard(courses, "giveAccessToCourse")
        inline_keyboard.push([{text: `Услуга "Личный тренер"`, callback_data: `canAccessTrainer`}], [{text: "Назад", callback_data: "Предоставить"}])
        await ctx.reply(`К чему выдать доступ пользователю "${ctx.scene.session.state.usersChatId}"?`, {reply_markup: {inline_keyboard}}).catch(err => sendingMessageErrorHandler(err))
    }
    else {
        var activeCourseId = await getActiveCourseId(ctx.message.text)
        var userHasTrainerAccess = await canAccessTrainer(ctx.message.text)
        console.log(activeCourseId);
        console.log(userHasTrainerAccess);
        if(!activeCourseId && !userHasTrainerAccess) await ctx.reply("У пользователя нет доступа ни к одной из услуг").catch(err => sendingMessageErrorHandler(err))
        else if(userHasTrainerAccess && activeCourseId) await ctx.reply("К чему приостановить доступ?", {reply_markup: {inline_keyboard: [[{text: "К личному тренеру", callback_data: "stopTrainerAccess"}], [{text: "К курсу", callback_data: "stopAccessToCourse"}], [{text: "Назад", callback_data: "Приостановить"}]]}}).catch(err => sendingMessageErrorHandler(err))
        else if(activeCourseId) stopCourseAccess(ctx)
        else if(userHasTrainerAccess) stopTrainerAccess(ctx)
    }
})

// Предоставить доступ

manageAccessScene.action(/giveAccessToCourse/, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("giveAccessToCourse", "")
    var usersCourses = await getUsersCourses(ctx.scene.session.state.usersChatId)
    var actualCourse = usersCourses.find(course => course.id == courseId)
    var courseWeeks = await getCoursesWeeks(courseId)
    var courseTittle = await getCourseTittle(courseId)
    await changeActiveCourse(ctx.scene.session.state.usersChatId, courseId)
    
    console.log(courseId)
    console.log(actualCourse)
    
    var errMsg

    if(actualCourse) {
        usersCourses.map(course => {
            if(course.id != courseId) return
            if(!courseWeeks[actualCourse.week]) return errMsg = `Пользователь "${ctx.scene.session.state.usersChatId}" полностью прошел курс "${courseTittle}" (кол-во недель в курсе: ${actualCourse.week})`
            course.trainings.push(...courseWeeks[actualCourse.week])
            course.week += 1
        })
    }
    else usersCourses.push({id: courseId, trainings: courseWeeks[0], week: 1})

    await changeUsersCourses(ctx.scene.session.state.usersChatId, JSON.stringify(usersCourses))
    await ctx.reply(errMsg ?? `Пользователю "${ctx.scene.session.state.usersChatId}" предоставлен доступ к курсу "${courseTittle}"`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
    if(!errMsg) await ctx.telegram.sendMessage(`🌟 Поздравляем!\nВам открыт доступ к курсу "[название курса]".\nНачните тренировки и не забудьте следовать инструкциям  для максимальной пользы.\nУдачи на вашем фитнес-путешествии! 💪🏋️‍♂️`).catch(err => sendingMessageErrorHandler(err))
})

manageAccessScene.action("canAccessTrainer", async ctx => {
    await changeTrainerAccess(ctx.scene.session.state.usersChatId)
    await ctx.reply(`Пользователю "${ctx.scene.session.state.usersChatId}" выдан доступ к личному тренеру`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
})

// Приостановить доступ

manageAccessScene.action("stopTrainerAccess", ctx => {
    stopTrainerAccess(ctx)
})

manageAccessScene.action("stopAccessToCourse", ctx => {
    stopCourseAccess(ctx)
})

function stopCourseAccess(ctx) {
    changeActiveCourse(ctx.scene.session.state.usersChatId)
    ctx.reply(`У пользователя ${ctx.scene.session.state.usersChatId} больше нет доступа к курсу`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
}

function stopTrainerAccess(ctx) {
    changeTrainerAccess(ctx.scene.session.state.usersChatId, 0)
    ctx.reply(`У пользователя ${ctx.scene.session.state.usersChatId} больше нет доступа к личному тренеру`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}}).catch(err => sendingMessageErrorHandler(err))
}


module.exports = manageAccessScene