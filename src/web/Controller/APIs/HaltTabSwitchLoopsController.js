/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseController = require(__dirname + "/../BaseController");

/**
 * Handles the "/api/haltTabSwitchLoops" route.
 */
class HaltTabSwitchLoopsController extends BaseController
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
        let urlParameters = this.getUrlParameters(_request);
        let browserWindowIds = JSON.parse(urlParameters.windows);

        // Convert browser window ids to integers
        browserWindowIds = browserWindowIds.map(function(_browserWindowIdString){
            return parseInt(_browserWindowIdString);
        });

        let haltedTabSwitchLoopWindowIds = this.pavoApi.haltTabSwitchLoopsFor(browserWindowIds);
        if (! Array.isArray(haltedTabSwitchLoopWindowIds)) haltedTabSwitchLoopWindowIds = [];

        _response.writeHead(200, {"Content-Type": "application/json"});
        _response.end(JSON.stringify(haltedTabSwitchLoopWindowIds));
    }
}


module.exports = HaltTabSwitchLoopsController;
