module.exports = async function(ctx) {
    if(ctx.callbackQuery?.data) return console.log("В addMessage.js пришла callbackQuery.data: " + ctx.callbackQuery.data + ". Ее тут не должно быть")
    if(ctx.message.text) ctx.scene.session.state.messages.push({ text: ctx.message.text })
    else if(ctx.message.media_group_id || ctx.message.audio || ctx.message.document || ctx.message.photo || ctx.message.video) {
        var typeOfMedia = ctx.message.audio ? "audio" : ctx.message.document ? "document" : ctx.message.photo ? "photo" : "video"
        var fileId = typeOfMedia == "photo" ? ctx.message[typeOfMedia].pop().file_id : ctx.message[typeOfMedia].file_id
        var media = { type: typeOfMedia, media: fileId, caption: ctx.message.caption ?? "" }
        pushMediaGroup(ctx, media, ctx.message.media_group_id)
    }
}

function pushMediaGroup(ctx, media, mediagroupId = null) {
    if(ctx.scene.session.state.messages[ctx.scene.session.state.messages.length - 1]?.medias && mediagroupId != null && ctx.scene.session.state.messages[ctx.scene.session.state.messages.length - 1].mediagroupId == mediagroupId) ctx.scene.session.state.messages[ctx.scene.session.state.messages.length - 1].medias.push(media)
    else ctx.scene.session.state.messages.push({ medias: [media], mediagroupId })
}