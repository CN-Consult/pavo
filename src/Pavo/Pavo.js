/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WindowManager = require(__dirname + "/WindowManager/WindowManager");

/**
 * Wrapper class for the Pavo app.
 *
 * @property {boolean} isInitialized Defines whether the initialize() method was completed at least once
 * @property {Object} loadedConfiguration The currently loaded pavo configuration
 * @property {WindowManager} windowManager The window manager that creates and manages the pavo windows based on the loaded configuration
 */
class Pavo
{
    /**
     * Pavo constructor.
     */
    constructor()
    {
        this.isInitialized = false;
    }


    // Getters and Setters

    /**
     * Returns whether the initialize() method was completed at least once.
     *
     * @returns {boolean} True if the initialize() method was completed at least once, false otherwise
     */
    getIsInitialized()
    {
        return this.isInitialized;
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
     * Initializes the pavo app with a specific app configuration.
     *
     * @param {Object} _pavoConfiguration The pavo configuration
     *
     * @return {Promise} The promise that initializes the pavo app
     */
    initialize(_pavoConfiguration)
    {
        this.loadedConfiguration = _pavoConfiguration;

        // Initialize the window manager
        this.windowManager = new WindowManager();

        let self = this;
        return new Promise(function(_resolve){
            self.windowManager.initialize(self.loadedConfiguration.windows).then(function(){
                self.windowManager.startTabSwitchLoops().then(function(){
                    self.isInitialized = true;
                    _resolve("Pavo initialized.");
                });
            });
        });
    }
}


module.exports = Pavo;
