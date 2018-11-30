/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

let pageFetchedTimeStamp = Date.now();

let windowSelectionSideBar;
let timeProgressBars = [];
let socket = io.connect("http://" + location.host);

$(document).ready(function() {

    windowSelectionSideBar = new WindowSelectionSideBar();
    windowSelectionSideBar.initialize();

    $("div#window-control-buttons button#freeze-current-page").on("click", freezeCurrentPageButtonClickHandler);
    $("div#window-control-buttons button#resume-tab-switch-loops").on("click", resumeTabSwitchLoopsHandler);
    $("div#window-control-buttons button#load-url").on("click", loadUrlIntoWindows);
    $("div#window-control-buttons button#reload-windows").on("click", reloadWindows);

    socket.on("tabSwitchLoopStatusUpdate", handleTabSwitchLoopStatusUpdate);

    initializeTimeProgressBars();
});

$(window).bind("beforeunload", function(){
    socket.disconnect();
});


/**
 * Initializes the time progress bars behind the currently displayed tabs per window.
 */
function initializeTimeProgressBars()
{
    let tabLists = $("div.window-configuration table.tab-list");

    tabLists.each(function(_tabListIndex){

        let tabList = $(tabLists[_tabListIndex]);

        let currentTab = tabList.data("current-tab");
        let remainingDisplayTime = tabList.data("remaining-display-time") - (Date.now() - pageFetchedTimeStamp);
        let isTabSwitchLoopActive = tabList.data("tab-switch-loop-active");

        timeProgressBars[_tabListIndex] = new TimeProgressBar();
        timeProgressBars[_tabListIndex].initialize(tabList.find("td.remaining-time"), remainingDisplayTime);

        showRemainingTime(_tabListIndex, currentTab, remainingDisplayTime, isTabSwitchLoopActive);
    });
}

// Tab switch loop update and control

/**
 * Halts the tab switch loops of the currently selected windows.
 */
function freezeCurrentPageButtonClickHandler()
{
    socket.emit("haltTabSwitchLoops", { windowIds: windowSelectionSideBar.getSelectedWindows() });
}

/**
 * Resumes the tab switch loop of the currently selected windows.
 */
function resumeTabSwitchLoopsHandler()
{
    socket.emit("resumeTabSwitchLoops", { windowIds: windowSelectionSideBar.getSelectedWindows() });
}

/**
 * Loads an url into the currently selected windows.
 */
function loadUrlIntoWindows()
{
    let url = $("div#window-control-buttons input#load-url-url").val();

    socket.emit("loadURL", { windowIds: windowSelectionSideBar.getSelectedWindows(), url: url });
}

/**
 * Reloads the currently selected windows.
 */
function reloadWindows()
{
    socket.emit("reloadWindows", { windowIds: windowSelectionSideBar.getSelectedWindows() });
}

/**
 * Handles "tabSwitchLoopStatusUpdate" events.
 *
 * @param {object} _statusUpdate The status update (contains the update type and the list of affected windows)
 */
function handleTabSwitchLoopStatusUpdate(_statusUpdate)
{
    handleTabSwitch(_statusUpdate);

    let startCountdown;
    if (_statusUpdate["type"] === "show") startCountdown = true;
    else
    { // halt or continue

        // Update the time progress bar
        let timeProgressBar = timeProgressBars[_statusUpdate["window"]];
        if (timeProgressBar)
        {
            if (_statusUpdate["type"] === "halt") startCountdown = false;
            else startCountdown = true;
        }

        // Update the tab switch loop status circle
        let circleClassName;
        if (_statusUpdate["type"] === "halt") circleClassName = "redCircle";
        else circleClassName = "greenCircle";

        setTabSwitchLoopCircleClass(_statusUpdate["window"], circleClassName);
    }

    showRemainingTime(_statusUpdate["window"], _statusUpdate["tab"], _statusUpdate["remainingDisplayMilliseconds"], startCountdown);
}

/**
 * Sets the circle class name for the tab switch loop state circle.
 *
 * @param {int} _windowId The id of the window to which the tab switch loop belongs
 * @param {string} _circleClassName The new circle class name
 */
function setTabSwitchLoopCircleClass(_windowId, _circleClassName)
{
    let tabSwitchLoopStateCircle = $("div#window-configuration-" + _windowId + " p#tabSwitchLoopState");

    if (! tabSwitchLoopStateCircle.hasClass(_circleClassName))
    {
        // Remove all classes from the element except for "circle" and the new circle type class name
        let classNames = tabSwitchLoopStateCircle.attr("class").split(/\s+/);
        classNames.forEach(function(_className){
            if (_className !== "circle" && _className !== _circleClassName) tabSwitchLoopStateCircle.removeClass(_className);
        });

        tabSwitchLoopStateCircle.addClass(_circleClassName);
    }
}

/**
 * Handles a "tabSwitch" event.
 *
 * @param {object} _tabSwitchData The tab switch data (contains the window whose tab switched and the tab id that switched)
 */
function handleTabSwitch(_tabSwitchData)
{
    let tabId = _tabSwitchData["tab"];
    let windowId = _tabSwitchData["window"];
    let tabTableRows = $("div#window-configuration-" + windowId + " table.tab-list tr");

    let tabTableRowIndex = 0;
    tabTableRows.each(function(_tabTableRow){

        let tabTableRow = tabTableRows[tabTableRowIndex];

        // Highlight the displayed tab
        if ($(tabTableRow).hasClass("active"))
        {
            // Remove the active class from all tabs that are not the currently displayed tab
            if (tabTableRowIndex !== tabId) $(tabTableRow).removeClass("active");
        }
        else
        {
            // Add the active class to the currently displayed tab
            if (tabTableRowIndex === tabId) $(tabTableRow).addClass("active");
        }

        tabTableRowIndex++;
    });
}

/**
 * Shows the remaining time for which a tab will be displayed as a countdown behind the tab url.
 *
 * @param {int} _windowId The id of the window
 * @param {int} _tabId The id of the tab
 * @param {int} _numberOfRemainingMilliseconds The number of remaining milliseconds for which the tab will be displayed
 * @param {boolean} _startCountdown Defines whether the countdown will be started after initializing
 */
function showRemainingTime(_windowId, _tabId, _numberOfRemainingMilliseconds, _startCountdown)
{
    timeProgressBars[_windowId].stop();

    timeProgressBars[_windowId].initialize($("div#window-configuration-" + _windowId + " table.tab-list tr#tab-" + _tabId + " td.remaining-time"), _numberOfRemainingMilliseconds);

    if (_startCountdown) timeProgressBars[_windowId].start();
    else timeProgressBars[_windowId].initializeCountDownElement();
}
