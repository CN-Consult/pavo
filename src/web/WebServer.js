/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");
const express = require("express");
const http = require("http");
const minifyHTML = require("express-minify-html");
const nunjucks = require("nunjucks");
const socket = require("socket.io");

// Controllers
const IndexController = require(__dirname + "/Controller/IndexController");

// Event Processors
const HaltTabSwitchLoopsEventProcessor = require(__dirname + "/EventProcessor/WebClient/HaltTabSwitchLoopsEventProcessor");
const ResumeTabSwitchLoopsEventProcessor = require(__dirname + "/EventProcessor//WebClient/ResumeTabSwitchLoopsEventProcessor");
const LoadURLEventProcessor = require(__dirname + "/EventProcessor/WebClient/LoadURLEventProcessor");
const ReloadWindowsEventProcessor = require(__dirname + "/EventProcessor/WebClient/ReloadWindowsEventProcessor");
const SwitchToPageEventProcessor = require(__dirname + "/EventProcessor/WebClient/SwitchToPageEventProcessor");
const GetLoadedConfigurationEventProcessor = require(__dirname + "/EventProcessor/WebClient/GetLoadedConfigurationEventProcessor");
const EditConfigurationEventProcessor = require(__dirname + "/EventProcessor/WebClient/EditConfigurationEventProcessor");

const TabSwitchEventProcessor = require(__dirname + "/EventProcessor/Pavo/TabSwitchEventProcessor");

/**
 * Handles creating of a web server which provides the web ui.
 */
class WebServer extends EventEmitter
{
    /**
     * WebServer constructor.
     */
    constructor()
    {
        super();

        /** @type {express} express */
        this.express = express();
        this.httpServer = http.Server(this.express);

        /** @type {http.Server} socket */
        this.socket = socket(this.httpServer);

        // Configure the template engine for express
        nunjucks.configure(__dirname + "/resources/templates", {
            autoescape: true,
            express: this.express
        });

        this.express.use(minifyHTML({
            override:      true,
            exception_url: false,
            htmlMinifier: {
                removeComments:            true,
                collapseWhitespace:        true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes:     true,
                removeEmptyAttributes:     true,
                minifyJS:                  true
            }
        }));
    }


    // Public Methods

    /**
     * Initializes the web server.
     *
     * @param {PavoApi} _pavoApi The pavo api
     */
    initialize(_pavoApi)
    {
        // Initialize the controllers for the url routes
        this.initializeControllers(_pavoApi);

        // Initialize the event processors for the socket events
        this.initializeEventProcessors(_pavoApi);

        // Initialize the url routes
        this.initializeRoutes();

        /*
         * The web server is listening on port 8080 because ports below 1024 require to run the app with root access
         * @see: https://stackoverflow.com/a/9166332
         */
        this.httpServer.listen(8080);
    }


    // Private Methods

    /**
     * Initializes the controllers for the different routes.
     *
     * @param {PavoApi} _pavoApi The api for the pavo app that can be configured with this web server
     */
    initializeControllers(_pavoApi)
    {
        this.controllers = {
            "index": new IndexController(_pavoApi)
        };
    }

    /**
     * Initializes the event processors for the socket events.
     *
     * @param {PavoApi} _pavoApi The pavo api
     */
    initializeEventProcessors(_pavoApi)
    {
        this.webClientEventProcessors = {
            "haltTabSwitchLoops": new HaltTabSwitchLoopsEventProcessor(this.socket, _pavoApi),
            "resumeTabSwitchLoops": new ResumeTabSwitchLoopsEventProcessor(this.socket, _pavoApi),
            "loadUrl": new LoadURLEventProcessor(this.socket, _pavoApi),
            "reloadWindows": new ReloadWindowsEventProcessor(this.socket, _pavoApi),
            "switchToPage": new SwitchToPageEventProcessor(this.socket, _pavoApi),
            "getLoadedConfiguration": new GetLoadedConfigurationEventProcessor(this.socket, _pavoApi),
            "editConfiguration": new EditConfigurationEventProcessor(this.socket, _pavoApi)
        };

        this.pavoEventProcessors = {
            "tabSwitch": new TabSwitchEventProcessor(this.socket, _pavoApi)
        };
    }

    /**
     * Initializes the routes (The responses that a web site visitor gets when trying to open a specific route on the server).
     */
    initializeRoutes()
    {
        // Root
        this.express.get("/", this.getControllerResponse("index"));

        // CSS files
        this.express.use("/css", express.static(__dirname + "/resources/css"));

        // Javascript files
        this.express.use("/javascript", express.static(__dirname + "/resources/javascript"));

        // External libraries
        this.express.use("/bootstrap", express.static(__dirname + "/../../node_modules/bootstrap/dist"));
        this.express.use("/jquery", express.static(__dirname + "/../../node_modules/jquery/dist"));
        this.express.use("/jquery-ui", express.static(__dirname + "/../../node_modules/jquery-ui-dist"));
        this.express.use("/font-awesome", express.static(__dirname + "/../../node_modules/@fortawesome/fontawesome-free"));
        this.express.use("/socket.io", express.static(__dirname + "/../../node_modules/socket.io-client/dist"));
        this.express.use("/json-editor", express.static(__dirname + "/../../node_modules/json-editor/dist"));
    }

    /**
     * Initializes the event listeners for the socket events and the pavo events.
     */
    initializeEventListeners()
    {
        // Initialize the pavo event listeners once
        for (let eventProcessorId in (this.pavoEventProcessors))
        {
            if (this.pavoEventProcessors.hasOwnProperty(eventProcessorId))
            {
                this.pavoEventProcessors[eventProcessorId].initializeEventListeners();
            }
        }

        // Initialize the web client event listeners per connect
        let self = this;
        this.socket.on("connect", function(_socket){

            for (let eventProcessorId in (self.webClientEventProcessors))
            {
                if (self.webClientEventProcessors.hasOwnProperty(eventProcessorId))
                {
                    self.webClientEventProcessors[eventProcessorId].initializeEventListeners(_socket);
                }
            }

            _socket.on("disconnect", function(){
                _socket.removeAllListeners();
                _socket.disconnect();
            });
        });
    }

    /**
     * Returns a controllers response method.
     *
     * @param {string} _index The controller index in the controllers list
     *
     * @returns {function} The controllers response function
     */
    getControllerResponse(_index)
    {
        let controller = this.controllers[_index];

        return controller.respond.bind(controller);
    }
}


module.exports = WebServer;
