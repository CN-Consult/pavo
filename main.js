/**
 * @file Starts the pavo app and a web server that provides an easy way to control the pavo app
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const Pavo = require(__dirname + "/src/Pavo/Pavo");
const WebServer = require(__dirname + "/src/web/WebServer");
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
        pageDisplayer: { type: "file", filename: __dirname + "/../../log/PageDisplayer.log" },
        pageReloadLoop: { type: "file", filename: __dirname + "/../../log/PageReloadLoop.log" },
        page: { type: "file", filename: __dirname + "/../../log/Page.log" },
        autoLogin: { type: "file", filename: __dirname + "/../../log/AutoLogin.log" },
        pavoApi: { type: "file", filename: __dirname + "/../../log/PavoApi.log" }
        */
    },
    categories: {
        default: { appenders: [ "stdout" ], level: "debug" },
        windowManager: { appenders: [ "stdout"/*, "windowManager"*/ ], level: "debug" },
        window: { appenders: [ "stdout"/*, "window"*/ ], level: "debug"},
        pageDisplayer: { appenders: [ "stdout"/*, "pageDisplayer"*/ ], level: "debug" },
        pageReloadLoop: { appenders: [ "stdout"/*, "pageReloadLoop"*/ ], level: "debug" },
        page: { appenders: [ "stdout"/*, "page"*/ ], level: "debug" },
        autoLogin: { appenders: [ "stdout"/*, "autoLogin"*/ ], level: "debug" },
        pavoApi: { appenders: ["stdout"/*, "pavoApi"*/ ], level: "debug" }
    }
});


let pavo = new Pavo();
let webServer = new WebServer();
const appStartTime = new Date();

let globalInterval = setInterval(() => {
    const runtime = formatUptime(process.uptime());
    const mem = process.memoryUsage();
    console.log('Pavo Memory usage check');
    console.log('-----------------------');
    console.log('  Start time: ' + appStartTime);
    console.log('  Uptime = ' + runtime);
    console.log('  RSS: ' + (Math.ceil(mem.rss/1024)).toLocaleString('de') + ' KB');
    console.log('  Heap used: ' + (Math.ceil(mem.heapUsed/1024)).toLocaleString('de') + 'KB');
    console.log('  Heap total: ' + (Math.ceil(mem.heapTotal/1024)).toLocaleString('de') + ' KB');
    console.log('  External: ' + Math.ceil((mem.external/1024)).toLocaleString('de') + ' KB');
}, 600000);

process.on('warning', e => console.warn(e.stack));

/**
 * Formats the uptime into a human-readable format.
 * @param seconds
 * @returns {string}
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    seconds = Math.round(seconds);

    return days.toString().padStart(2, '0') + 'd ' +
        hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ':' +
        seconds.toString().padStart(2, '0');
}

/**
 * Initializes the pavo app.
 */
function initialize()
{
    // Initialize the pavo app and the web server
    webServer.initialize(pavo.getApi());
    pavo.initialize(app.getPath("home") + "/config").then(function(){
        webServer.initializeEventListeners();
    });
}

pavo.on("restart", function(){

    /*
     * The electron app will quit when all BrowserWindow's are closed
     * This is the case during a pavo restart, therefore one quit attempt is expected and prevented
     */
    app.once("will-quit", function(_event){
        _event.preventDefault();
    });
});

app.on("ready", initialize);
