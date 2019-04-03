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
        super(_parentPavoApi, ["loadURLIntoWindow", "reloadWindow"]);
    }


    /**
     * Loads a url into a specified window.
     *
     * @param {int} _windowId The id of the window
     * @param {String} _url The url to load into the window
     */
    loadURLIntoWindow(_windowId, _url)
    {
        this.logger.info("Received url load request for window " + _windowId + " with target url \"" + _url + "\"");

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getPageSwitchLoop().halt();
            window.getPageDisplayer().displayCustomURL(_url);
        }
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
}


module.exports = WindowController;
