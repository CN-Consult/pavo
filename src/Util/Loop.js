/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");

/**
 * Base class for loops.
 */
class Loop extends EventEmitter
{
    /**
     * Loop constructor.
     */
    constructor()
    {
        super();

        this.isActive = false;

        // Must use a interval like a timeout because timeouts can not be cleared properly
        this.nextCycleTimeout = null;
        this.nextCycleTimeoutStartTimeStamp = null;

        this.cycleTime = 0;
        this.remainingCycleTime = null;
    }


    // Getters and Setters

    /**
     * Returns whether this loop is currently active.
     *
     * @return {boolean} True if this loop is currently active, false otherwise
     */
    getIsActive()
    {
        return this.isActive;
    }

    /**
     * Calculates the remaining milliseconds until the cycle.
     *
     * @return {int} The seconds until the next cycle
     */
    calculateRemainingCycleTime()
    {
        if (this.isActive && this.nextCycleTimeoutStartTimeStamp !== null) return this.remainingCycleTime - (Date.now() - this.nextCycleTimeoutStartTimeStamp);
        else return this.remainingCycleTime;
    }


    // Public Methods

    /**
     * Initializes the loop.
     *
     * @param {int} _cycleTime The time in milliseconds between each cycle
     */
    init(_cycleTime)
    {
        this.cycleTime = _cycleTime;
        if (! this.isActive && this.remainingCycleTime !== null)
        { // The loop is not active and it's not the first init call, this is necessary for manual page switches
            this.remainingCycleTime = this.cycleTime;
        }
    }

    /**
     * Starts the loop.
     *
     * @return {Promise} The promise that starts the loop
     */
    start()
    {
        let self = this;

        if (this.cycleTime <= 0)
        {
            return new Promise(function(_resolve, _reject){
                _reject("Invalid cycle time specified (" + self.cycleTime + " milliseconds)");
            });
        }

        if (this.isActive) this.stop();

        return new Promise(function(_resolve){

            self.onLoopStart();
            self.continue(true).then(function(){
                _resolve("Tab switch loop started");
            });
        });
    }

    /**
     * Continues the loop if it is currently not running.
     *
     * @param {boolean} _isLoopStart If true the onLoopContinue() hook will not be called
     *
     * @return {Promise} The promise that continues the loop
     */
    continue(_isLoopStart = false)
    {
        let cycle = this.cycle.bind(this);
        let self = this;
        return new Promise(function(_resolve){

            if (self.isActive) _resolve("No continue necessary, loop already running");
            else
            {
                let onLoopContinuePromise = new Promise(function(_resolve){
                    if (_isLoopStart) _resolve("No onLoopContinue call necessary");
                    else
                    {
                        self.onLoopContinue().then(function(){
                            _resolve("onLoopContinue call finished");
                        });
                    }
                });

                onLoopContinuePromise.then(function(){
                    self.isActive = true;
                    cycle();
                    _resolve("Loop continued");
                });
            }
        });
    }

    /**
     * The cycle method which will be called every <x> milliseconds.
     */
    cycle()
    {
        // Clear the interval of the previous cycle
        clearInterval(this.nextCycleTimeout);

        let cycle= this.cycle.bind(this);
        let onCycle = this.onCycle.bind(this);
        let self = this;

        let waitForPreviousCycleFinish = new Promise(function(_resolve){
            if (self.remainingCycleTime > 0)
            {
                self.nextCycleTimeoutStartTimeStamp = Date.now();
                self.nextCycleTimeout = setInterval(function(){
                    _resolve("Previous cycle finished");
                }, self.remainingCycleTime);
            }
            else _resolve("No remaining cycle time for previous cycle");
        });


        waitForPreviousCycleFinish.then(function(){

            if (self.isActive)
            { // Loop was not stopped while waiting for previous cycle finish

                self.remainingCycleTime = self.cycleTime;
                onCycle().then(function(){

                    if (self.isActive)
                    { // Loop was not stopped while executing child class specific cycle code

                        clearInterval(self.nextCycleTimeout);
                        self.nextCycleTimeoutStartTimeStamp = Date.now();

                        // Call this method again after <cycleTime>
                        self.nextCycleTimeout = setInterval(function(){
                            self.remainingCycleTime = 0;
                            cycle();
                        }, self.cycleTime);
                    }
                });
            }
        });
    }

    /**
     * Stops the loop.
     */
    stop()
    {
        this.onLoopStop();
        this.halt(true);
        this.remainingCycleTime = 0;
    }

    /**
     * Pauses the loop if it is currently running.
     */
    halt(_isLoopStop = false)
    {
        if (this.isActive)
        {
            clearInterval(this.nextCycleTimeout);

            this.remainingCycleTime = this.calculateRemainingCycleTime();
            this.nextCycleTimeoutStartTimeStamp = null;
            this.isActive = false;

            if (! _isLoopStop) this.onLoopHalt();
        }
    }


    // Hooks for child classes

    /**
     * Method that will be called on loop start.
     */
    onLoopStart()
    {
    }

    /**
     * Method that will be called on loop continue.
     *
     * @return {Promise} The promise that executes child class specific code
     */
    onLoopContinue()
    {
        return new Promise(function(_resolve){
            _resolve(null);
        });
    }

    /**
     * Method that will be called on each cycle.
     *
     * @return {Promise} The promise that executes child class specific code
     */
    onCycle()
    {
        return new Promise(function(_resolve){
            _resolve(null);
        });
    }

    /**
     * Method that will be called on loop stop.
     */
    onLoopStop()
    {
    }

    /**
     * Method that will be called on loop halt.
     */
    onLoopHalt()
    {
    }
}


/**
 * Defines whether this loop is currently active
 *
 * @type {boolean} isActive
 */
Loop.isActive = false;

/**
 * Stores the timeout that will execute the next cycle
 * This is a interval because timeouts can not be cleared properly
 *
 * @type {Object} nextTabTimeout
 */
Loop.nextCycleTimeout = null;

/**
 * Stores when the next cycle timeout was initialized.
 * This value is the return value of Date.now().
 * This is necessary to calculate the remaining cycle time after a loop halt.
 *
 * @type {int} nextTabTimeoutStart
 */
Loop.nextCycleTimeoutStartTimeStamp = 0;

/**
 * Stores the time in milliseconds that must pass before the next cycle is called.
 *
 * @type {int} cycleTime
 */
Loop.cycleTime = 0;

/**
 * Stores the remaining cycle time in milliseconds
 * This is used when the loop is continued after a loop halt
 *
 * @type {int} remainingTabShowTime
 */
Loop.remainingCycleTime = 0;


module.exports = Loop;
