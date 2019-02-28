/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const JsonLoader = require(__dirname + "/../Util/JsonLoader");
const PavoApi = require(__dirname + "/PavoApi");
const WindowManager = require(__dirname + "/WindowManager/WindowManager");

/**
 * Wrapper class for the pavo app.
 *
 * @property {int} startTimestamp The timestamp when the initialize method was completed
 * @property {String} configDirectoryPath The path to the config directory from which the config.json, css and js files will be loaded
 * @property {Object} loadedConfiguration The currently loaded configuration
 * @property {WindowManager} windowManager The window manager that creates and manages the windows based on the loaded configuration
 * @property {PavoApi} api The pavo api
 */
class Pavo
{
    /**
     * Pavo constructor.
     */
    constructor()
    {
        this.isInitialized = false;
        this.api = new PavoApi(this);
    }


    // Getters and Setters

    /**
     * Returns the start timestamp.
     *
     * @return {int} The start timestamp
     */
    getStartTimestamp()
    {
        return this.startTimestamp;
    }

    /**
     * Returns the config directory path.
     *
     * @return {String} The config directory path
     */
    getConfigDirectoryPath()
    {
        return this.configDirectoryPath;
    }

    /**
     * Returns the API for this pavo.
     *
     * @return {PavoApi} The API for this pavo
     */
    getApi()
    {
        return this.api;
    }

    /**
     * Returns the currently loaded configuration.
     *
     * @returns {Object} The currently loaded configuration
     */
    getLoadedConfiguration()
    {
        return this.loadedConfiguration;
    }

    /**
     * Returns the window manager.
     *
     * @return {WindowManager} The window manager
     */
    getWindowManager()
    {
        return this.windowManager;
    }


    // Public Methods

    /**
     * Returns whether the initialize() method was completed at least once.
     *
     * @return {int|null} The start timestamp if the initialize() method was completed at least once, null otherwise
     */
    getIsInitialized()
    {
        return this.startTimestamp;
    }

    /**
     * Initializes the pavo app with a specific app configuration.
     *
     * @param {String} _configDirectoryPath The path to the config directory
     *
     * @return {Promise} The promise that initializes the pavo app
     */
    initialize(_configDirectoryPath)
    {
        this.configDirectoryPath = _configDirectoryPath;
        this.loadedConfiguration = JsonLoader.getJson(this.configDirectoryPath + "/config.json");

        // Initialize the window manager
        this.windowManager = new WindowManager(this);

        let self = this;
        return new Promise(function(_resolve){
            self.windowManager.initialize(self.loadedConfiguration.windows).then(function(){
                self.windowManager.startPageSwitchLoops().then(function(){
                    self.startTimestamp = Date.now();
                    _resolve("Pavo initialized.");
                });
            });
        });
    }
}


module.exports = Pavo;
