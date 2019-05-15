/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

let pageFetchedTimeStamp = Date.now();

/**
 * The JSONEditor dialog
 *
 * @type JsonEditorDialog jsonEditorDialog
 */
let jsonEditorDialog;

let timeProgressBars = [];
let socket = io.connect("http://" + location.host);

$(document).ready(function() {

    jsonEditorDialog = new JsonEditorDialog(socket);
    jsonEditorDialog.init($("div#dialog-json-editor"), $("div#dialog-confirm-configuration-save"));

    $("button.toggle-page-switch-loop").on("click", togglePageSwitchLoop);
    $("form.load-url-form").on("submit", loadUrlIntoWindow);
    $("form.show-text-form").on("submit", showTextInWindow);
    $("button.reload-window").on("click", reloadWindows);
    $("div.window-configuration table.page-list tr.defined-page").on("click", switchToPage);
    $("div#pavo-overview button#edit-pavo-config").on("click", showJsonEditor);
    $("div#pavo-overview button#restart-pavo").on("click", restartPavo);

    socket.on("pageSwitchLoopStatusUpdate", handlePageSwitchLoopStatusUpdate);
    socket.on("customUrlLoad", handleCustomUrlLoad);
    socket.on("displayText", handleDisplayText);

    socket.on("error", function(_errorMessage){
        Utils.showErrorMessage(_errorMessage);
    });

    initializeTimeProgressBars();

    // Initialize tool tips
    $("[data-toggle=\"tooltip\"]").tooltip();
});

$(window).bind("beforeunload", function(){
    socket.disconnect();
});


/**
 * Initializes the time progress bars behind the currently displayed pages per window.
 */
function initializeTimeProgressBars()
{
    let windowConfigurationDivs = $("div.window-configuration");

    windowConfigurationDivs.each(function(_windowConfigurationDivIndex){

        let windowConfiguration = $(windowConfigurationDivs[_windowConfigurationDivIndex]);
        let pageList = $(windowConfiguration).find("table.page-list");

        let currentPage = pageList.data("current-page");
        let remainingDisplayTime = pageList.data("remaining-display-time") - (Date.now() - pageFetchedTimeStamp);
        let isPageSwitchLoopActive = windowConfiguration.data("page-switch-loop-active");

        timeProgressBars[_windowConfigurationDivIndex] = new TimeProgressBar();
        timeProgressBars[_windowConfigurationDivIndex].initialize(pageList.find("td.remaining-time"), remainingDisplayTime);

        showRemainingTime(_windowConfigurationDivIndex, currentPage, remainingDisplayTime, isPageSwitchLoopActive);
    });
}

// Page switch loop update and control

/**
 * Halts or resumes the page switch loops of the event targets window.
 */
function togglePageSwitchLoop(_event)
{
    if ($(_event.target).closest("div.window-configuration").data("page-switch-loop-active") === true)
    {
        socket.emit("haltPageSwitchLoops", { windowIds: [ getWindowIdFromElement(_event.target) ] });
    }
    else socket.emit("resumePageSwitchLoops", { windowIds: [ getWindowIdFromElement(_event.target) ] });
}

/**
 * Loads an url into the currently selected windows.
 */
function loadUrlIntoWindow(_event)
{
    // Prevent the page reload on form submission
    _event.preventDefault();

    // Fetch the url from the form
    let url = $(_event.target).find("input.url").val();

    socket.emit("loadURL", { windowIds: [ getWindowIdFromElement(_event.target) ], url: url });
}

/**
 * Shows text inside a specific window.
 *
 * @param {Event} _event The event that triggered this function call
 */
function showTextInWindow(_event)
{
    // Prevent the page reload on form submission
    _event.preventDefault();

    // Fetch the text from the form
    let text = $(_event.target).find("input.show-text").val();

    socket.emit("showText", { windowId: getWindowIdFromElement(_event.target), text: text });
}

