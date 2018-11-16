/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseController = require(__dirname + "/../BaseController");

/**
 * Handles the "/api/resumeTabSwitchLoops" route.
 */
class ResumeTabSwitchLoopsController extends BaseController
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

        this.pavoApi.resumeTabSwitchLoopsFor(browserWindowIds).then(function(_resumedTabSwitchLoopWindowIds){

            let resumedTabSwitchLoopWindowIds = [];
            if (Array.isArray(_resumedTabSwitchLoopWindowIds)) resumedTabSwitchLoopWindowIds = _resumedTabSwitchLoopWindowIds;

            _response.writeHead(200, {"Content-Type": "application/json"});
            _response.end(JSON.stringify(resumedTabSwitchLoopWindowIds));
        });
    }
}


module.exports = ResumeTabSwitchLoopsController;
