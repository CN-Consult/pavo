/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

let windowSelectionSideBar;

$(document).ready(function() {

    $.getScript("/javascript/index/WindowSelectionSideBar.js", function() {
        windowSelectionSideBar = new WindowSelectionSideBar();
        windowSelectionSideBar.initialize();

        $("div#window-control-buttons button#freeze-current-page").on("click", freezeCurrentPageButtonClickHandler);
        $("div#window-control-buttons button#resume-tab-switch-loops").on("click", resumeTabSwitchLoopsHandler);
    });
});


/**
 * Halts the tab switch loops of the currently selected windows.
 */
function freezeCurrentPageButtonClickHandler()
{
    let targetUrl = "/api/haltTabSwitchLoops";
    let urlOptions = "windows=" + JSON.stringify(windowSelectionSideBar.getSelectedWindows());

    $.ajax({
        url: targetUrl + "?" + urlOptions,
        timeout: 5000,
        type: "GET"
    }).then(function(_haltedTabSwitchLoopWindowIds){
        _haltedTabSwitchLoopWindowIds.forEach(function(_haltedTabSwitchLoopWindowId){
            setTabSwitchLoopCircleClass(_haltedTabSwitchLoopWindowId, "redCircle");
        });
    }).catch(function(_error){
        console.log(_error);
    });
}

/**
 * Resumes the tab switch loop of the currently selected windows.
 */
function resumeTabSwitchLoopsHandler()
{
    let targetUrl = "/api/resumeTabSwitchLoops";
    let urlOptions = "windows=" + JSON.stringify(windowSelectionSideBar.getSelectedWindows());

    $.ajax({
        url: targetUrl + "?" + urlOptions,
        timeout: 5000,
        type: "GET"
    }).then(function(_resumedTabSwitchLoopWindowIds){
        _resumedTabSwitchLoopWindowIds.forEach(function(_resumedTabSwitchLoopWindowId){
            setTabSwitchLoopCircleClass(_resumedTabSwitchLoopWindowId, "greenCircle");
        });
    }).catch(function(_error){
        console.log(_error);
    });
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
