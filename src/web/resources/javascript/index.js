/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

let pageFetchedTimeStamp = Date.now();

let jsonEditorDialog;
let timeProgressBars = [];
let socket = io.connect("http://" + location.host);

$(document).ready(function() {

    jsonEditorDialog = new JsonEditorDialog(socket);
    jsonEditorDialog.init($("div#dialog-json-editor"), $("div#dialog-confirm-configuration-save"));

    $("button#toggle-tab-switch-loop").on("click", toggleTabSwitchLoop);
    $("form#load-url-form").on("submit", loadUrlIntoWindow);
    $("button#reload-window").on("click", reloadWindows);
    $("div.window-configuration table.tab-list tr.defined-page").on("click", switchToPage);
    $("div#pavo-overview section#pavo-configuration-edit button#edit-pavo-config").on("click", showJsonEditor);

    socket.on("tabSwitchLoopStatusUpdate", handleTabSwitchLoopStatusUpdate);

    initializeTimeProgressBars();

    // Initialize tool tips
    $("[data-toggle=\"tooltip\"]").tooltip();
});

$(window).bind("beforeunload", function(){
    socket.disconnect();
});


/**
 * Initializes the time progress bars behind the currently displayed tabs per window.
 */
function initializeTimeProgressBars()
{
    let windowConfigurationDivs = $("div.window-configuration");

    windowConfigurationDivs.each(function(_windowConfigurationDivIndex){

        let windowConfiguration = $(windowConfigurationDivs[_windowConfigurationDivIndex]);
        let tabList = $(windowConfiguration).find("table.tab-list");

        let currentTab = tabList.data("current-tab");
        let remainingDisplayTime = tabList.data("remaining-display-time") - (Date.now() - pageFetchedTimeStamp);
        let isTabSwitchLoopActive = windowConfiguration.data("tab-switch-loop-active");

        timeProgressBars[_windowConfigurationDivIndex] = new TimeProgressBar();
        timeProgressBars[_windowConfigurationDivIndex].initialize(tabList.find("td.remaining-time"), remainingDisplayTime);

        showRemainingTime(_windowConfigurationDivIndex, currentTab, remainingDisplayTime, isTabSwitchLoopActive);
    });
}

// Tab switch loop update and control

/**
 * Halts or resumes the tab switch loops of the event targets window.
 */
function toggleTabSwitchLoop(_event)
{
    if ($(_event.target).closest("div.window-configuration").data("tab-switch-loop-active") === true)
    {
        socket.emit("haltTabSwitchLoops", { windowIds: [ getWindowIdFromElement(_event.target) ] });
    }
    else socket.emit("resumeTabSwitchLoops", { windowIds: [ getWindowIdFromElement(_event.target) ] });
}

/**
 * Loads an url into the currently selected windows.
 */
function loadUrlIntoWindow(_event)
{
    // Prevent the page reload on form submission
    _event.preventDefault();

    // Fetch the url from the form
    let url = $(_event.target).find("input#url").val();

    socket.emit("loadURL", { windowIds: [ getWindowIdFromElement(_event.target) ], url: url });
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
    let clickedTabTableRow = $(_event.target).closest("tr");

    // Closest div container is the div container for the whole window configuration which has a data attribute with the window id
    let tableRowParentWindow = $(clickedTabTableRow).closest("div");

    let windowId = $(tableRowParentWindow).data("window");
    let tabId = $(clickedTabTableRow).data("page");

    socket.emit("switchToPage", { windowId: windowId, tabId: tabId });
}

/**
 * Handles "tabSwitchLoopStatusUpdate" events.
 *
 * @param {object} _statusUpdate The status update (contains the update type and the list of affected windows)
 */
function handleTabSwitchLoopStatusUpdate(_statusUpdate)
{
    handleTabSwitch(_statusUpdate);

    let startCountdown = _statusUpdate["tabSwitchLoopIsActive"];

    if (_statusUpdate["type"] === "halt" || _statusUpdate["type"] === "continue")
    { // halt or continue

        let resumeTabSwitchLoop = _statusUpdate["type"] === "continue";
        let windowConfigurationDiv = $("div#window-configuration-" + _statusUpdate["window"]);

        // Update the time progress bar
        let timeProgressBar = timeProgressBars[_statusUpdate["window"]];
        if (timeProgressBar) startCountdown = resumeTabSwitchLoop;

        // Update tab switch loop active data
        $(windowConfigurationDiv).data("tab-switch-loop-active", resumeTabSwitchLoop);

        // Update the tab switch loop status circle
        let circleClassName;
        if (resumeTabSwitchLoop) circleClassName = "greenCircle";
        else circleClassName = "redCircle";

        // Update button functionality
        let toggleTabSwitchLoopButton = $(windowConfigurationDiv).find(" table.components button#toggle-tab-switch-loop");

        toggleTabSwitchLoopButton.empty();
        if (resumeTabSwitchLoop) toggleTabSwitchLoopButton.append($("<i class=\"fas fa-pause\"></i>"));
        else toggleTabSwitchLoopButton.append($("<i class=\"fas fa-play\"></i>"));

        setTabSwitchLoopCircleClass(windowConfigurationDiv, circleClassName);
    }

    showRemainingTime(_statusUpdate["window"], _statusUpdate["tab"], _statusUpdate["remainingDisplayMilliseconds"], startCountdown);
}

/**
 * Sets the circle class name for the tab switch loop state circle.
 *
 * @param {jQuery} _windowConfigurationDiv The window configuration div container in which the tab switch loop circle will be changed
 * @param {string} _circleClassName The new circle class name
 */
function setTabSwitchLoopCircleClass(_windowConfigurationDiv, _circleClassName)
{
    let tabSwitchLoopStateCircle =$(_windowConfigurationDiv).find(" p#tabSwitchLoopState");

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
