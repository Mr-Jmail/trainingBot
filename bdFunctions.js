const pool = require("./bdPool");

async function getBdConnection() {
    return await new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if(err) reject(err)
            resolve(conn)
        })
    })
}

async function sendQuery(query, connection = null) {
    return await new Promise(async (resolve, reject) => {
        if(connection == null) connection = await getBdConnection()
        connection.query(query, (err, res) => {
            if(err) reject(err)
            resolve(res)
        })
        connection.release()
    })
}

async function addUserToBd(chatId) {
    sendQuery(`INSERT INTO users (chatId, courses) VALUES ("${chatId}", "[]")`).catch(err => {
        if(err.errno != 1062) console.log(err);
    })
}

async function getUsersForSending(onlyWithTrainingAccess, sendToUsersWithTrainerAccess) {
    var queryString = "SELECT chatId FROM users"
    if(!onlyWithTrainingAccess && sendToUsersWithTrainerAccess) {
        const users = await sendQuery(queryString).catch(err => console.log(err))
        return users.map(user => user.chatId)
    }
    queryString += " WHERE "
    
    if(onlyWithTrainingAccess) queryString += `activeCourseId <> "NULL" `
    if(onlyWithTrainingAccess && !sendToUsersWithTrainerAccess) queryString += "AND "
    if(!sendToUsersWithTrainerAccess) queryString += "canAccessTrainer = 0"

    console.log(queryString);

    const users = await sendQuery(queryString).catch(err => console.log(err))
    return users.map(user => user.chatId)
}

async function getUsersToAddTrainings() {
    var users = await sendQuery(`SELECT * FROM users WHERE activeCourseId <> "NULL"`).catch(err => console.log(err))
    return users.map(user => {
        return {
            chatId: user.chatId,
            activeCourseId: user.activeCourseId,
            courses: JSON.parse(user.courses) ?? [],
            canAccessTrainer: user.canAccessTrainer,
        }
    })
}

async function canAccessTrainer(chatId) {
    var res = await sendQuery(`SELECT chatId from users WHERE chatId = "${chatId}" AND canAccessTrainer = 1`).catch(err => console.log(err))
    return res?.length > 0
}

async function changeTrainerAccess(chatId, giveAccess = 1) {
    const str = `UPDATE users SET canAccessTrainer = ${giveAccess} WHERE chatId = "${chatId}"`
    console.log(str);
    await sendQuery(str).catch(err => console.log(err))
}

async function getActiveCourseId(chatId) {
    var res = await sendQuery(`SELECT activeCourseId from users WHERE chatId = "${chatId}"`).catch(err => console.log(err))
    if(res.length != 0) return res[0]?.activeCourseId
    addUserToBd(chatId)
    return null;
}

async function getUsersCourses(chatId) {
    var courses = (await sendQuery(`SELECT courses from users WHERE chatId = "${chatId}"`).catch(err => console.log(err)))?.[0]
    return JSON.parse(courses?.courses ?? "[]")
}

async function changeActiveCourse(chatId, courseId = undefined) {
    await sendQuery(`UPDATE users SET activeCourseId = ${courseId ??= "NULL"} WHERE chatId = "${chatId}"`).catch(err => console.log(err))
}


async function changeUsersCourses(chatId, newCourses) {
    const str = `UPDATE users SET courses = '${newCourses}' WHERE chatId = "${chatId}"`
    console.log(str)
    await sendQuery(str).catch(err => console.log(err))
}

async function trainingsTittleIsFree(tittle) {
    var trainings = await sendQuery(`SELECT tittle FROM trainings WHERE tittle = "${tittle}"`).catch(err => console.log(err))
    return trainings.length == 0
}

async function addTraining(tittle, messages) {
    await sendQuery(`INSERT INTO trainings (tittle, messages) VALUES ("${tittle}", '${JSON.stringify(messages)}')`).catch(err => console.log(err))
}

async function getUsersTraining(chatId) {
    var activeCourseId = await getActiveCourseId(chatId)
    var res = await sendQuery(`SELECT courses from users WHERE chatId = "${chatId}"`).catch(err => console.log(err))
    var courses = JSON.parse(res?.[0]?.courses ?? [])
    if(courses.length == 0) return null
    var activeCourse = courses.find(course => course.id == activeCourseId)
    return activeCourse.trainings[0]
}

async function getTrainingsTittle(id) {
    var training = (await sendQuery(`SELECT tittle FROM trainings WHERE id = ${id}`).catch(err => console.log(err)))?.[0]
    return training?.tittle ?? ""
}

