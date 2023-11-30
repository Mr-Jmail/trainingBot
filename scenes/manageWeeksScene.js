const { Scenes } = require("telegraf");
const genCoursesKeyboard = require("../genCoursesKeyboard");
const { getCoursesWeeks, editCourse, getAllCourses, getAllTrainings, getTrainingsTittle, getCourseTittle } = require("../bdFunctions");
const genTrainingsKeyboard = require("../genTrainingsKeyboard");
const startReplier = require("../startReplier");

var manageWeeksScene = new Scenes.BaseScene("manageWeeksScene")

manageWeeksScene.enter(async ctx => {
    var courses = await getAllCourses()
    var inline_keyboard = genCoursesKeyboard(courses, "courseToEdit")
    inline_keyboard.push([{text: "Отмена", callback_data: "backToStart"}])
    ctx.reply("Выберите курс, который хотите править", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action("backToStart", async ctx => {
    await ctx.reply("Перенаправляю в основное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
})

manageWeeksScene.action(/courseToEdit/g, async ctx => {
    var courseId = ctx.callbackQuery.data = ctx.callbackQuery.data.replace("courseToEdit", "")
    ctx.reply("Сообщение аля \"Выберите, что хотите сделать\"", {reply_markup: {inline_keyboard: [[{text: "Добавить неделю", callback_data: `addWeek${courseId}`}], [{text: "Редактировать неделю", callback_data: `editWeek${courseId}`}], [{text: "Удалить неделю", callback_data: `deleteWeek${courseId}`}], [{text: "Назад", callback_data: `backToSceneStart`}]]}})
})

manageWeeksScene.action("backToSceneStart", ctx => ctx.scene.reenter())

manageWeeksScene.action(/addWeek/g, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("addWeek", "")
    var weeks = await getCoursesWeeks(courseId)
    var inline_keyboard = genNumbersKeyboard(weeks.length + 1, courseId, "newWeek")
    inline_keyboard.push([{text: "Назад", callback_data: `courseToEdit${courseId}`}])
    await ctx.reply("Какой по счету будет новая неделя?", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action(/newWeek/g, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("newWeek", "").split("CourseId")
    var weeks = await getCoursesWeeks(courseId)
    var newWeeks = [...weeks.slice(0, weekNumber - 1), [], ...weeks.slice(weekNumber - 1)]
    await editCourse(courseId, "weeks", JSON.stringify(newWeeks))
    await ctx.reply("Неделя добавлена", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `courseToEdit${courseId}`}]]}})
})



