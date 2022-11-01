/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const Loop = require(__dirname + "/../../../Util/Loop");

/**
 * Handles a page switch loop for a window.
 *
 * @property {PageDisplayer} pageDisplayer The page displayer
 */
class PageSwitchLoop extends Loop
{
    /**
     * PageSwitchLoop constructor.
     */
    constructor()
    {
        super();
    }


    // Getters and Setters

    /**
     * Returns the page displayer.
     *
     * @returns {PageDisplayer} The page displayer
     */
    getPageDisplayer()
    {
        return this.pageDisplayer;
    }


    // Public Methods

    /**
     * Initializes the page switch loop.
     *
     * @param {PageDisplayer} _pageDisplayer The page displayer
     */
    initialize(_pageDisplayer)
    {
        this.pageDisplayer = _pageDisplayer;
        this.init(this.pageDisplayer.getPageList().getCurrentPage().getDisplayTime());
    }

    /**
     * Switches the page switch loop to a specific page.
     *
     * @param {int} _pageId The page id
     *
     * @return {Promise} The promise that switches the page switch loop to a specific page
     */
    switchToPage(_pageId)
    {
        let pageList = this.pageDisplayer.getPageList();
        let page = pageList.getPage(_pageId);

        if (! page) return new Promise(function(_resolve, _reject){
            _reject("There is no page with the id " + _pageId + " in this page switch loop");
        });

        this.halt();

        let self = this;
        return new Promise(function(_resolve){
            self.showPage(page).then(function(){
                pageList.setCurrentPageIndex(_pageId);
                _resolve("Switched to page");
            });
        });
    }


    // Hooks

    /**
     * Method that is called on loop halt.
     *
     * @emits The "halt" event
     * @protected
     */
    onLoopHalt()
    {
        let pageReloadLoop = this.pageDisplayer.getPageReloadLoop();
        if (pageReloadLoop && pageReloadLoop.getIsActive()) pageReloadLoop.halt();

        this.emit("halt", { page: this.pageDisplayer.getCurrentPage(), remainingDisplayTime: this.remainingCycleTime, isActive: this.isActive });
    }

    /**
     * Method that is called on loop continue.
     *
     * @return {Promise} The promise that executes page switch loop specific code
     *
     * @emits The "continue" event
     * @protected
     */
    onLoopContinue()
    {
        this.emit("continue", { page: this.pageDisplayer.getCurrentPage(), remainingDisplayTime: this.remainingCycleTime, isActive: this.isActive });

        this.pageDisplayer.restoreOriginalPage();

        let self = this;
        return new Promise(function(_resolve){
            if (self.pageDisplayer.getCurrentPage() && self.pageDisplayer.getCurrentPage().getReloadTime() > 0)
            {
                self.pageDisplayer.getPageReloadLoop().continue().then(function(){
                    _resolve("Page reload loop continued");
                });
            }
            else _resolve("No page reload loop continue necessary");
        });
    }

    /**
     * Method that is called on each loop cycle.
     *
     * @returns {Promise} The promise that executes page switch loop specific code
     * @protected
     */
    onCycle()
    {
        let nextPage = this.pageDisplayer.getPageList().getNextPage();
        return this.showPage(nextPage);
    }


    // Private Methods

    /**
     * Shows a specified page.
     *
     * @param {Page} _page The page to show
     *
     * @return {Promise} The promise that shows the page
     *
     * @emits The "show" event when the page is shown
     * @private
     */
    showPage(_page)
    {
        this.init(_page.getDisplayTime());

        let self = this;
        return new Promise(function(_resolve){
            self.pageDisplayer.showPage(_page, self.isActive).then(function(){
                self.emit("show", { page: self.pageDisplayer.getCurrentPage(), remainingDisplayTime: self.remainingCycleTime, isActive: self.isActive });
                _resolve("Page shown");
            });
        });
    }
}


module.exports = PageSwitchLoop;
