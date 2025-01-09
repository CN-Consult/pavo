/**
 * @file
 * @version 2.0
 * @copyright 2018-2025 cn-mobility GmbH
 * @author Jens Stahl <jens.stahl@cn-mobility.eu>
 */

const WebClientEventProcessor = require(__dirname + "/../WebClientEventProcessor");

/**
 * Handles the "loadUrl" events.
 */
class LoadCookiesEventProcessor extends WebClientEventProcessor
{
    /**
     * LoadURLEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "getPageCookies" ]);
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
        const windowId = _data.windowId;
        const pageId = _data.pageId;
        this.pavoApi.getPageCookies(windowId, pageId)
            .then((cookies) => {
                this.socket.emit("cookies2Page", {cookies: cookies});
            })
            .catch(()=>{});
    }

}


module.exports = LoadCookiesEventProcessor;