manageWeeksScene.action(/editWeek/g, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("editWeek", "")
    var weeks = await getCoursesWeeks(courseId)
    console.log(weeks);
    if(weeks.length == 0) return await ctx.reply("В этом курсе не добавлено ни одной недели. Добавить?", {reply_markup: {inline_keyboard: [[{text: "Добавить неделю", callback_data: `newWeek1CourseId${courseId}`}], [{text: "Назад", callback_data: `courseToEdit${courseId}`}]]}})
    var inline_keyboard = genNumbersKeyboard(weeks.length, courseId, "redactWeek")
    inline_keyboard.push([{text: "Назад", callback_data: `courseToEdit${courseId}`}])
    await ctx.reply("Выберите неделю, которую хотите редактировать", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action(/redactWeek/g, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("redactWeek", "").split("CourseId")
    await ctx.reply("Сообщение аля \"Выберите, что хотите сделать\"", {reply_markup: {inline_keyboard: [[{text: "Добавить тренировку", callback_data: `addTraining${weekNumber}Id${courseId}`}], [{text: "Удалить тренировку", callback_data: `deleteTraining${weekNumber}Id${courseId}`}], [{text: "Назад", callback_data: `editWeek${courseId}`}]]}})
})

manageWeeksScene.action(/addTraining/g, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("addTraining", "").split("Id")
    var inline_keyboard = genTrainingsKeyboard(await getAllTrainings(), 1, `week${weekNumber}Id${courseId}newTraining`, `newTrainingweek${weekNumber}Id${courseId}`)
    inline_keyboard.push([{text: "Назад", callback_data: `redactWeek${weekNumber}CourseId${courseId}`}])
    await ctx.reply("Выберите название тренировки, которую хотите добавить", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action(/deleteTraining/g, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("deleteTraining", "").split("Id")
    var weeks = await getCoursesWeeks(courseId)
    var week = []
    if(weeks[weekNumber - 1].length == 0) return await ctx.reply("Пока нечего удалять. В неделю не добавлена ни одна тренировка", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `redactWeek${weekNumber}CourseId${courseId}`}]]}})
    for (var i = 0; i < weeks[weekNumber - 1].length; i++) {
        await new Promise(async resolve => {
            var tittle = await getTrainingsTittle(weeks[weekNumber - 1][i])
            tittle = tittle == "" ? "Тренировка не найдена" : tittle
            week.push({
                id: weeks[weekNumber - 1][i],
                tittle
            })
            resolve()
        })
    }
    week.forEach(training => console.log(training))

    var inline_keyboard = genTrainingsKeyboard(week, 1, `week${weekNumber}Id${courseId}removeTraining`, `removeTrainingweek${weekNumber}Id${courseId}`)
    inline_keyboard.push([{text: "Назад", callback_data: `redactWeek${weekNumber}CourseId${courseId}`}])
    await ctx.reply("Выберите название тренировки, которую хотите удалить", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action(/removeTraining/g, async ctx => {
    var [ weekNumber, courseAndTrainingId ] = ctx.callbackQuery.data.replace("week", "").split("Id")
    var [ courseId, trainingId ] = courseAndTrainingId.split("removeTraining")
    await ctx.reply(`Вы уверены, что хотите удалить тренировку "${await getTrainingsTittle(trainingId)}" из ${weekNumber}й недели курса "${await getCourseTittle(courseId)}"?`, {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `confirmDeletingTraining${trainingId}Week${weekNumber}CourseId${courseId}`}, {text: "Назад", callback_data: `deleteTraining${weekNumber}Id${courseId}`}]]}})
})


manageWeeksScene.action(/confirmDeletingTraining/g, async ctx => {
    var [ trainingId, weekNumberAndCourseId ] = ctx.callbackQuery.data.replace("confirmDeletingTraining", "").split("Week")
    var [ weekNumber, courseId ] = weekNumberAndCourseId.split("CourseId")

    console.log(`trainingId: ${trainingId}\nweekNumberAndCourseId: ${weekNumberAndCourseId}\nweekNumber: ${weekNumber}\ncourseId: ${courseId}`)

    var weeks = await getCoursesWeeks(courseId)
    var week = weeks[weekNumber - 1].filter(id => id != trainingId)
    var newWeeks = [...weeks.slice(0, weekNumber - 1), week, ...weeks.slice(weekNumber)]
    await editCourse(courseId, "weeks", JSON.stringify(newWeeks))
    await ctx.reply(`Удалил тренировку "${await getTrainingsTittle(trainingId)}" из ${weekNumber}й недели курса "${await getCourseTittle(courseId)}"`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `deleteTraining${weekNumber}Id${courseId}`}]]}})
})

manageWeeksScene.action(/previous|next/ig, async ctx => {
    var action = ctx.callbackQuery.data.includes("removeTraining") ? "removeTraining" : "newTraining"
    var [ weekNumberAndCourseId, newPage ] = ctx.callbackQuery.data.replace(`${action}week`, "").split(ctx.match[0])
    var [ weekNumber, courseId ] = weekNumberAndCourseId.split("Id")
    newPage = Number(newPage)
    console.log(newPage);
    if(newPage == 0) return
    
    var inline_keyboard = genTrainingsKeyboard(await getAllTrainings(), newPage, `week${weekNumber}Id${courseId}${action}`, `${action}week${weekNumber}Id${courseId}`)

    inline_keyboard.push([{text: "Назад", callback_data: `redactWeek${weekNumber}CourseId${courseId}`}])
    console.log(`weekNumber: ${weekNumber}`);
    console.log(`courseId: ${courseId}`);
    await ctx.editMessageReplyMarkup({inline_keyboard}).catch(err => {
        console.log(err);
        ctx.reply("Какую тренировку редактируем?", {reply_markup: {inline_keyboard}}).catch(err => console.log(inline_keyboard[0]))
    })
})

