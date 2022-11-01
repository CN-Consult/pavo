/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Stores a list of pages and provides methods to get/set the entries.
 *
 * @property {Page[]} pages The list of pages
 * @property {int} currentPageIndex The current page index that is updated by the getNextPage() method
 */
class PageList
{
    /**
     * PageList constructor.
     */
    constructor()
    {
        this.pages = [];
        this.currentPageIndex = -1;
    }


    // Getters and Setters

    /**
     * Returns the current page index of this PageList.
     *
     * @returns {int} The current page index of this PageList
     */
    getCurrentPageIndex()
    {
        return this.currentPageIndex;
    }

    /**
     * Sets the current page index.
     *
     * @param {int} _currentPageIndex The current page index
     */
    setCurrentPageIndex(_currentPageIndex)
    {
        this.currentPageIndex = _currentPageIndex;
    }

    /**
     * Returns the list of all pages.
     *
     * @returns {Page[]} The list of all pages
     */
    getPages()
    {
        return this.pages;
    }


    // Public Methods

    /**
     * Adds a page to the list of pages.
     *
     * @param {Page} _page The page to add
     */
    addPage(_page)
    {
        this.pages.push(_page);
        this.currentPageIndex = this.pages.length - 1;
    }

    /**
     * Returns a page by id.
     *
     * @param {int} _pageId The page id
     *
     * @return {Page|null} The page or null if no page with that index exists
     */
    getPage(_pageId)
    {
        return this.pages[_pageId];
    }

    /**
     * Removes one page from the list of pages.
     *
     * @param {Page} _page The page
     */
    removePage(_page)
    {
        let pageIndex = _page.getId();
        let numberOfPages = this.pages.length;

        // Move all array entries above the page index down by one index
        for (let i = pageIndex; i < numberOfPages - 1; i++)
        {
            this.pages[pageIndex] = this.pages[pageIndex + 1];
        }

        // Remove the last page entry
        this.pages.pop();

        if (this.currentPageIndex > pageIndex) this.currentPageIndex -= 1;
    }


    // Fetch information about the list

    /**
     * Returns whether this page list contains at least one page with a reload time that is greater than 0 seconds.
     *
     * @return {boolean} True if this page list contains at least one page with a reload time that is greater than 0 seconds, false otherwise
     */
    containsReloadPages()
    {
        for (let page of this.pages)
        {
            if (page.reloadTime > 0) return true;
        }

        return false;
    }

    /**
     * Returns the list of pages that need to be reloaded after app init.
     *
     * @return {Page[]} The list of pages that need to be reloaded after app init
     */
    getReloadAfterAppInitPages()
    {
        let reloadAfterAppInitPages = [];
        this.pages.forEach(function(_page){
           if (_page.getReloadAfterAppInit()) reloadAfterAppInitPages.push(_page);
        });

        return reloadAfterAppInitPages;
    }


    // Iterate over the list

    /**
     * Returns the current page.
     *
     * @return {Page|null} The current page or null if the page list doesn't contain any pages
     */
    getCurrentPage()
    {
        if (this.pages.length > 0) return this.pages[this.currentPageIndex];
        else return null;
    }

    /**
     * Increases the current page index by one and returns the new current page.
     *
     * @return {Page|null} The current page or null if the page list doesn't contain any pages
     */
    getNextPage()
    {
        if (this.pages.length > 0)
        {
            this.currentPageIndex++;
            if (this.currentPageIndex === this.pages.length) this.currentPageIndex = 0;

            return this.getCurrentPage();
        }
        else return null;
    }
}


module.exports = PageList;
