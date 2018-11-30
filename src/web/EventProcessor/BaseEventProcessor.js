/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Parent class for event processors.
 * Event processors can handle a specified list of events and emit results with a socket.
 */
class BaseEventProcessor
{
    /**
     * BaseEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        this.socket = _socket;
        this.pavoApi = _pavoApi;
    }


    // Public Methods

    /**
     * Initializes the event listeners of this event processor.
     */
    initializeEventListeners()
    {
    }

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {*} _data The data that was sent with the event
     */
    processEvent(_eventName, _data)
    {
    }
}


/**
 * The socket which is used to send result data to the clients
 *
 * @type {Server} socket
 */
BaseEventProcessor.socket = null;

/**
 * The pavo api
 *
 * @type {PavoApi} pavoApi
 */
BaseEventProcessor.pavoApi = null;


module.exports = BaseEventProcessor;
