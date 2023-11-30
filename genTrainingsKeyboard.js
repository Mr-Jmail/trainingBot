module.exports = function(trainingsArr, page, callbackBeforeTittle, callbackBeforePreviousAndNext = "") {
    const trainingsOnPage = 95
    const inline_keyboard = []
    console.log(trainingsArr.length);
    var lastPage = trainingsArr < trainingsOnPage || trainingsArr.length <= trainingsOnPage * page
    for (var i = (page - 1) * trainingsOnPage; i < trainingsArr.length && i < page * trainingsOnPage; i++) {
        var callback_data = `${callbackBeforeTittle}${trainingsArr[i].id}`
        inline_keyboard.push([{text: trainingsArr[i].tittle, callback_data}])
        console.log(callback_data)
    }
    inline_keyboard.push([{text: "<", callback_data: `${callbackBeforePreviousAndNext}previous${page - 1}`}, {text: lastPage ? "Посл. стр-ца" :  `Страница ${page}`, callback_data: "null"} ,{text: ">", callback_data: `${callbackBeforePreviousAndNext}next${lastPage ? 0 : (page + 1 )}`}])
    return inline_keyboard
} 