manageWeeksScene.action(/newTraining/g, async ctx => {
    var [ weekNumber, courseAndTrainingId ] = ctx.callbackQuery.data.replace("week", "").split("Id")
    var [ courseId, trainingId ] = courseAndTrainingId.split("newTraining")
    var weeks = await getCoursesWeeks(courseId)
    var week = weeks[weekNumber - 1]
    console.log(weeks)
    console.log(week)
    var inline_keyboard = genNumbersKeyboard(week.length + 1, courseId, `pushTraining${trainingId}Week${weekNumber}Idx`)
    inline_keyboard.push([{text: "Назад", callback_data: `addTraining${weekNumber}Id${courseId}`}])
    await ctx.reply("Какой по счету будет стоять новая тренировка?", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action(/pushTraining/g, async ctx => {
    var [ trainingIdAndWeekNumber, idxAndCourseId ] = ctx.callbackQuery.data.replace("pushTraining", "").split("Idx")
    var [ trainingId, weekNumber ] = trainingIdAndWeekNumber.split("Week")
    var [ idx, courseId ] = idxAndCourseId.split("CourseId")
    var weeks = await getCoursesWeeks(courseId)
    var week = weeks[weekNumber - 1]
    var newWeek = [...week.slice(0, idx - 1), Number(trainingId), ...week.slice(idx - 1)]
    var newWeeks = weeks.map((week, counter) => counter == weekNumber - 1 ? newWeek : week)
    await editCourse(courseId, "weeks", JSON.stringify(newWeeks))
    var trainingTittle = await getTrainingsTittle(trainingId)
    var courseTittle = await getCourseTittle(courseId)
    await ctx.reply(`Тренировка "${trainingTittle}" добавлена на ${weekNumber}ю неделю курса "${courseTittle}"`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `addTraining${weekNumber}Id${courseId}`}]]}})
})

manageWeeksScene.action(/deleteWeek/g, async ctx => {
    var courseId = ctx.callbackQuery.data.replace("deleteWeek", "")
    var weeks = await getCoursesWeeks(courseId)
    var inline_keyboard = genNumbersKeyboard(weeks.length, courseId, "removeWeek")
    inline_keyboard.push([{text: "Назад", callback_data: `courseToEdit${courseId}`}])
    await ctx.reply("Выберите неделю, которую хотите удалить", {reply_markup: {inline_keyboard}})
})

manageWeeksScene.action(/removeWeek/g, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("removeWeek", "").split("CourseId")
    await ctx.reply(`Вы уверены, что хотите удалить ${weekNumber}ю неделю курса "${await getCourseTittle(courseId)}"`, {reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `confirmDeletingWeek${weekNumber}CourseId${courseId}`}, {text: "Назад", callback_data: `deleteWeek${courseId}`}]]}})
})

manageWeeksScene.action(/confirmDeletingWeek/g, async ctx => {
    var [ weekNumber, courseId ] = ctx.callbackQuery.data.replace("confirmDeletingWeek", "").split("CourseId")
    var weeks = await getCoursesWeeks(courseId)
    weeks = weeks.filter((_, counter) => counter != weekNumber - 1)
    await editCourse(courseId, "weeks", JSON.stringify(weeks))
    await ctx.reply(`${weekNumber}я неделя курса "${await getCourseTittle(courseId)} успешно удалена"`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: `courseToEdit${courseId}`}]]}})
})

function genNumbersKeyboard(lastNumber, courseId, callbackBeforeWeek) {
    var inline_keyboard = [[]]
    for(var i = 1, j = 0; i <= lastNumber; i++) {
        var button = {text: i, callback_data: `${callbackBeforeWeek}${i}CourseId${courseId}`}
        if(inline_keyboard[j].length == 2) { inline_keyboard.push([button]); j++ }
        else inline_keyboard[j].push(button)
    }
    return inline_keyboard
} 


module.exports = manageWeeksScene