/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const JsonLoader = require(__dirname + "/src/Util/JsonLoader");
const Pavo = require(__dirname + "/src/Pavo/Pavo");
const PavoApi = require(__dirname + "/src/Pavo/PavoApi");
const WebServer = require(__dirname + "/src/web/WebServer");

let jsonLoader = new JsonLoader();
let pavo = new Pavo();
let pavoApi = new PavoApi(pavo);
let webServer = new WebServer();


const log4js = require("log4js");

// Configure the loggers
log4js.configure({
    appenders: {

        /*
         * Must use stdout instead of console to avoid memory leaks
         * @see https://github.com/log4js-node/log4js-node/issues/181
         */
        stdout: { type: "stdout" }

        // TODO: Let pavo create the log files (maybe reduce the log lines)
        /*
        windowManager: { type: "file", filename: __dirname + "/../../log/WindowManager.log" },
        window: { type: "file", filename: __dirname + "/../../log/Window.log" },
        tabDisplayer: { type: "file", filename: __dirname + "/../../log/TabDisplayer.log" },
        tabReloadLoop: { type: "file", filename: __dirname + "/../../log/TabReloadLoop.log" },
        tab: { type: "file", filename: __dirname + "/../../log/Tab.log" },
        autoLogin: { type: "file", filename: __dirname + "/../../log/AutoLogin.log" },
        pavoApi: { type: "file", filename: __dirname + "/../../log/PavoApi.log" }
        */
    },
    categories: {
        default: { appenders: [ "stdout" ], level: "debug" },
        windowManager: { appenders: [ "stdout"/*, "windowManager"*/ ], level: "debug" },
        window: { appenders: [ "stdout"/*, "window"*/ ], level: "debug"},
        tabDisplayer: { appenders: [ "stdout"/*, "tabDisplayer"*/ ], level: "debug" },
        tabReloadLoop: { appenders: [ "stdout"/*, "tabReloadLoop"*/ ], level: "debug" },
        tab: { appenders: [ "stdout"/*, "tab"*/ ], level: "debug" },
        autoLogin: { appenders: [ "stdout"/*, "autoLogin"*/ ], level: "debug" },
        pavoApi: { appenders: ["stdout"/*, "pavoApi"*/ ], level: "debug" }
    }
});

/**
 * Initializes the pavo app.
 */
function initialize()
{
    // Load configuration
    let appConfiguration = jsonLoader.getJson(app.getPath("home") + "/config/config.json");

    // Initialize the pavo app and the web server
    webServer.initialize(pavoApi);
    pavo.initialize(appConfiguration).then(function(){
        webServer.initializeEventListeners();
    });
}

app.on("ready", initialize);
