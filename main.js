/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const JsonLoader = require(__dirname + "/src/Util/JsonLoader");
const Pavo = require(__dirname + "/src/Pavo/Pavo");
let jsonLoader = new JsonLoader();
let pavo = new Pavo();
const log4js = require("log4js");

// Configure the loggers
log4js.configure({
    appenders: {
        console: { type: "console" },

        // TODO: Let pavo create the log files (maybe reduce the log lines)
        /*
        windowManager: { type: "file", filename: __dirname + "/../../log/WindowManager.log" },
        window: { type: "file", filename: __dirname + "/../../log/Window.log" },
        tabDisplayer: { type: "file", filename: __dirname + "/../../log/TabDisplayer.log" },
        tab: { type: "file", filename: __dirname + "/../../log/Tab.log" },
        autoLogin: { type: "file", filename: __dirname + "/../../log/AutoLogin.log" },
        */
    },
    categories: {
        default: { appenders: [ "console" ], level: "debug" },
        windowManager: { appenders: [ "console"/*, "windowManager"*/ ], level: "debug" },
        window: { appenders: [ "console"/*, "window"*/ ], level: "debug"},
        tabDisplayer: { appenders: [ "console"/*, "tabDisplayer"*/ ], level: "debug" },
        tab: { appenders: [ "console"/*, "tab"*/ ], level: "debug" },
        autoLogin: { appenders: [ "console"/*, "autoLogin"*/ ], level: "debug" },
    }
});

/**
 * Initializes the pavo app.
 */
function initialize()
{
    // Load configuration
    let appConfiguration = jsonLoader.getJson(app.getPath("home") + "/config/config.json");

    pavo.initialize(appConfiguration);
}

app.on("ready", initialize);
