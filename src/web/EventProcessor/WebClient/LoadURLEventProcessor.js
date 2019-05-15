/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WebClientEventProcessor = require(__dirname + "/../WebClientEventProcessor");
const url = require("url");

/**
 * Handles the "loadUrl" events.
 */
class LoadURLEventProcessor extends WebClientEventProcessor
{
    /**
     * LoadURLEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "loadURL" ]);
    }


    // Public Methods

    /**
     * Processes one of the events that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {*} _data The data that was sent with the event
     */
    processWebClientEvent(_eventName, _data)
    {
        let windowIds = _data.windowIds;
        if(! Array.isArray(windowIds)) this.socket.emit("error", { message: "loadURL expects a list of window ids" });

        // Convert window ids to integers
        windowIds = windowIds.map(function(_windowIdString){
            return parseInt(_windowIdString);
        });

        let targetUrl = this.getTargetUrl(_data.url);

        let self = this;
        windowIds.forEach(function(_windowId){
            self.pavoApi.loadURLIntoWindow(_windowId, targetUrl).catch(function(_errorMessage){
                self.socket.emit("error", "Konnte URL nicht laden: " + _errorMessage);
            });
        });
    }

    /**
     * Automatically completes and returns the target url.
     *
     * @param {String} _url The url that was requested to be loaded
     *
     * @return {String} The target url
     */
    getTargetUrl(_url)
    {
        let parsedUrl = url.parse(_url, true);

        // Add the https protocol if no protocol is defined
        if (parsedUrl.protocol === null) parsedUrl.protocol = "https";
        parsedUrl.slashes = true;

        return url.format(parsedUrl);
    }
}


module.exports = LoadURLEventProcessor;