/**
 * Reloads the currently selected windows.
 */
function reloadWindows(_event)
{
    socket.emit("reloadWindows", { windowIds: [ getWindowIdFromElement(_event.target) ] });
}

/**
 * Switches to a specific page of a window.
 *
 * @param {Event} _event The clicked table row
 */
function switchToPage(_event)
{
    /*
     * The event listener is on each table row but the table row cannot be clicked without clicking a table field.
     * Therefore the event target is always a table field of the target table row
     */
    let clickedPageTableRow = $(_event.target).closest("tr");

    // Closest div container is the div container for the whole window configuration which has a data attribute with the window id
    let tableRowParentWindow = $(clickedPageTableRow).closest("div");

    let windowId = $(tableRowParentWindow).data("window");
    let pageId = $(clickedPageTableRow).data("page");

    socket.emit("switchToPage", { windowId: windowId, pageId: pageId });
}

/**
 * Restarts the pavo app.
 */
function restartPavo()
{
    socket.emit("restartPavo");
}

/**
 * Handles "pageSwitchLoopStatusUpdate" events.
 *
 * @param {object} _statusUpdate The status update (contains the update type and the list of affected windows)
 */
function handlePageSwitchLoopStatusUpdate(_statusUpdate)
{
    handlePageSwitch(_statusUpdate);

    let startCountdown = _statusUpdate.pageSwitchLoopIsActive;

    if (_statusUpdate.type === "halt" || _statusUpdate.type === "continue")
    { // halt or continue

        let resumePageSwitchLoop = _statusUpdate.type === "continue";
        let windowConfigurationDiv = $("div#window-configuration-" + _statusUpdate.window);

        // Update the time progress bar
        let timeProgressBar = timeProgressBars[_statusUpdate.window];
        if (timeProgressBar) startCountdown = resumePageSwitchLoop;

        // Update page switch loop active data
        $(windowConfigurationDiv).data("page-switch-loop-active", resumePageSwitchLoop);

        // Update the page switch loop status circle
        let circleClassName;
        if (resumePageSwitchLoop) circleClassName = "greenCircle";
        else circleClassName = "redCircle";

        // Update button functionality
        let togglePageSwitchLoopButton = $(windowConfigurationDiv).find(" table.components button.toggle-page-switch-loop");

        togglePageSwitchLoopButton.empty();
        if (resumePageSwitchLoop) togglePageSwitchLoopButton.append($("<i class=\"fas fa-pause\"></i>"));
        else togglePageSwitchLoopButton.append($("<i class=\"fas fa-play\"></i>"));

        setPageSwitchLoopCircleClass(windowConfigurationDiv, circleClassName);
    }

    showRemainingTime(_statusUpdate.window, _statusUpdate.page, _statusUpdate.remainingDisplayMilliseconds, startCountdown);
}

/**
 * Sets the circle class name for the page switch loop state circle.
 *
 * @param {jQuery} _windowConfigurationDiv The window configuration div container in which the page switch loop circle will be changed
 * @param {string} _circleClassName The new circle class name
 */
function setPageSwitchLoopCircleClass(_windowConfigurationDiv, _circleClassName)
{
    let pageSwitchLoopStateCircle =$(_windowConfigurationDiv).find(" p.pageSwitchLoopState");

    if (! pageSwitchLoopStateCircle.hasClass(_circleClassName))
    {
        // Remove all classes from the element except for "circle" and the new circle type class name
        let allowedClassNames = [ "pageSwitchLoopState", "circle", _circleClassName ];
        let classNames = pageSwitchLoopStateCircle.attr("class").split(/\s+/);
        classNames.forEach(function(_className){
            if (! allowedClassNames.includes(_className)) pageSwitchLoopStateCircle.removeClass(_className);
        });

        pageSwitchLoopStateCircle.addClass(_circleClassName);
    }
}

