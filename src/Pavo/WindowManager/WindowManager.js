/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const Window = require(__dirname + "/Window/Window");
const windowManagerLogger = require("log4js").getLogger("windowManager");

/**
 * Creates and stores the pavo windows.
 */
class WindowManager
{
    /**
     * WindowManager constructor.
     */
    constructor()
    {
        this.windows = [];
    }


    // Getters and setters

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
     * @return {Promise} The promise that initializes the windows
     */
    initialize(_windowsConfiguration)
    {
        windowManagerLogger.debug("Initializing WindowManager.");

        return this.initializeWindows(_windowsConfiguration);
    }

    /**
     * Initializes the windows according to the window configuration.
     * The windows are initialized one by one in order to lower the CPU stress.
     * A nice side effect is that automatic logins are automatically applied to all windows that are initialized after the window with the initial login tab.
     *
     * @param {Object} _windowsConfiguration The window configuration
     * @param {int} _currentWindowIndex The current window index (Default: 0)
     *
     * @returns {Promise} The promise that initializes the windows
     */
    initializeWindows(_windowsConfiguration, _currentWindowIndex = 0)
    {
        let self = this;
        return new Promise(function(_resolve){

            let window = new Window(_currentWindowIndex);
            window.initialize(_windowsConfiguration[_currentWindowIndex]).then(function() {

                // Add the window to the list of windows
                self.windows[window.getId()] = window;

                if (_currentWindowIndex === _windowsConfiguration.length - 1)
                {
                    self.reloadSecondaryLoginTabs().then(function(){
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
     * Reloads the tabs that need a login that was already done in another tab.
     *
     * @return {Promise} The promise that reloads the tabs that need a login that was already done in another tab
     */
    reloadSecondaryLoginTabs()
    {
        let self = this;
        let numberOfWindows = this.windows.length;
        let numberOfReloadedWindows = 0;

        return new Promise(function(_resolve){
            self.windows.forEach(
                /** @param {Window} _window */
                function(_window){
                    _window.reloadSecondaryLoginTabs().then(function(){

                        numberOfReloadedWindows++;
                        if (numberOfReloadedWindows === numberOfWindows)
                        {
                            _resolve("Secondary login tabs reloaded");
                        }
                    });
                }
            );
        });
    }

    /**
     * Starts the tab switch loop for each window.
     *
     * @returns {Promise} The promise that starts the tab switch loop for each window
     */
    startTabSwitchLoops()
    {
        let numberOfWindows = this.windows.length;
        let numberOfStartedTabSwitchLoops = 0;

        let self = this;
        return new Promise(function(_resolve){

            self.windows.forEach(
                /** @param {Window} _window */
                function(_window){

                    _window.startTabSwitchLoop().then(function(){

                        numberOfStartedTabSwitchLoops++;
                        if (numberOfStartedTabSwitchLoops === numberOfWindows)
                        {
                            _resolve("Tab switch loops started");
                        }
                    });
                }
            );
        });
    }
}


/**
 * The list of windows
 *
 * @type {Window[]} windows
 */
WindowManager.windows = null;


module.exports = WindowManager;
