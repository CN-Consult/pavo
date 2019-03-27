/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const os = require("os");
const BaseController = require(__dirname + "/BaseController");

/**
 * Handles the "/" route.
 */
class IndexController extends BaseController
{
    // Public Methods

    /**
     * Creates the response for a specific request.
     *
     * @param {http.IncomingMessage} _request The request from the user
     * @param {http.ServerResponse} _response The object that can be used to respond to the request
     */
    respond(_request, _response)
    {
        let getWindowsStatusPromise = this.pavoApi.getWindowsStatus();
        let pavoStatus = this.pavoApi.getPavoStatus();

        if (typeof getWindowsStatusPromise === "string")
        {
            getWindowsStatusPromise = new Promise(function(_resolve){
                _resolve(getWindowsStatusPromise);
            });
        }

        getWindowsStatusPromise.then(function(_windowsStatus){
            if (! Array.isArray(_windowsStatus)) _windowsStatus = [];

            _response.render("index.njk", {
                dashboardName: os.hostname(),
                pavoVersionIdentifier: process.env.npm_package_version,
                windowsStatus: _windowsStatus,
                pavoStatus: pavoStatus
            });
        });
    }
}


module.exports = IndexController;
