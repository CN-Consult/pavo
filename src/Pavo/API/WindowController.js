/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseApiController = require(__dirname + "/BaseApiController.js");

/**
 * Provides methods to control a Pavo window.
 */
class WindowController extends BaseApiController
{
    /**
     * WindowController constructor.
     *
     * @param {PavoApi} _parentPavoApi The parent pavo API
     */
    constructor(_parentPavoApi)
    {
        super(_parentPavoApi, ["loadURLIntoWindow", "reloadWindow", "showText"]);
    }


    /**
     * Loads a url into a specified window.
     *
     * @param {int} _windowId The id of the window
     * @param {String} _url The url to load into the window
     *
     * @return {Promise} The promise that loads the URL into the specified window
     */
    loadURLIntoWindow(_windowId, _url)
    {
        this.logger.info("Received url load request for window " + _windowId + " with target url \"" + _url + "\"");

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getPageSwitchLoop().halt();
            return window.getPageDisplayer().displayCustomURL(_url);
        }
        else return new Promise(function(_resolve, _reject){
            _reject("No window found with id " + _windowId);
        });
    }

    /**
     * Reloads a specified window.
     *
     * @param {int} _windowId The id of the window
     *
     * @return {Promise} The promise that reloads the specified window
     */
    reloadWindow(_windowId)
    {
        this.logger.info("Received reload window request for window " + _windowId);

        let window = this.getWindows()[_windowId];

        if (window) return window.getPageDisplayer().reloadCurrentPage();
        else
        {
            return new Promise(function(_resolve, _reject){
                _reject("Could not reload window: No window with id '" + _windowId + "' exists")
            });
        }
    }

    /**
     * Shows a custom message inside a window.
     *
     * @param {int} _windowId The window id
     * @param {String} _text The text to show
     *
     * @return {Promise} The promise that shows the text inside the window
     */
    showText(_windowId, _text)
    {
        this.logger.info("Received showText request with text '" + _text + "'");

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getPageSwitchLoop().halt();
            return window.getPageDisplayer().displayText(_text);
        }
        else
        {
            return new Promise(function(_resolve, _reject){
                _reject("Could not show text in window: No window with id '" + _windowId + "' exists");
            });
        }
    }
}


module.exports = WindowController;
