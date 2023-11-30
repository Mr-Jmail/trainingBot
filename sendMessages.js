const each = require("sync-each")

module.exports = async function(messages, ctx, chatId = undefined) {
    chatId ??= ctx.from.id
    return await new Promise(async (resolve, reject) => {
        if(messages.length == 0) {
            await ctx.reply("В тренировке, пока пусто, нужно отправить хотя бы одно сообщение")
            return resolve();
        }
        each(messages, async(message, next) => {
            if(message.medias?.length == 1) {
                var media = message.medias[0]
                if(media.type == "audio") await ctx.telegram.sendAudio(chatId, media.media, { caption: media.caption }).catch(err => reject(err)).finally(() => next())
                else if(media.type == "document") await ctx.telegram.sendDocument(chatId, media.media, { caption: media.caption }).catch(err => reject(err)).finally(() => next())
                else if(media.type == "photo") await ctx.telegram.sendPhoto(chatId, media.media, { caption: media.caption }).catch(err => reject(err)).finally(() => next())
                else if(media.type == "video") await ctx.telegram.sendVideo(chatId, media.media, { caption: media.caption }).catch(err => reject(err)).finally(() => next())
            }
            else if(message.medias?.length > 1) await ctx.telegram.sendMediaGroup(chatId, message.medias).catch(err => reject(err)).finally(() => next())
            else await ctx.telegram.sendMessage(chatId, message.text).catch(err => reject(err)).finally(() => next())
        }, function() {
            resolve()
        })
    })
}