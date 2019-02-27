/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const Window = require(__dirname + "/Window/Window");
const windowManagerLogger = require("log4js").getLogger("windowManager");

/**
 * Creates and stores the pavo windows.
 *
 * @property {Pavo} parentPavo The parent pavo
 * @property {Window[]} windows The list of windows
 */
class WindowManager
{
    /**
     * WindowManager constructor.
     *
     * @param {Pavo} _parentPavo The parent pavo
     */
    constructor(_parentPavo)
    {
        this.parentPavo = _parentPavo;
        this.windows = [];
    }


    // Getters and setters

    /**
     * Returns the parent pavo.
     *
     * @return {Pavo} The parent pavo
     */
    getParentPavo()
    {
        return this.parentPavo;
    }

    /**
     * Returns the list of windows.
     *
     * @returns {Window[]} The list of windows
     */
    getWindows()
    {
        return this.windows;
    }


    // Public Methods

    /**
     * Initializes the windows that are defined in the currently loaded app configuration.
     *
     * @param {Object} _windowsConfiguration The windows configuration
     *
     * @return {Promise} The promise that initializes the WindowManager
     */
    initialize(_windowsConfiguration)
    {
        windowManagerLogger.debug("Initializing WindowManager.");
        return this.initializeWindows(_windowsConfiguration);
    }

    /**
     * Starts the page switch loop for each window.
     *
     * @returns {Promise} The promise that starts the page switch loop for each window
     */
    startPageSwitchLoops()
    {
        let numberOfWindows = this.windows.length;
        let numberOfStartedPageSwitchLoops = 0;

        let self = this;
        return new Promise(function(_resolve){
            self.windows.forEach(function(_window){
                _window.startPageSwitchLoop().then(function(){
                    numberOfStartedPageSwitchLoops++;
                    if (numberOfStartedPageSwitchLoops === numberOfWindows) _resolve("Page switch loops started");
                });
            });
        });
    }


    // Private Methods

    /**
     * Initializes the windows according to the windows configuration.
     * The windows are initialized one by one in order to lower the CPU stress.
     * A nice side effect is that automatic login's are automatically applied to all pages that are defined after the
     * page with the initial login.
     *
     * @param {Object} _windowsConfiguration The windows configuration
     * @param {int} _currentWindowIndex The current window index (Used by recursive calls)
     *
     * @returns {Promise} The promise that initializes the windows
     * @private
     */
    initializeWindows(_windowsConfiguration, _currentWindowIndex = 0)
    {
        let window = new Window(this, _currentWindowIndex);
        this.windows[window.getId()] = window;

        let self = this;
        return new Promise(function(_resolve){
            window.initialize(_windowsConfiguration[window.getId()]).then(function(){
                if (window.getId() === _windowsConfiguration.length - 1)
                {
                    self.reloadPagesAfterAppInitialization().then(function(){
                        windowManagerLogger.debug("WindowManager initialized.");
                        _resolve("WindowManager initialized");
                    });
                }
                else
                {
                    self.initializeWindows(_windowsConfiguration, ++_currentWindowIndex).then(function(_message){
                        _resolve(_message);
                    });
                }
            });
        });
    }

    /**
     * Reloads the pages that are configured to be reloaded after app initialization.
     *
     * @return {Promise} The promise that reloads the pages that are configured to be reloaded after app initialization
     * @private
     */
    reloadPagesAfterAppInitialization()
    {
        let numberOfWindows = this.windows.length;
        let numberOfReloadedWindows = 0;

        let self = this;
        return new Promise(function(_resolve){
            self.windows.forEach(function(_window){
                _window.reloadPagesAfterAppInitialization().then(function(){
                    numberOfReloadedWindows++;
                    if (numberOfReloadedWindows === numberOfWindows) _resolve("Pages reloaded after app initialization");
                });
            });
        });
    }
}


module.exports = WindowManager;
