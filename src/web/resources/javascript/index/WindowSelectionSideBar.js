/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Handles the window selection side bar and provides the list of selected windows.
 * Requires jQuery to work.
 */
class WindowSelectionSideBar
{
    /**
     * WindowSelectionSideBar constructor.
     */
    constructor()
    {
        this.selectedWindows = [];
        this.numberOfSelectableWindows = 0;
    }


    // Public Methods

    /**
     * Initializes the sidebar.
     */
    initialize()
    {
        let windowSelectionSideBar = $(".window-select-buttons");
        let windowSelectCheckBoxes = windowSelectionSideBar.find(".window-select-button");
        let singleWindowSelectCheckBoxes = windowSelectionSideBar.find(".window-select-button:not(#all-windows-checkbox)");
        let allWindowsSelectCheckBox = windowSelectionSideBar.find(".window-select-button#all-windows-checkbox");

        // Initialize the design of the sidebar
        windowSelectionSideBar.controlgroup({
            direction: "vertical"
        });
        windowSelectCheckBoxes.checkboxradio({
            icon: false
        });

        // Get number of selectable windows
        this.numberOfSelectableWindows = singleWindowSelectCheckBoxes.length;

        // Parse the currently selected windows
        this.initializeSelectedWindowsList(singleWindowSelectCheckBoxes);
        this.autoCheckAllWindowSelectCheckBox(allWindowsSelectCheckBox);

        // Initialize the event listeners
        singleWindowSelectCheckBoxes.on("change", this.windowSelectionEventHandler.bind(this));
        allWindowsSelectCheckBox.on("click", this.allWindowsSelectionEventHandler.bind(this));
    }


    // Event Handlers

    /**
     * The event handler for a window (un-)selection.
     *
     * @param _event
     */
    windowSelectionEventHandler(_event)
    {
        let clickedWindowSelectCheckBox = _event.target;

        if ($(clickedWindowSelectCheckBox).is(":checked")) this.addSelectedWindow(clickedWindowSelectCheckBox.value);
        else this.removeSelectedWindow(clickedWindowSelectCheckBox.value);

        this.autoCheckAllWindowSelectCheckBox($(".window-select-button#all-windows-checkbox"));
    }

    /**
     * The event handler for the "all windows" (un-)selection.
     *
     * @param _event
     */
    allWindowsSelectionEventHandler(_event)
    {
        let clickedWindowSelectCheckBox = _event.target;

        if ($(clickedWindowSelectCheckBox).is(":checked")) this.autoSelectAllWindows();
        else this.autoUnSelectAllWindows();
    }


    // Getters and Setters

    /**
     * Returns the list of selected windows.
     *
     * @returns {string[]} The list of selected windows
     */
    getSelectedWindows()
    {
        return this.selectedWindows;
    }


    // Private Methods

    /**
     * Adds a selected window to the list of selected windows.
     *
     * @param {string} _selectedWindowValue The value of the selected window
     */
    addSelectedWindow(_selectedWindowValue)
    {
        if (_selectedWindowValue !== "all") this.selectedWindows.push(_selectedWindowValue);
    }

    /**
     * Removes a window from the list of selected windows.
     *
     * @param {string} _selectedWindowValue The value of the selected window
     */
    removeSelectedWindow(_selectedWindowValue)
    {
        this.selectedWindows = this.selectedWindows.filter(function(_selectedWindow){
            return (_selectedWindow !== _selectedWindowValue);
        });
    }

    /**
     * Initializes the list of selected windows.
     *
     * @param _windowSelectionCheckBoxes
     */
    initializeSelectedWindowsList(_windowSelectionCheckBoxes)
    {
        // Check the initial state of the check boxes
        let self = this;
        _windowSelectionCheckBoxes.each(function(_windowSelectionCheckBoxIndex, _windowSelectionCheckBox){

            if ($(_windowSelectionCheckBox).is(":checked"))
            {
                self.addSelectedWindow(_windowSelectionCheckBox.value);
            }
        });
    }

    /**
     * Auto (un-)checks the "all windows" select checkbox.
     *
     * @param _allWindowsSelectCheckBox
     */
    autoCheckAllWindowSelectCheckBox(_allWindowsSelectCheckBox)
    {
        let allWindowSelectButtonIsChecked = _allWindowsSelectCheckBox.prop("checked");

        if (allWindowSelectButtonIsChecked && this.selectedWindows.length < this.numberOfSelectableWindows)
        {
            _allWindowsSelectCheckBox.prop("checked", false);
            _allWindowsSelectCheckBox.change();
        }
        else if (! allWindowSelectButtonIsChecked && this.selectedWindows.length === this.numberOfSelectableWindows)
        {
            _allWindowsSelectCheckBox.prop("checked", true);
            _allWindowsSelectCheckBox.change();
        }
    }

    /**
     * Auto selects all windows that are currently not selected.
     */
    autoSelectAllWindows()
    {
        $(".window-select-button").each(function(_windowSelectCheckBoxIndex, _windowSelectCheckBox){

            if (! $(_windowSelectCheckBox).is(":checked"))
            {
                $(_windowSelectCheckBox).click();
            }
        });
    }

    /**
     * Auto unselects all windows that are currently selected.
     */
    autoUnSelectAllWindows()
    {
        $(".window-select-button").each(function(_windowSelectCheckBoxIndex, _windowSelectCheckBox){

            if ($(_windowSelectCheckBox).is(":checked"))
            {
                $(_windowSelectCheckBox).click();
            }
        });
    }
}


/**
 * The list of currently selected windows
 *
 * @type {string[]} selectedWindows
 */
WindowSelectionSideBar.selectedWindows = [];

/**
 * The total number of selectable windows
 *
 * @type {int} numberOfSelectableWindows
 */
WindowSelectionSideBar.numberOfSelectableWindows = 0;
