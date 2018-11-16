/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const nunjucks = require("nunjucks");
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
        let windowsStatus = this.pavoApi.getWindowsStatus();
        if (! Array.isArray(windowsStatus)) windowsStatus = [];

        _response.writeHead(200, {"Content-Type": "text/html"});
        _response.end(
            nunjucks.render("index.njk", {
                dashboardName: os.hostname(),
                windowsStatus: windowsStatus
            })
        );
    }
}


module.exports = IndexController;
