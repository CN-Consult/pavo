/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");
const express = require("express");
const glob = require("glob");
const http = require("http");
const minifyHTML = require("express-minify-html");
const nunjucks = require("nunjucks");
const socket = require("socket.io");
const polyfill = require("polyfill-library");

// Controllers
const IndexController = require(__dirname + "/Controller/IndexController");

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
                removeComments: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeEmptyAttributes: true,
                minifyJS: true
            }
        }));

        this.pavoEventProcessors = [];
        this.webClientEventProcessors = [];
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

        let self = this;
        _pavoApi.getParentPavo().on("restart", function(){
            _pavoApi.getParentPavo().once("initialized", function(){
                self.reinitializePavoEventProcessors();
            });
        });

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
     * @private
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
     * @private
     */
    initializeEventProcessors(_pavoApi)
    {
        let self = this;

        // Pavo Event processors
        let pavoEventProcessorFilePaths = glob.sync(__dirname + "/EventProcessor/Pavo/*EventProcessor.js");
        pavoEventProcessorFilePaths.forEach(function(_eventProcessorPath){
            let eventProcessor = require(_eventProcessorPath);
            self.pavoEventProcessors.push(new eventProcessor(self.socket, _pavoApi));
        });

        // Web client event processors
        let webClientEventProcessorFilePaths = glob.sync(__dirname + "/EventProcessor/WebClient/*EventProcessor.js");
        webClientEventProcessorFilePaths.forEach(function(_eventProcessorPath){
            let eventProcessor = require(_eventProcessorPath);
            self.webClientEventProcessors.push(new eventProcessor(self.socket, _pavoApi));
        });
    }

    /**
     * Reinitializes the pavo event processors.
     *
     * @private
     */
    reinitializePavoEventProcessors()
    {
        this.pavoEventProcessors.forEach(function(_eventProcessor){
            _eventProcessor.reinitializeEventListeners();
        });
    }

    /**
     * Initializes the routes (The responses that a web site visitor gets when trying to open a specific route on the server).
     *
     * @private
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
        this.express.use("/json-editor", express.static(__dirname + "/../../node_modules/@json-editor/json-editor/dist"));

        this.express.get("/polyfill.io", function(_request, _response){
            polyfill.getPolyfillString({
                minify: true,
                features: {
                    "Promise": {},
                    "Array.prototype.includes": {}
                }
            }).then(function(_result){
                _response.end(_result);
            });
        });
    }

    /**
     * Initializes the event listeners for the socket events and the pavo events.
     *
     * @private
     */
    initializeEventListeners()
    {
        // Initialize the pavo event listeners once
        this.pavoEventProcessors.forEach(function(_pavoEventProcessor){
            _pavoEventProcessor.initializeEventListeners();
        });

        // Initialize the web client event listeners per connect
        let self = this;
        this.socket.on("connect", function(_socket){

            self.webClientEventProcessors.forEach(function(_webClientEventProcessors){
               _webClientEventProcessors.initializeEventListeners(_socket);
            });

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
     * @return {function} The controllers response function
     * @private
     */
    getControllerResponse(_index)
    {
        let controller = this.controllers[_index];

        return controller.respond.bind(controller);
    }
}


module.exports = WebServer;
