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

        let numberOfWindows = _windowsConfiguration.length;
        let numberOfInitializedWindows = 0;
        let windowListIndex = 0;

        let self = this;
        return new Promise(function(_resolve){

            _windowsConfiguration.forEach(function(_windowConfiguration){

                // TODO: Initialize windows one by one instead of asynchronous (too lower CPU stress)
                let window = new Window(windowListIndex);
                window.initialize(_windowConfiguration).then(function(){

                    // Add the window to the list of windows
                    self.windows[window.getId()] = window;

                    numberOfInitializedWindows++;
                    if (numberOfInitializedWindows === numberOfWindows)
                    {
                        // TODO: Check whether this timeout can be removed
                        setTimeout(function(){
                            self.reloadSecondaryLoginTabs().then(function(){
                                windowManagerLogger.debug("WindowManager initialized.");
                                _resolve("WindowManager initialized");
                            });
                        }, 1000);
                    }
                });

                windowListIndex++;
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
