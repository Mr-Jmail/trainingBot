const { Scenes } = require("telegraf");
const startReplier = require("../startReplier");
const { courseTittleIsFree, addCourse } = require("../bdFunctions");

module.exports = new Scenes.WizardScene("addCourseScene", 
    ctx => {
        ctx.reply("Введите название нового курса", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}})
        return ctx.wizard.next()
    },
    async ctx => {
        if(ctx.callbackQuery?.data == "backToSceneStart") return await ctx.scene.enter("manageCourseScene")
        if(ctx.callbackQuery) return
        if(!await courseTittleIsFree(ctx.message.text)) return await ctx.reply(`Курс с названием ${ctx.message.text} уже существует. Введите другое название`)
        await addCourse(ctx.message.text)
        await ctx.reply(`Курс с названием "${ctx.message.text}" успешно добавлен`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToSceneStart"}]]}})
    }
)