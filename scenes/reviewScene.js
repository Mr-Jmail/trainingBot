const { Scenes } = require("telegraf");
const addReview = require("../addReview");
const startReplier = require("../startReplier");
const { getTrainingsTittle } = require("../bdFunctions");

module.exports = new Scenes.WizardScene("reviewScene", 
    ctx => {
        ctx.scene.session.state.review = { score: "0" }
        ctx.reply("🏋️‍♂️ Поздравляем с завершением тренировки!\nКак вам сегодняшняя тренировка?\nОцените её по шкале от 1 до 5, где 1 - очень плохо, 5 - отлично.\nВаше мнение важно для нас, чтобы улучшать наши тренировки и делать их лучше для Вас! 🌟", {reply_markup: {inline_keyboard: [[{text: "1", callback_data: "1"}], [{text: "2", callback_data: "2"}], [{text: "3", callback_data: "3"}], [{text: "4", callback_data: "4"}], [{text: "5", callback_data: "5"}]]}})
        return ctx.wizard.next()
    },
    ctx => {
        if(!ctx.callbackQuery) return
        if(!["1", "2", "3", "4", "5"].includes(ctx.callbackQuery.data)) return
        ctx.scene.session.state.review.score = ctx.callbackQuery.data
        ctx.reply("Пожалуйста оставьте нам Ваш отзыв.\nВаше мнение важно для нас! 💬🏋️‍♂️", {reply_markup: {inline_keyboard: [[{text: "Не оставлять отзыв", callback_data: "withoutReview"}]]}})
        return ctx.wizard.next()
    },
    async ctx => {
        if(ctx.callbackQuery && ctx.callbackQuery?.data != "withoutReview") return
        var { score } = ctx.scene.session.state.review
        var review = ctx?.message?.text ?? "" // потому что может быть нажата кнопка "Не оставлять отзыв"
        var trainingTittle = await getTrainingsTittle(ctx.scene.session.state.trainingId)
        await addReview([[ctx.from.id, ctx.from.username, trainingTittle, score, review]])
        await ctx.reply("🙏 Спасибо за ваш отзыв!\nВаши слова важны для нас и помогают нам улучшать наши тренировки.\nМы ценим вашу поддержку и надеемся, что вы остаетесь с нами в этом фитнес-путешествии. \nСпасибо за вашу веру в нас! 🌟💪")
        await ctx.scene.leave()
        await startReplier(ctx)
    }
)