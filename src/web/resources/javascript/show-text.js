/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

$(document).ready(function(){
    $("div#show-text-container").boxfit({
        multiline: true,
        width: $(window).width(),
        height: $(window).height() - 50,
        step_limit: 100000,
        step_size: 3
    });
});
