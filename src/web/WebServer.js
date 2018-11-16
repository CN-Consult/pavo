/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");
const express = require("express");
const nunjucks = require("nunjucks");


// Controllers
const IndexController = require(__dirname + "/Controller/IndexController");
const HaltTabSwitchLoopsController = require(__dirname + "/Controller/APIs/HaltTabSwitchLoopsController");
const ResumeTabSwitchLoopsController = require(__dirname + "/Controller/APIs/ResumeTabSwitchLoopsController");

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

        /** @type {express} httpServer */
        this.httpServer = express();

        // Configure the template engine for express
        nunjucks.configure(__dirname + "/resources/templates", {
            autoescape: true,
            express: this.httpServer
        });
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

        // Initialize the url routes
        this.initializeRoutes();

        /*
         * The web server is listening on port 8080 because ports below 1024 require to run the app with root access
         * @see: https://stackoverflow.com/a/9166332
         */
        this.httpServer.listen(8080);
    }

    /**
     * Initializes the controllers for the different routes.
     *
     * @param {PavoApi} _pavoApi The api for the pavo app that can be configured with this web server
     */
    initializeControllers(_pavoApi)
    {
        this.controllers = {
            "index": new IndexController(_pavoApi),
            "haltTabSwitchLoops": new HaltTabSwitchLoopsController(_pavoApi),
            "resumeTabSwitchLoops": new ResumeTabSwitchLoopsController(_pavoApi)
        };
    }

    /**
     * Initializes the routes (The responses that a web site visitor gets when trying to open a specific route on the server).
     */
    initializeRoutes()
    {
        // Root
        this.httpServer.get("/", this.getControllerResponse("index"));

        // CSS files
        this.httpServer.use("/css", express.static(__dirname + "/resources/css"));

        // Javascript files
        this.httpServer.use("/javascript", express.static(__dirname + "/resources/javascript"));

        // External libraries
        this.httpServer.use("/bootstrap", express.static(__dirname + "/../../node_modules/bootstrap/dist"));
        this.httpServer.use("/jquery", express.static(__dirname + "/../../node_modules/jquery/dist"));
        this.httpServer.use("/jquery-ui", express.static(__dirname + "/../../node_modules/jquery-ui-dist"));
        this.httpServer.use("/font-awesome", express.static(__dirname + "/../../node_modules/@fortawesome/fontawesome-free"));

        // APIs
        this.httpServer.get("/api/haltTabSwitchLoops", this.getControllerResponse("haltTabSwitchLoops"));
        this.httpServer.get("/api/resumeTabSwitchLoops", this.getControllerResponse("resumeTabSwitchLoops"));
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
