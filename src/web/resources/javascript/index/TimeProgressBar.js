/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * TimeProgressBar constructor.
 */
function TimeProgressBar()
{
    this.id = 0;
}

/**
 * Shows the remaining display time of a page.
 */
TimeProgressBar.prototype = {

    /**
     * Returns whether the time progress bar is currently active.
     *
     * @return {boolean} True if the time progress bar is currently active, false otherwise
     */
    getIsActive: function()
    {
        return this.isActive;
    },

    /**
     * Sets the number of remaining milliseconds.
     *
     * @param {int} _numberOfRemainingMilliseconds The number of remaining milliseconds
     */
    setNumberOfRemainingMilliseconds: function(_numberOfRemainingMilliseconds)
    {
        this.numberOfRemainingMilliseconds = _numberOfRemainingMilliseconds;
    },

    /**
     * Initializes the time progress bar for a specific element with a specified number of remaining seconds.
     *
     * @param {jQuery} _element The element that will be used to display the remaining seconds
     * @param {int} _numberOfRemainingMilliseconds The number of remaining milliseconds
     */
    initialize: function(_element, _numberOfRemainingMilliseconds)
    {
        this.element = _element;
        this.numberOfRemainingMilliseconds = _numberOfRemainingMilliseconds;
        this.numberOfRemainingSeconds = Math.ceil(this.numberOfRemainingMilliseconds / 1000);
    },

    /**
     * Starts the count down of remaining seconds.
     */
    start: function()
    {
        this.id++;
        if (this.id > 1000000) this.id = 0;

        if (this.isActive) this.stop();

        let progressStatusInfo = { id: this.id };

        let self = this;
        let firstCyclePromise = new Promise(function(_resolve){
            setTimeout(function() {

                if (self.numberOfRemainingMilliseconds % 1000 > 0) self.progress(progressStatusInfo);
                _resolve("First cycle complete");
            }, self.numberOfRemainingMilliseconds % 1000);
        });

        this.initializeCountDownElement();

        firstCyclePromise.then(function(){

            if (progressStatusInfo.id === self.id)
            {
                self.interval = setInterval(function() {
                    self.progress(progressStatusInfo);
                }, 1000);
            }
        });

        this.isActive = true;
    },

    /**
     * Shows the count down element and inserts the remaining seconds as text into the element.
     */
    initializeCountDownElement: function()
    {
        this.element.show();
        this.show();
    },

    /**
     * Halts the page switch loop.
     */
    halt: function()
    {
        clearInterval(this.interval);
    },

    /**
     * Resumes the page switch loop after a halt.
     */
    continue: function()
    {
        this.start();
    },

    /**
     * Stops the count down of remaining seconds.
     */
    stop: function()
    {
        this.halt();
        this.element.hide();

        this.isActive = false;
    },

    /**
     * Shows the remaining seconds in the element with which the time progress bar was initialized.
     */
    show: function()
    {
        this.element.text(this.numberOfRemainingSeconds + "s");
    },

    /**
     * Progresses the time by 1 second.
     */
    progress: function(_status)
    {
        if (this.isActive && _status.id === this.id)
        {
            if (this.numberOfRemainingSeconds === 0) this.halt();
            else
            {
                this.numberOfRemainingSeconds -= 1;
                this.show();
            }
        }
    }
};