async function getTrainingsMessages(id) {
    var training = (await sendQuery(`SELECT messages FROM trainings WHERE id = ${id}`).catch(err => console.log(err)))?.[0]
    return JSON.parse(training?.messages ?? "[]")
}

async function getAllTrainings() {
    var trainings = await sendQuery(`SELECT tittle, id FROM trainings`).catch(err => console.log(err))
    return trainings.map(training => {
        return {
            tittle: training.tittle, 
            id: training.id
        }
    })
}

async function deleteTraining(id) {
    await sendQuery(`DELETE FROM trainings WHERE id = ${id}`).catch(err => console.log(err))
}

async function editTraining(id, key, value) {
    await sendQuery(`UPDATE trainings SET ${key} = '${value}' WHERE trainings.id = ${id}`).catch(err => console.log(err))
}

async function userIsAdmin(chatId) {
    var res = await sendQuery(`SELECT chatId from admins WHERE chatId = "${chatId}"`).catch(err => console.log(err))
    console.log(res);
    return res.length != 0
}

async function addAdmin(chatId) {
    var returnValue = { status: 1, message: `Пользователь ${chatId} теперь админ` }
    await sendQuery(`INSERT INTO admins (chatId) VALUES("${chatId}")`).catch(err => {
        if(err.errno == 1062) returnValue = { status: 0, message: `Пользователь ${chatId} уже является админом` }
    })
    return returnValue
}

async function deleteAdmin(chatId) {
    await sendQuery(`DELETE FROM admins WHERE admins.chatId = "${chatId}"`).catch(err => console.log(err))
}

async function courseTittleIsFree(tittle) {
    var trainings = await sendQuery(`SELECT tittle FROM courses WHERE tittle = "${tittle}"`).catch(err => console.log(err))
    return trainings.length == 0
}

async function getAllCourses() {
    var courses = await sendQuery(`SELECT tittle, id FROM courses`).catch(err => console.log(err))
    return courses.map(course => {
        return {
            tittle: course.tittle, 
            id: course.id
        }
    })
}

async function getCoursesWeeks(id) {
    var trainings = await sendQuery(`SELECT weeks FROM courses WHERE id = ${id}`).catch(err => console.log(err))
    var weeks = trainings[0].weeks
    return JSON.parse(weeks ?? "[]")
}

async function getCourseTittle(id) {
    var course = (await sendQuery(`SELECT tittle FROM courses WHERE id = ${id}`).catch(err => console.log(err)))?.[0]
    return course?.tittle ?? ""
}

async function addCourse(tittle) {
    await sendQuery(`INSERT INTO courses (tittle) VALUES ("${tittle}")`).catch(err => console.log(err))
}

async function editCourse(id, key, value) {
    await sendQuery(`UPDATE courses SET ${key} = '${value}' WHERE courses.id = ${id}`).catch(err => console.log(err))
}

async function deleteCourse(id) {
    await sendQuery(`DELETE FROM courses WHERE id = ${id}`).catch(err => console.log(err))
}

async function nasratTrenirovkami() {
    for (var i = 0; i < 100; i++) {
        await addTraining(`training${i}`, [{"medias": [{"type": "photo","media": "AgACAgIAAxkBAAIMymVccFlurooJlncQgwb3dMBFCkAYAALezDEbhMDpSg4Y_smbAhdRAQADAgADeAADMwQ","caption": ""}],"mediagroupId": null},{"medias": [    {"type": "photo","media": "AgACAgIAAxkBAAIMtmVccEUUuhdCVdBNd6zBGZQKui27AALdzDEbhMDpSjCAcSAm0xAMAQADAgADeAADMwQ","caption": "уже не коротыш"    }],"mediagroupId": null}])
    }
}

module.exports = { addUserToBd, getUsersForSending, getUsersToAddTrainings, canAccessTrainer, changeTrainerAccess, getActiveCourseId, getUsersCourses, changeActiveCourse, changeUsersCourses, trainingsTittleIsFree, addTraining, getUsersTraining, getTrainingsTittle, getTrainingsMessages, getAllTrainings, deleteTraining, editTraining, userIsAdmin, addAdmin, deleteAdmin, sendQuery, courseTittleIsFree, getAllCourses, getCoursesWeeks, getCourseTittle, addCourse, editCourse, deleteCourse, nasratTrenirovkami }