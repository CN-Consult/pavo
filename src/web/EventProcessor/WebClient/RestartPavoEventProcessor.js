/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WebClientEventProcessor = require(__dirname + "/../WebClientEventProcessor");

/**
 * Handles the "restartPavo" events.
 */
class RestartPavoEventProcessor extends WebClientEventProcessor
{
    /**
     * RestartPavoEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "restartPavo" ]);
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
        this.pavoApi.restartPavo();
    }
}


module.exports = RestartPavoEventProcessor;