/**
 * Handles a "pageSwitch" event.
 *
 * @param {object} _pageSwitchData The page switch data (contains the window whose page switched and the page id that switched)
 */
function handlePageSwitch(_pageSwitchData)
{
    let pageId = _pageSwitchData.page;
    let windowId = _pageSwitchData.window;

    setActivePage(windowId, pageId);
}

/**
 * Sets the "active" class for a specific page in a specific window and removes the "active" class from all other pages.
 *
 * @param {int} _windowId The window id
 * @param {int} _pageId The page id
 */
function setActivePage(_windowId, _pageId)
{
    let pageTableRows = $("div#window-configuration-" + _windowId + " table.page-list tr");

    pageTableRows.each(function(_pageTableRowIndex){

        let pageTableRow = pageTableRows[_pageTableRowIndex];

        // Highlight the displayed page
        if ($(pageTableRow).hasClass("active"))
        {
            // Remove the active class from all pages that are not the currently displayed page
            if (_pageTableRowIndex !== _pageId) $(pageTableRow).removeClass("active");
        }
        else
        {
            // Add the active class to the currently displayed page
            if (_pageTableRowIndex === _pageId) $(pageTableRow).addClass("active");
        }
    });
}

/**
 * Shows the remaining time for which a page will be displayed as a countdown behind the page url.
 *
 * @param {int} _windowId The id of the window
 * @param {int} _pageId The id of the page
 * @param {int} _numberOfRemainingMilliseconds The number of remaining milliseconds for which the page will be displayed
 * @param {boolean} _startCountdown Defines whether the countdown will be started after initializing
 */
function showRemainingTime(_windowId, _pageId, _numberOfRemainingMilliseconds, _startCountdown)
{
    timeProgressBars[_windowId].stop();

    timeProgressBars[_windowId].initialize($("div#window-configuration-" + _windowId + " table.page-list tr#page-" + _windowId + "-" + _pageId + " td.remaining-time"), _numberOfRemainingMilliseconds);

    if (_startCountdown) timeProgressBars[_windowId].start();
    else timeProgressBars[_windowId].initializeCountDownElement();
}

/**
 * Shows the json editor dialog.
 */
function showJsonEditor()
{
    socket.once("loadedConfigurationStatus", function(_loadedConfiguration){
        jsonEditorDialog.show(_loadedConfiguration);
    });
    socket.emit("getLoadedConfiguration");
}

/**
 * Returns the window id from a node inside a window configuration div container.
 *
 * @param {jQuery} _node The node
 *
 * @return {int} The window id or undefined if the node is not inside a window-configuration div container
 */
function getWindowIdFromElement(_node)
{
    return $(_node).closest("div.window-configuration").data("window");
}

/**
 * Shows the special page table row with the information about the custom url.
 *
 * @param {object} _data The data which contains the window id and the url that was loaded
 */
function handleCustomUrlLoad(_data)
{
    Utils.showSuccessMessage("URL erfolgreich geladen");
    showSpecialPage(_data.window, "C", _data.url);
}

/**
 * Shows the special page table row with the information about the displayed text.
 *
 * @param {object} _data The data which contains the window id and the text that was displayed
 */
function handleDisplayText(_data)
{
    showSpecialPage(_data.window, "T", _data.text);
}

/**
 * Shows the special table row with custom values.
 *
 * @param {int} _windowId The id of the window
 * @param {string} _typeIdentifier The identifier for the special page type
 * @param {string} _pageName The name for the special page
 */
function showSpecialPage(_windowId, _typeIdentifier, _pageName)
{
    let windowPages = $("div#window-configuration-" + _windowId + " table.page-list tr");
    let specialPageTableRow = $(windowPages).filter(".special-page");

    specialPageTableRow.find("td.page-type p").text(_typeIdentifier);
    specialPageTableRow.find("td.page-name").text(_pageName);

    setActivePage(_windowId, windowPages.length - 1);
}
