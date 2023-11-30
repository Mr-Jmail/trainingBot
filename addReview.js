const path = require("path");
require('dotenv').config({path: path.join(__dirname, ".env")})
var { google } = require("googleapis")
var spreadsheetId = process.env.spreadsheetId
/*
авторизация в гугл таблицах инструкция: 
1) заходим на https://console.cloud.google.com
2) нажимаем на три полоски слева сверху => APIs & Services => Enabled APIs & services => сверху ENABLE APIS AND SERVICES
3) в поиске пишем google drive => первое => enable; google sheets => первое => enable
4) нажимаем на три полоски слева сверху => APIs & Services => credentials => CREATE CREDENTIALS => Service account => заполняем первое поле => done
5) снизу находим только что созданные service account => нажимаем на карандашик слева => keys (сверху) => add key => create new key => json => create
6) скачавшийся файлик переименовываем в credentials.json и кладем в папку проекта
7) заходим в credentials.json и копируем оттуда пункт "client_email", даем ему доступ редактора в гугл таблице
8) заходим в нашу гугл таблицу и копируем id - это набор символов после "/d/" и до "/edit#"
*/

function google_auth() {
    var auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "credentials.json"),
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })
    
    const client = auth.getClient()
    const googleSheets = google.sheets({version: "v4", auth: client})
    return {googleSheets, auth}
}


module.exports = async function (values) {
    var { googleSheets, auth } = google_auth()
    await googleSheets.spreadsheets.values.append({
        auth, 
        spreadsheetId,
        range: "Лист1",
        valueInputOption: "RAW",
        requestBody: {values}
    })
}

