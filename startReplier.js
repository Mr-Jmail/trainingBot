const { addUserToBd } = require("./bdFunctions")

module.exports = async function startReplier(ctx) {
    addUserToBd(ctx.from.id)
    ctx.reply("Приветственное сообщение", {reply_markup: {inline_keyboard: [[{text: "Личный тренер", callback_data: "Личный тренер"}, {text: "Начать тренировку", callback_data: "Начать тренировку"}]]}})
}
