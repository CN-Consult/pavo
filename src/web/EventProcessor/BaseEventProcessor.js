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
     * @param {Object} _object The object that emitted the event
     * @param {String} _eventName The name of the event
     * @param {*} _data The data that was sent with the event
     */
    processEvent(_object, _eventName, _data)
    {
    }


    // Protected Methods

    /**
     * Initializes event listeners for a specified object.
     * That object must be an EventEmitter.
     *
     * @param {Object} _object The object
     * @param {string[]} _eventNames The event names to listen for
     */
    initializeEventListenersFor(_object, _eventNames)
    {
        let self = this;
        _eventNames.forEach(function(_eventName){
            _object.on(_eventName, function(_data){
                self.processEvent(_object, _eventName, _data)
            });
        });
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
