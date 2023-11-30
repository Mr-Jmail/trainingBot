module.exports = function(courses, callbackBeforeTittle) {
    return courses.map(course => {
        return [{
            text: course.tittle,
            callback_data: `${callbackBeforeTittle}${course.id}`
        }]
    })
}