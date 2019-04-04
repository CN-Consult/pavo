/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

$(document).ready(function(){

    var showTextContainer = $("div#show-text-container");

    $(showTextContainer).css("height", $(window).height());
    $(showTextContainer).css("width", $(window).width());

    textFit(showTextContainer, {
        multiLine: true,
        alignHoriz: true,
        alignVert: true,
        maxFontSize: 100000
    });

    $(showTextContainer).css("visibility", "visible");
});
