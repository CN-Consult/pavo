const fs = require("fs");
const path = require("path");
const BaseApiController = require('./BaseApiController');

class CookieController extends BaseApiController {
    constructor(_parentPavoApi) {
        super(_parentPavoApi, ['getPageCookies', 'pushCookiesIntoWindow']);
    }

    getPageCookies(_windowId, _pageId)
    {
        this.logger.debug("Configuration page wants cookie from window " + _windowId + " with page " + _pageId);

        if (_windowId < this.getWindows().length && _windowId >= 0) {
            let window = this.getWindows()[_windowId];
            return window.getPageDisplayer().browserWindowManager.getCookiesForPage(_pageId);
        } else {
            // It might happen the web interface sends invalid window indexes!
            return new Promise((resolve, reject) => {
                reject();
            });
        }
    }

    pushCookiesIntoWindow(_windowId, _pageId, _cookies)
    {
        this.logger.debug(`Configuration page wants to update cookies in window ${_windowId}!`);

        if (_windowId < this.getWindows().length && _windowId >= 0) {
            let window = this.getWindows()[_windowId];
            window.getPageDisplayer().browserWindowManager.updateCookies(_pageId, _cookies);
        }
    }
}

module.exports = CookieController;
