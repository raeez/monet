// JavaScript Document
var maxPhotoSize = 0;
var MARGIN_WIDTH = 10; // set a global margin
var BORDER_WIDTH = 4; // set a global margin
var ARTIFACT_HEIGHT = 175; // The standard height of all artifacts
var WRAPPER_WIDTH = 955;
window.artifacts = [] // A global that holds json representations of all returned artifacts
window.artifactDivs; // A global used to keep track of the position of all artifact divs
window.numRows = 0; // The total number of rows on the page
window.zoomHeight; // A global that says how tall the center area of the page is
window.scaleFactor = 1; // The factor that artifacts scale by when zoomed. Defaults to 1
window.zoomedIn = false;
window.previousZoomTarget = undefined; // The last target that we were zoom focused on
window.timers = {}; // Dictionary of timers for the stream page

/*============================================================ 
 * On Startup
 *==========================================================*/
$(document).ready(function(){
    BrowserDetect.init(); // See http://www.quirksmode.org/js/detect.html

    $("#multi_session").val(randomString());

    /* ************************************************* *
     * INDEX - Vertically centers the uploader in the page
     * **************************************************/
	wrapResize();
	$(window).resize(wrapResize);

    /* ************************************************* *
     * CANVAS - Controls the hide button on artifacts
     * **************************************************/
    $(".hide_photo").hover(function(){
        $(this).parent(".artifact").addClass("opacity40");
    }, function(){
        $(this).parent(".artifact").removeClass("opacity40");
    });
    $(".hide_photo").click(function(){
        var visible;

        // Note, IDs of artifacts are prefixed with 'artifact_'. We must strip this first
        id = $(this).parent().attr("id");
        id = id.slice(9,id.length);

        if ($(this).parent().hasClass("artifact_hidden")) {
            visible = 0;
            $.post("/toggle_visibility", {'visibility':visible, 'id':id});
            $(this).html("<a href='#'>hide</a>");
            $(this).parent().removeClass("artifact_hidden");
        } else { 
            visible = 1; 
            $.post("/toggle_visibility", {'visibility':visible, 'id':id});

            if ($("#hidden_prompt").hasClass("showing_hidden")) {
                $(this).parent().addClass("artifact_hidden");
                $(this).html("hidden photo<br/><a href='#'>show</a>");
            } else {
                $(this).parent(".artifact").hide('fast', function(){
                    $(this).parent(".artifact").remove();
                    updateArtifactDivs();
                    //photoHFit();
                });
            }
        }

    });


    /* ************************************************* *
     * CANVAS & INDEX - Login Form Methods
     * **************************************************/
	$('#canvas_login_form').show();
    checkForEmail(); // Will see if the form is already filled in with an email

	$("#landing_login_form").inputHintOverlay(3, 5);
	$("#canvas_login_form").inputHintOverlay(3, 5);
	
	$("div.inputHintOverlay").hover(function() {
		$(this).children("input").toggleClass("input_hover");
	});
	
    $("#canvas_login_close").click(function(){
        $("#canvas_login_prompt").show();
        $("#canvas_login_div").hide();
    })
	$("#canvas_login_text").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});
	$("#canvas_signup_text").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});

	$("#alert_bar_login").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});
	$("#alert_bar_signup").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});

    $("form").submit(function(e){
        var validationFail = false;
        $(this).find("input:text, input:password").each(function() {
            if ($(this).parent().parent().parent().css("display") != "none") {
                if ($(this).val() == "") {
                    $(".login_error_messages").html("Please fill in everything");
                    validationFail = true;
                }
            }
        });
        if (!testEmail($(".login_email input").val())) {
            $(".login_error_messages").html("Need a valid email address");
            validationFail = true;
        }
        if ($(".login_new_confirm_pass input").val() != $(".login_new_pass input").val()) {
            $(".login_error_messages").html("Passwords must match");
            validationFail = true;
        }

        return !validationFail;

    });

    $(".login_email").focusin(function() {
        if (!testEmail($(".login_email input").val())) {
            hideAllLogin();
            $(".login_checking").show();
            $(".login_prompt").show();
        } else {
            checkForEmail();
        }
    });
    $(".login_email").focusout(function() {
        checkForEmail();
    });
    $(".login_email input").keyup(function(e) {
        checkForEmail();
    });

    $(".login_new_confirm_pass input").blur(function() {
        if ($(".login_new_confirm_pass input").val() != $(".login_new_pass input").val()) {
            $(".login_error_messages").html("Passwords must match");
        } else {
            $(".login_error_messages").html("");
        }
    });

    function testEmail(email) {
        //http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        var re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
        return re.test(email)
    }

    function checkForEmail() {

        email = $(".login_email input").val();
        if (email == '') {
            hideAllLogin();
            $(".login_prompt").show();
            $(".login_blank").show();
            return
        }
        if (testEmail(email)) {
            $.post("/check_for_email", {"email":email}, function(data) {
                if (data == '1') {
                    hideAllLogin();
                    $(".login_welcome").show();
                    $(".login_welcome_email").html(email);
                    $(".login_enter_pass_div").show();
                    $(".login_form").attr("action", "/login");
                } else {
                    hideAllLogin();
                    $(".login_new_message").show();
                    $(".login_new_pass_div").show();
                    $(".login_form").attr("action", "/new_user");
                }
            });
        } else {
            hideAllLogin();
            $(".login_checking").show();
            $(".login_prompt").show();
        }
    }

    function hideAllLogin() {
        $(".login_blank").hide();
        $(".login_prompt").hide();
        $(".login_checking").hide();
        $(".login_welcome").hide();
        $(".login_new_message").hide();
        $(".login_enter_pass_div").hide();
        $(".login_new_pass_div").hide();
    }
	

    /*****************
     * Controls basic interaction with the share bar on the view page
     */
    var originalShareText = "<div id='prompt'>Copy this Link:</div><div id='chrome_fix_div'><div id='link'><input id='share_link_value' type='text' value='"+window.location+"' /></div></div>";
	$("#share_area").hover(function() {
		$("#share_link_area").show();
		$("#share_area #share_link_value").focus();
		$("#share_area #share_link_value").select();
	}, function(e) {
        if (e.target == this || $(e.target).attr("id") == "share_bar" || $(e.target).attr("id") == "chrome_fix_div" || $(e.target).attr("id") == "share_link_area") {
            $("#share_link_area").hide();
            $("#share_area #share_link_area").html(originalShareText);
        }
	});
    $("#share_area").mousedown(function() {
        $("#share_area #share_bar").css("background", "#11b0aa url(/static/images/share_hover.jpg) no-repeat top left");
        $("#share_area #share_link_area").css("background", "#11b0aa");
    });
    $("#share_area").mouseup(function() {
        $("#share_area #share_bar").css("background", "#189792 url(/static/images/share_default.jpg) no-repeat top left");
        $("#share_area #share_link_area").css("background", "#189792");
		$("#share_area #share_link_value").focus();
		$("#share_area #share_link_value").select();
    });

    $("#share_area").bind("copy", function() {
        var share_link_area_text = "<div id='prompt'>Copied to clipboard! Give to friends! Any of them with this link can add their photos too.</div>"
        $("#share_area #share_link_area").html(share_link_area_text);
    });

    $("#alert_bar #share").click(function() {
        $("#share_link_area").show();
    });
    $("#alert_bar #hide_this").click(function() {
        $("#alert_bar").hide('fast');
    });


    /* ************************************************* *
     * Control Hover action on artifact divs
     * **************************************************/

    $("#add_artifact").hover(function(){
        $(".blue_hover").css("color", "#11b0aa");
    }, function(){
        $(".blue_hover").css("color", "#189792");
    });
    $("#add_artifact").click(function() {
        if (window.zoomedIn == true) {
            doUnZoom();
        }
    })

    $(".artifact").live("mouseenter", function() {
        if (window.zoomedIn == false) {
            $(this).children(".hide_photo").show();
            artifactExpand($(this));
        }
    }).live("mouseleave", function() {
        if (window.zoomedIn == false) {
            $(this).children(".hide_photo").hide();
            artifactUnExpand($(this));
        }
    });

    $(".photo_container").live("click",function() {
        if ($(this).parents(".artifact").hasClass("no_crop")) {
            return;
        }
        zoomToArtifact($(this).parent(".artifact"));
    });
    
    /* ************************************************* *
     * Detect Scroll
     * **************************************************/
    $(window).mousewheel(function(e){
        if (window.zoomedIn == true) {
            e.preventDefault();
        }
    });

    /* ************************************************* *
     * Detect Arrow Keys
     * **************************************************/
    $(window).keydown(function(key) {
        if (key.keyCode == 37) {
            // LEFT
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                leftArtifact = getArtifactDivByRowPos(artifactDiv.row, artifactDiv.posInRow + 1);
                if (leftArtifact !== false) {
                    doZoom("#"+leftArtifact.id);
                } else {
                    // Look at the next row up on the other end
                    rowChange = getArtifactDivByRowPos(artifactDiv.row - 1, 0);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 38) {
            // UP
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                aboveArtifact = getArtifactDivByRowPos(artifactDiv.row - 1, artifactDiv.posInRow);
                if (aboveArtifact !== false) {
                    doZoom("#"+aboveArtifact.id);
                } else {
                    // There's probably one, but we're too far out.
                    rowChange = getArtifactDivByRowPos(artifactDiv.row - 1, getArtifactDivRowLength(artifactDiv.row-1) - 1);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 39) {
            // RIGHT
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                rightArtifact = getArtifactDivByRowPos(artifactDiv.row, artifactDiv.posInRow - 1);
                if (rightArtifact !== false) {
                    doZoom("#"+rightArtifact.id);
                } else {
                    // Look at the next row down on the other end
                    rowChange = getArtifactDivByRowPos(artifactDiv.row + 1, getArtifactDivRowLength(artifactDiv.row+1) - 1);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 40) {
            // DOWN
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                belowArtifact = getArtifactDivByRowPos(artifactDiv.row + 1, artifactDiv.posInRow);
                if (belowArtifact !== false) {
                    doZoom("#"+belowArtifact.id);
                } else {
                    // There's probably one, but we're too far out.
                    rowChange = getArtifactDivByRowPos(artifactDiv.row + 1, getArtifactDivRowLength(artifactDiv.row+1) - 1);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 8) {
            // BACKSPACE
            if (window.zoomedIn == true) {
                key.preventDefault();
                doUnZoom();
            }
        } else if (key.keyCode == 13) {
            // ENTER
            if (window.zoomedIn == true) {
                key.preventDefault();
                doUnZoom();
            }
        } else if (key.keyCode == 27) {
            // ESCAPE
            if ($("#canvas_login_div:visible").length > 0) {
                $("#canvas_login_div").hide();
                $("#canvas_login_prompt").show();
            }
            if (window.zoomedIn == true) {
                key.preventDefault();
                doUnZoom();
            }
        }
    });
    
    /* ************************************************* *
     * STREAM PAGE
     * **************************************************/
	$("span.anchorLink").anchorAnimate()

    updateStreamGrab();
    $(window).scroll(function() {
       updateStreamGrab(); 
    });

    $(".memory_div .forget").hover(function() {
        $(this).parents(".memory_div").removeClass("memory_shadow");
    }, function() {
        $(this).parents(".memory_div").addClass("memory_shadow");
    });
    $(".memory_div .forget").click(function(){
        var id = parsePrefixToString($(this).parents(".memory_div").attr("id"),"memdiv_");

        $.post("/forget_memory", {'id':id});

        $(this).parents(".memory_div").hide('fast', function(){
            if (window.timers[$(this).parents(".memory_div").attr("id")]) {
                clearInterval(window.timers[id]);
                delete window.timers[id];
            }

            var mem_title = $(this).find(".mem_title").html();
            var mem_url = $(this).children(".mem_link").attr("href");
            var forgotText = "<div class='forgotten_item'><a href="+mem_url+">"+mem_title+"</a></div>"
            $("#forgotten_list").append(forgotText);

            $(this).parents(".memory_div").remove();
            $("#table_of_contents").children("#toc_"+id).remove();

            $("#forgotten_memories").show();
            $("#forgot_hide").show();
            $("#forgot_show").hide();
            $("#forgotten_list").show();
        
            updateStreamGrab();
        });
    });
    $("#forgot_show_click").click(function() {
        $("#forgot_show").hide();
        $("#forgot_hide").show();
        $("#forgotten_list").show();
    });
    $("#forgot_hide_click").click(function() {
        $("#forgot_hide").hide();
        $("#forgot_show").show();
        $("#forgotten_list").hide();
    });

	


	updateArtifactDivs();
});

/**
 * Checks to see if any canvases on the stream page should be scrolling photos.
 * We only activate timers for those that are visible at any given time.
 * We remove times for those that are unvisible.
 * Since the timers make server calls every 3 or 4 seconds (randomly), it's important
 * to have a few going as possible at any given time
 */
function updateStreamGrab() {
    var scroll_top = $(window).scrollTop() - 250;
    var scroll_bottom = $(window).scrollTop() + $(window).height();

    $(".memory_div").each(function() {
        var parsedId = parsePrefixToString($(this).attr("id"), "memdiv_");
        if ($(this).offset().top > scroll_top && $(this).offset().top < scroll_bottom) {
            $("#marker_"+parsedId).css("background","#ebebeb");
        } else {
            $("#marker_"+parsedId).css("background","#666");
        }
        
        if ($(this).hasClass("more_photos")){
            var id = $(this).attr('id');
            if ($(this).offset().top > scroll_top && $(this).offset().top < scroll_bottom) {
                // It's in the viewport, make sure there's a timer for it
                randomnumber=Math.floor(Math.random()*3000) + 4000;
                if (!window.timers[id]) {
                    var t = setInterval("randPhoto('"+id+"')", randomnumber);
                    window.timers[id] = t;
                }
            } else {
                // It's not in the viewport, remove the timer if any
                if (window.timers[id]) {
                    clearInterval(window.timers[id]);
                    delete window.timers[id];
                }
            }
        }
    });

}

/** Fills in images based on viewport
 */

function randPhoto(mem_id,numTries) {
    var cropped_mem_id = mem_id.slice(7,mem_id.length);
    var previews = $("#memdiv_" + cropped_mem_id).find(".artifact_previews");
    var noContent = false;
    $.getJSON("/get_rand_photo", {"mem_id":cropped_mem_id}, function(json){
        var content = "<div class='artifact_item'><img src='"+json.thumb_url+"' height='200px'/></div>";
        $(previews).find("img").each(function () {
            if ($(this).attr("src") == json.thumb_url || !content) {
                // Bail and try again if we're just going to load an image that's already in the queue.
                noContent = true;
            }
        });

        if (noContent == true) {
            if (numTries) {
                if (numTries > 5) {
                    return;
                } else {
                    numTries ++;
                }
            } else {
                numTries = 1;
            }
            randPhoto(mem_id,numTries);
            return;
        }

        $(previews).append(content);
        var moveAmount = $(previews).children(".artifact_item:first").width() + 10;
        $(previews).animate({
            left:-moveAmount
        }, 'slow', function(){
            if (noContent == false) {
                $(previews).children(".artifact_item:first").remove();
                $(previews).css("left", "0");
            }
        });
    });
}


/**
 * Expands the preview of the current artifact and shrinks
 * the surrounding artifacts so it fits properly
 */
function artifactExpand(artifact) {
    var a_div = getArtifactDivByID($(artifact).attr("id"));
    var left_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow + 1);
    var slack = a_div.realWidth - a_div.croppedWidth;

    $("#"+a_div.id).stop(true,false);
    if (left_ofDiv !== false){
        $("#"+left_ofDiv.id).stop(true,false);
    }
    if (right_ofDiv !== false){
        $("#"+right_ofDiv.id).stop(true,false);
    }

    $("#"+a_div.id).animate({width:a_div.realWidth}, 'fast');
    
    $("#"+a_div.id).children(".photo_container").animate({left:0}, 'fast');

    if (left_ofDiv !== false && right_ofDiv !== false) {
        // This means there are items to both the left AND right
        var leftWidth = left_ofDiv.croppedWidth - slack / 2;
        var rightWidth = right_ofDiv.croppedWidth - slack / 2;
        $("#"+left_ofDiv.id).animate({width:leftWidth},'fast');
        $("#"+right_ofDiv.id).animate({width:rightWidth},'fast');
    } else if (left_ofDiv === false && right_ofDiv !== false) {
        // This means our artifact is on the far left margin
        var rightWidth = right_ofDiv.croppedWidth - slack;
        $("#"+right_ofDiv.id).animate({width:rightWidth},'fast');
    } else if (left_ofDiv !== false && right_ofDiv === false) {
        // This means our artifact is on the far right margin
        var leftWidth = left_ofDiv.croppedWidth - slack;
        $("#"+left_ofDiv.id).animate({width:leftWidth},'fast');
    } else {
        // This means our div is all by itself on the row
    }
}
function artifactUnExpand(artifact) {
    
    var a_div = getArtifactDivByID($(artifact).attr("id"));
    var left_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow + 1);

    var centering = (a_div.realWidth - a_div.croppedWidth) / -2;
    $("#"+a_div.id).children(".photo_container").animate({left:centering}, 'fast');

    $("#"+a_div.id).stop(true,false);
    $("#"+a_div.id).animate({width:a_div.croppedWidth}, 'fast');

    if (left_ofDiv !== false) {
        $("#"+left_ofDiv.id).stop(true,false);
        $("#"+left_ofDiv.id).animate({width:left_ofDiv.croppedWidth},'fast');
    }
    if (right_ofDiv !== false) {
        $("#"+right_ofDiv.id).stop(true,false);
        $("#"+right_ofDiv.id).animate({width:right_ofDiv.croppedWidth},'fast');
    }
}




/*
 * STRATEGY:
 * On click, load in existing artifacts
 * Modify them to specify what div area they must be placed in
 * Move all of the divs
 * Calculate the zoom coordinates of the div
 * Handle the zoom.
 */


/**
 * Takes a jquery element as the zoom target.
 * The zoom target must have the class 'artifact'
 * It must be visible within the canvas area
 */
function zoomToArtifact(artifact) {
    if (window.zoomedIn == false) {
        updateContainerDivs(artifact); // Modify the artifactDivs data structure
        updateModifiedArtifactDivs(); // Move the divs to the appropriate spots
    }
    doZoom(artifact); // Actually do the transform
}

/**
 * Updates the global window.artifactDivs data structure to indicate
 * where the various photos should go
 */
function updateContainerDivs(artifact) {
    // Create a local copy to perform updates on then update the global
    var _artifactDivs = $.extend(true, [], window.artifactDivs);
    var scroll_top = $(window).scrollTop();
    var scroll_bottom = $(window).scrollTop() + $(window).height();
    var artifactTop = $(artifact).offset().top;

    var zoom_top;
    var zoom_bottom;

    if ((artifactTop - MARGIN_WIDTH - ARTIFACT_HEIGHT) <= scroll_top) {
        // This means we need to add an extra row to the zoom_top
        zoom_top = artifactTop - MARGIN_WIDTH - ARTIFACT_HEIGHT;
    } else {
        zoom_top = scroll_top - (ARTIFACT_HEIGHT - 60);
    }

    if ((artifactTop + ARTIFACT_HEIGHT + MARGIN_WIDTH) >= scroll_bottom) {
        // This means we need to add an extra row to the zoom_bottom
        zoom_bottom = scroll_bottom + MARGIN_WIDTH + ARTIFACT_HEIGHT;
    } else {
        zoom_bottom = scroll_bottom + (ARTIFACT_HEIGHT - 60);
    }

    var adiv_length = _artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var a_top = $("#"+_artifactDivs[i].id).offset().top;
        if (a_top < zoom_top) {
            // This should be above the zoom div
            _artifactDivs[i].divArea = "above_zoom_div";
        } else if (a_top >= zoom_top && a_top <= zoom_bottom) {
            // This should be in our zoom div
            _artifactDivs[i].divArea = "in_zoom_div";
        } else if (a_top > zoom_bottom) {
            // This should be below the zoom div
            _artifactDivs[i].divArea = "below_zoom_div";
        } else {
            // We've got a problem
        }
    }
    
    window.artifactDivs = _artifactDivs;
    
}

/**
 * This is called from doUnZoom and adds some divs to the bottom
 * of #in_zoom_div so we don't get a wonky zoom out effect
 */
function addBottomContainers() {
    var scroll_top = $(window).scrollTop() + 70;
    var scroll_bottom = $(window).scrollTop() + $(window).height();

    $("#below_zoom_div").children(".artifact_row").each(function (){
        var a_top = $(this).offset().top;
        if (a_top <= scroll_bottom && a_top >= scroll_top) {
            // This should be above the zoom div
            $("#in_zoom_div").append($(this));
        } 
    });
}


/**
 * ====================== NOTES ON ZOOMING BROWSER DETAILS ==========
 * We adjust the left and top css position properties because they
 * reliably work across all browsers.
 *
 * !!! Left and Top are NOT affected by the scale. They are applied BEFORE
 * the zoom. This is true in both Chrome and Firefox. This represents the
 * position without any transform business
 *
 * !!! Offset and Position ARE affectd by the scale. They are calculated
 * by jquery after the scale happens. This represents the TRUE top and left
 * of a div after the scale is applied. This is true in both Chrome and FF
 *
 * !!! For elements INSIDE a scaled div, for example, the .artifacts inside
 * of #in_zoom_div, the behavior is DIFFERENT between browsers
 *     In CHROME, the position is calculated AFTER the scale
 *     In FIREFOX, the position is calculated BEFORE the scale
 *     The two numbers will be different by a the scale factor
 *
 * !!! The width and height for elements inside of a scaled div
 * (like .artifacts inside of #in_zoom_div) do NOT change depending
 * on the scale. This means if you want to translate by one of these
 * dimensions for a scaled div, you must multiply the dimension by the
 * scale factor
 *
 */


/**
 * Zoom in on an artifact. Assume it's already in the #in_zoom_div
 */
function doZoom(artifact) {
    if ($("#alert_bar:visible").length > 0) {
        $("#alert_bar").hide('fast');
    }
    $("#artifact_wrapper").height($("#in_zoom_div").height()*window.scaleFactor);

    var artifactDiv = getArtifactDivByID($(artifact).attr("id"));
    var zoomDivWidth = $("#in_zoom_div").width();
    var zoomDivHeight = $("#in_zoom_div").height();

    var artifactPos = $(artifact).position();
    if (BrowserDetect.browser == "Firefox" && window.zoomedIn == true) {
        // See zoom notes above as to why we have to do this
        artifactPos.left = artifactPos.left * window.scaleFactor;
        artifactPos.top = artifactPos.top * window.scaleFactor;
    }

    var xOrigin = artifactPos.left / $("#in_zoom_div").width() * 100;
    var yOrigin = artifactPos.top / $("#in_zoom_div").height() * 100;

    var topOffset = 1.5*MARGIN_WIDTH * window.scaleFactor;
    var scrollOffset = $(window).scrollTop();
    var centeringOffset = $("#in_zoom_div").width() / 2 - (artifactDiv.realWidth / 2 * window.scaleFactor);
    var expansionOffset = (artifactDiv.realWidth - artifactDiv.croppedWidth) * window.scaleFactor;

    $("#above_zoom_div").css("visibility", "hidden");
    $("#below_zoom_div").css("visibility", "hidden");

    var aboveZoomDivHeight = $("#above_zoom_div").height();

    var newPosX = artifactPos.left - centeringOffset - expansionOffset;
    var newPosY = artifactPos.top - scrollOffset - topOffset + aboveZoomDivHeight;

    //var xTranslate = posXToLeft(newPosX, zoomDivWidth, window.scaleFactor, xOrigin);
    //var yTranslate = posYToTop(newPosY, zoomDivHeight, window.scaleFactor, yOrigin, aboveZoomDivHeight);
    var xTranslate = newPosX;
    var yTranslate = newPosY;

    $(artifact).children(".hide_photo").hide();

    if (window.zoomedIn == false) {
        $("#in_zoom_div").transform({origin:[xOrigin+'%', yOrigin+'%']});
        $("#in_zoom_div").animate({
            scaleX: window.scaleFactor,
            scaleY: window.scaleFactor,
            left: - xTranslate + 'px',
            top: - yTranslate + 'px'
        },'slow');

        $("#canvas_footer").animate({
            bottom:'-60px'
        }, 'slow');

        window.zoomedIn = true;
    } else if (window.zoomedIn == true) {

        // This means we're already zoomed in
        var previousArtifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
        
        if (window.previousZoomTarget) {
            if ($(window.previousZoomTarget).attr("id") == $(artifact).attr("id")) {
                // This means we've clicked on the same thing
                doUnZoom();
                return
            }

            // Return the previous photo to its normal cropped state
            var previousArtifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
            artifactUnExpand(window.previousZoomTarget);
        }

        $("#in_zoom_div").animate({
            origin: ['0%', '0%'],
            scaleX: window.scaleFactor,
            scaleY: window.scaleFactor,
            left: - xTranslate + 'px',
            top: - yTranslate + 'px',
        },'fast', function() {
            // As soon as we're done panning, we need to see if we
            // need to update #in_zoom_div. This will happen any time
            // we pan up or down since we need to add or pop rows
            // accordingly

            updateInZoomDivPan(artifactDiv, previousArtifactDiv);
        });
    }
    // Be sure we're looking at an expanded photo with no cruft on it
    artifactExpand(artifact);

    window.previousZoomTarget = artifact;
}


/**
 * Zoom Transforms ================================
 * We need transform functions to interchange between the CSS top and left
 * values we get out of our divs and the position properties that is returned
 * by jQuery. Position is relative to the enclosing container. Top and Left are
 * the relative offset positions of the divs before the transform is applied.
 *
 * The transform needs to take into account the scale origins as well since that
 * affects the positioning of the elements.
 *
 * This has been tested to be true in Chrome and Firefox
 */
function posYToTop(posY, height, scale, yOrigin, aboveHeight) {
    return posY + (height * scale * yOrigin)/200 - aboveHeight;
}
function topToPosY(div_top, height, scale, yOrigin, aboveHeight) {
    return (div_top + aboveHeight) - (height * scale * yOrigin)/200;
}
function posXToLeft(posX, width, scale, xOrigin) {
    return posX + (width * scale * xOrigin)/200;
}
function leftToPosX(div_left, width, scale, xOrigin) {
    return div_left - (width * scale * xOrigin)/200;
}

/**
 * After a pan has been completed when looking at zoomed-in photos, we may have to update
 * the #in_zoom_div to add or remove rows. This detects whether or not this has
 * to happen and then moves the rows in place without changing the relative viewport
 * 
 * artifactDiv and previousArtifactDiv are ArtifactDiv objects
 */
function updateInZoomDivPan(artifactDiv, previousArtifactDiv) {
    // Now we need to see if we're navigating up or down. If so, we need to try and grab another row to add to the #in_zoom_div
    var previousRow = previousArtifactDiv.row;
    var currentRow = artifactDiv.row;

    if (previousRow != currentRow) {
        // First see what the first and last rows of #in_zoom_div are so we can grab the correct row
        
        var initialAboveHeight = $("#above_zoom_div").height();
        var initialPosition = $("#in_zoom_div").position();
        var initialScrollTop = $(window).scrollTop();

        var first_num = $("#in_zoom_div").children(".artifact_row:first").attr("id");
        if (first_num) {
            first_num = first_num.slice(4,first_num.length); // Take off the "row_" prefix
            first_num = Number(first_num);
        }
        var last_num = $("#in_zoom_div").children(".artifact_row:last").attr("id");
        if (last_num) {
            last_num = last_num.slice(4,last_num.length); // Take off the "row_" prefix
            last_num = Number(last_num);
        }

        if (previousRow > currentRow) {
            // PAN UP ------------------
            // This means we've clicked a photo above the last one we were just at.
            // I want to pop off everything plus 2 rows (inclusive) below me
            // I want to make sure the row above me and two rows above me exists
            var cutOffRow = currentRow + 2;
            var includeUpToRow = currentRow - 2;
            
            $("#in_zoom_div").children(".artifact_row").each(function() {
                thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                if (thisRow === null) {
                    return;
                }
                if (thisRow > cutOffRow ) {
                    // Any row too far below gets moved into #below_zoom_div
                    $("#below_zoom_div").prepend($(this));
                }
                if (thisRow < includeUpToRow) {
                    // Any row too far above gets moved into #above_zoom_div
                    $("#above_zoom_div").append($(this));
                }
            });

            $("#above_zoom_div").children(".artifact_row").each(function() {
                thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                if (thisRow === null) {
                    return;
                }
                if (thisRow >= includeUpToRow ) {
                    // Any row that's above me that's supposed to be in #in_zoom_div gets moved in
                    $("#in_zoom_div").prepend($(this));
                }
            });

        } else if (previousRow < currentRow) {
            // PAN DOWN -----------
            // This means we've clicked an artifact below the last one we were just at.
            // I want to pop off everything minus 2 rows (inclusive) and above of me.
            // I want to try and make sure that the row below me and two rows below
            // me exist
            var cutOffRow = currentRow - 2;
            var includeUpToRow = currentRow + 2;

            if (currentRow < window.numRows) {
                // Don't change stuff if we've reached the last row
                // This prevents a visual glitch related to the fact that scroll
                // can't scroll beyond the bottom of the page
                $("#in_zoom_div").children(".artifact_row").each(function() {
                    thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                    if (thisRow === null) {
                        return;
                    }
                    if (thisRow < cutOffRow ) {
                        // Any row too far above gets moved into #above_zoom_div
                        $("#above_zoom_div").append($(this));
                    }
                    if (thisRow > includeUpToRow) {
                        // Any row too far below gets moved into #below_zoom_div
                        $("#below_zoom_div").prepend($(this));
                    }
                });

                $("#below_zoom_div").children(".artifact_row").each(function() {
                    thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                    if (thisRow === null) {
                        return;
                    }
                    if (thisRow <= includeUpToRow ) {
                        // Any row that's below me that's supposed to be in #in_zoom_div gets moved in
                        $("#in_zoom_div").append($(this));
                    }
                });
            }
        }
        
        var postAboveHeight = $("#above_zoom_div").height();
        var postPosition = $("#in_zoom_div").position();

        // Now that the rows have been moved, we need to reposition the div and scroll accordingly
        var aboveHeightDiff = postAboveHeight - initialAboveHeight;
        var positionDiff = postPosition.top - initialPosition.top ;
        positionDiff = positionDiff * window.scaleFactor;

        var newTop = parseCssPx($("#in_zoom_div").css("top")) + positionDiff;

        $("#in_zoom_div").css("top",newTop);

        $(window).scrollTop(initialScrollTop + aboveHeightDiff);
        //var newTop = parseCssPx($("#in_zoom_div").css("top")) + positionDiff + aboveHeightDiff;

    }

}


/**
 * Undoes the zoom. Updates the globals and resets the zoom parameters
 */
function doUnZoom() {
    window.zoomedIn = false;

    // Need to add some from #below_zoom_div to #in_zoom_div before we zoom out
    
    addBottomContainers(); // Modify the artifactDivs data structure

    $("#above_zoom_div").css("visibility", "visible");
    $("#below_zoom_div").css("visibility", "visible");
    $("#canvas_footer").animate({
        bottom:'0px'
    }, 'slow');
    $("#in_zoom_div").animate({
        scaleX: 1,
        scaleY: 1,
        left: 0,
        top: 0
    },'slow', function() {
        $("#artifact_wrapper").height('auto');
    });
}



/** loadartifacts([offset[, end]])
 * Loads the artifacts in json format for this memory
 *
 * For the given memory, loads just the containers for all of the artifacts
 * It also places those containers on the page and calls the progressive
 * artifact content loader.
 *
 * @param offset - The photo index to start loading from
 * @param numartifacts - The number of artifacts to pull
 *
 * @returns Void
 *
 */
function loadartifacts(offset, numartifacts) {
    loaded_artifacts = null;
    memory_id = $("#memory_id").html();
    if ($("#hidden_prompt").hasClass("showing_hidden")) {
        show_hidden = 1;
    } else {show_hidden = 0;}

    $.post("/get_artifacts/"+memory_id, {"offset":offset, "numartifacts":numartifacts, "show_hidden":show_hidden}, function(data) {
        window.artifacts = data;
        loadViewportPhotos();
    });
}

function loadViewportPhotos() {
    if (window.artifacts == "") {return false;}
    var load_top = $(window).scrollTop() - 200;
    var load_bottom = $(window).scrollTop() + $(window).height() + 700;

    var artifacts = jsonParse(window.artifacts);

    for (var i in artifacts) {
        var artifact = artifacts[i];
        var artifact_top = $("#artifact_"+artifact.id).offset().top;
        if (artifact_top >= load_top && artifact_top <= load_bottom) {
            var div_width = $("#artifact_"+artifact.id).width();
            var photo_width = $("#artifact_"+artifact.id).children(".photo_container").width();
            var centering = (photo_width - div_width) / -2;

            var imgdiv = "<img src="+artifact.thumb_url+" height='"+ARTIFACT_HEIGHT+"' width='"+artifact.width+"' class='photo'/>"
            $("#artifact_"+artifact.id).children(".photo_container").css('left', centering);
            $("#artifact_"+artifact.id).children(".photo_container").html(imgdiv);
        }
    }
}


function randomString() {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 20;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
    return randomstring;
}














/* STRATEGY:
 * First compute the row, div area, and width of each element on the page
 * Then detect the elements that need to be moved
 * Move the elements to the correct locations.
 */

function ArtifactDiv() {
    this.id = undefined;
    this.noCrop = undefined;
    this.realWidth = undefined;
    this.croppedWidth = undefined;
    this.row = undefined;
    this.posInRow = undefined;
    this.divArea = undefined;
    this.display = undefined;
}

function getArtifactDivByID(id) {
    var adiv_length = window.artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.id == id) {
            return artifactDiv;
        }
    }
    return false;
}
function getArtifactDivByRowPos(row, posInRow) {
    var adiv_length = window.artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.row == row && artifactDiv.posInRow == posInRow) {
            return artifactDiv;
        }
    }
    return false;
}
function getArtifactDivRowLength(row) {
    var adiv_length = window.artifactDivs.length;
    var row_length = 0;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.row == row) {
            row_length ++;
        }
    }
    return row_length;
}

/**
 * Creates a data structure that calcaultes the state the artifact divs should be in
 * Then calls the methods to rearrange the page accordingly
 */
function updateArtifactDivs() {
    // Create a new data structure to populate
    var _artifactDivs = [];

    populateArtifacts(_artifactDivs);

    calculateCrop(_artifactDivs);

    moveArtifactDivs(_artifactDivs);

    window.artifactDivs = _artifactDivs;
}

/**
 * Performs the same tasks as updateArtifactDivs except instead of populating a
 * new data structure, it loads in the global one and applies any changes that
 * may have been made to it. This is primarily used with other methods (such as the zoom)
 * modify the global data structure and wish to see changes invoked on the page
 */
function updateModifiedArtifactDivs() {
    // Create a local copy to perform updates on then update the global
    var _artifactDivs = $.extend(true, [], window.artifactDivs);

    calculateCrop(_artifactDivs);

    moveArtifactDivs(_artifactDivs);

    window.artifactDivs = _artifactDivs;
}

/**
 * Fills a list with artifactDiv objects that contain the state of all of
 * the artifacts on the current page
 */
function populateArtifacts(_artifactDivs) {
    $(".artifact").each(function() {
        var artifactDiv = new ArtifactDiv();
        artifactDiv['id'] = $(this).attr("id");
        $(this).hasClass("no_crop") ? artifactDiv['noCrop'] = true : artifactDiv['noCrop'] = false;
        artifactDiv['realWidth'] = getRealWidth($(this));
        $(this).css('display') == "none" ? artifactDiv['display'] = false : artifactDiv['display'] = true;
        artifactDiv['divArea'] = $(this).parents(".zoom_div").attr("id");
        _artifactDivs.push(artifactDiv);
    });
}


/** getRealWidth(artifactDiv)
 *  Determines the width of the artifact by detecting its type.
 *  Photos you calculate differently than videos or tweets
 *
 *  returns the width of the div in pixels
 */
function getRealWidth(artifactDiv) {
    var width = ARTIFACT_HEIGHT;
    if ($(artifactDiv).hasClass("photo")) {
        // The artifact is a photo
        width = $(artifactDiv).children(".photo_container").width();
    }
    else if ($(artifactDiv).hasClass("add_artifact")) {
        // The artifact is the "add artifact" button
        width = $(artifactDiv).width();
        
    } else if ($(artifactDiv).hasClass("upload_file_canvas_div")) {
        // The artifact is a file upload progress box
       width = $(artifactDiv).children(".photo_container").width(); 
    }

    return width;
}

/**
 * artifactDivs - list of artifactDiv objects
 * an artifactDiv object has the properties:
 *  - id
 *  - noCrop
 *  - realWidth
 *  - croppedWidth
 *  - row
 *  - posInRow
 *  - divArea
 *
 * This function should expect that the artifactDiv list
 * has nocrop, id, and realWidth filled in for each element
 *
 * This function calculates and fills in the croppedWidth
 * row, and div_area for each object in the list.
 *
 * It modifies the list objects in place
 *
 * Returns a copy of the artifactDivs
 */
function calculateCrop(artifactDivs) {
    var max_width = $("#artifact_wrapper").width();
    var row_accumulator = [];
    var width_accumulator = 0;

    var rownum = 0;

    var artifactDivs_length = artifactDivs.length;
    for (var i = 0; i < artifactDivs_length; i ++) {
        var artifactDiv = artifactDivs[i];
        if (artifactDiv.display) {
            if (width_accumulator < max_width) {
                width_accumulator += artifactDiv.realWidth + MARGIN_WIDTH;
                row_accumulator.push(i);
                artifactDivs[i].row = rownum;
            } else {

                processRow(row_accumulator, width_accumulator, artifactDivs);

                width_accumulator = 0 + artifactDiv.realWidth + MARGIN_WIDTH;
                row_accumulator = [];
                rownum ++;
                row_accumulator.push(i);
                artifactDivs[i].row = rownum;
            }
        }
    }

    processRow(row_accumulator, width_accumulator, artifactDivs);
}

/**
 * Determines crop amount for a given row and updates the div object
 * Called an used exclusively from calculateCrop
 */
function processRow(row_accumulator, width_accumulator, artifactDivs) {
    
    var max_width = 955;
    var overspill;
    var crop;

    /*
     * We first need to remove all objects that we don't want to crop
     */
    var rowacc_length = row_accumulator.length
    for (var j = 0; j < row_accumulator.length; j++) {
        // we need to recalculate row_accumulator.length each time since we
        // modify the data structure in place with this loop
        if (artifactDivs[row_accumulator[j]].noCrop) {
            rowacc_length -= 1;
            max_width = max_width - artifactDivs[row_accumulator[j]].realWidth - MARGIN_WIDTH - BORDER_WIDTH;
            width_accumulator = width_accumulator - artifactDivs[row_accumulator[j]].realWidth;
            artifactDivs[row_accumulator[j]].croppedWidth = artifactDivs[row_accumulator[j]].realWidth;
            row_accumulator.splice(j,1);
            j -= 1; // Need to decrement the index we because we're removing the artifacts in place
        }
    }

    /*
     * Now we calcaulte and crop the rest
     */
    if (width_accumulator >= max_width && width_accumulator > 0 && max_width > 0) {
        overspill = width_accumulator - max_width;
        crop = Math.floor(overspill / rowacc_length);

        var row_width_accumulator = 0;
        for (var k = 0; k < rowacc_length; k ++) {
            var artifact_id = row_accumulator.pop();
            artifactDivs[artifact_id].posInRow = k;
            if (k == rowacc_length - 1) {
                // This means we're on the last photo. It should take up the remaining slack
                var new_width = max_width - row_width_accumulator - MARGIN_WIDTH;
                artifactDivs[artifact_id].croppedWidth = new_width;
            } else {
                var new_width = artifactDivs[artifact_id].realWidth - crop;
                artifactDivs[artifact_id].croppedWidth = new_width;
            }

            row_width_accumulator += artifactDivs[artifact_id].croppedWidth + MARGIN_WIDTH;
        }
    } else {
        // This means that the photos don't need to be cropped. Let's just copy in the
        // appropriate width then
        for (var k = 0; k < rowacc_length; k ++) {
            var artifact_id = row_accumulator.pop();
            artifactDivs[artifact_id].posInRow = k;
            var real_width = artifactDivs[artifact_id].realWidth;
            artifactDivs[artifact_id].croppedWidth = real_width;

        }
    }
}

/**
 * Given a fully populated list of artifactDivs, this method moves the divs to the appropriate
 * location on the page. It, however first checks to see if the div is already in the
 * correct location. If it is, it does not move it
 */
function moveArtifactDivs(artifactDivs) {
    var adivs_length = artifactDivs.length;
    for (var i=0; i < adivs_length; i++) {
        var artifactDiv = artifactDivs[i];

        if (artifactDiv.row > window.numRows) {
            window.numRows = artifactDiv.row;
        }

        if (!artifactDiv.id || !artifactDiv.croppedWidth || !artifactDiv.divArea) {
            console.log("ERROR: artifactDiv has undefined terms");
            console.log(artifactDiv);
        }

        if (artifactDiv.croppedWidth && $("#"+artifactDiv.id).width() != artifactDiv.croppedWidth) {
            $("#"+artifactDiv.id).width(artifactDiv.croppedWidth);
        }
        
        var row_num = $("#"+artifactDiv.id).parents(".artifact_row").attr("id");
        row_num = row_num.slice(4,row_num.length); // Take off the "row_" prefix
        row_num = Number(row_num);

        if (artifactDiv.row > row_num) {
            if ($("row_"+artifactDiv.row).length) {
                $("#row_"+artifactDiv.row).prepend($("#"+artifactDiv.id));
            } else {
                // We need to make a new row first
                new_row = "<div class='artifact_row' id='row_"+artifactDiv.row+"'></div>"
                $("#"+artifactDiv.divArea).append(new_row);
                $("#row_"+artifactDiv.row).prepend($("#"+artifactDiv.id));
            }
        } else if (artifactDiv.row < row_num) {
            $("#row_"+artifactDiv.row).append($("#"+artifactDiv.id));
        } else {
            // Do nothing. leave it where it is.
        }

        // Move the rows to be in the correct div area
        
        var zoom_div = $("#"+artifactDiv.id).parents(".zoom_div").attr("id");
        if (artifactDiv.divArea != zoom_div) {
            // If we're not in the correct area, we should move the row
            var first_num = $("#"+artifactDiv.divArea).children(".artifact_row:first").attr("id");
            var last_num = $("#"+artifactDiv.divArea).children(".artifact_row:last").attr("id");
            if (first_num) {
                first_num = first_num.slice(4,first_num.length); // Take off the "row_" prefix
                first_num = Number(first_num);
            } else {first_num = -1;}
            if (last_num) {
                last_num = last_num.slice(4,last_num.length); // Take off the "row_" prefix
                last_num = Number(last_num);
            } else {last_num = 999999;}

            if (first_num == -1) {
                // This means the row doesn't have any divs in it yet. Doesn't matter whether
                // or not I append or prepend
                $("#"+artifactDiv.divArea).append($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num < first_num) {
                $("#"+artifactDiv.divArea).prepend($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num > last_num) {
                $("#"+artifactDiv.divArea).append($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num == first_num) {
                // This shouldn't happen. Why do we have a duplicate row!
                console.warn("Warning: Duplicate rows when trying to move rows in between divs");
                $("#"+artifactDiv.divArea+" row_"+row_num).remove();
                $("#"+artifactDiv.divArea).prepend($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num == last_num) {
                // This shouldn't happen. Why do we have a duplicate row!
                console.warn("Warning: Duplicate rows when trying to move rows in between divs");
                $("#"+artifactDiv.divArea+" row_"+row_num).remove();
                $("#"+artifactDiv.divArea).append($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num > first_num && row_num < last_num){
                $("#"+artifactDiv.divArea).children(".artifact_row").each(function() {
                    var iter_row_num = $(this).attr("id");
                    iter_row_num = iter_row_num.slice(4,iter_row_num.length);
                    iter_row_num = Number(iter_row_num);
                    if (artifactDiv.row >= iter_row_num) {
                        $("#"+artifactDiv.id).parents(".artifact_row").insertAfter($(this));
                    }
                })
            }
        }
    }
}












function wrapResize(adjustment) {
    adjustment = typeof(adjustment) != 'undefined' ? adjustment : 0;
    var standard_offset = 255;

    // The zoomHeight is how big we want to scale images relative to the height
    // of the page 60 is the height of the top bar
    window.zoomHeight = ($(window).height() - 60) * (1 - (3.5 * MARGIN_WIDTH / ARTIFACT_HEIGHT));
    if (window.zoomHeight > 175) {
        window.scaleFactor = window.zoomHeight / ARTIFACT_HEIGHT;
    } else {
        window.scaleFactor = 1;
    }

	$('#landing_wrapper').css("top", function() {
		if ($(window).height() > 300) {
			return $(window).height() / 2 - (standard_offset + adjustment);
		} else {
			return -30;
		}
	});
	
	//$('#header_accent_bar').height($('#canvas_header').height());
}


function parseCssPx(css_string) {
    var out = Number(css_string.slice(0,css_string.length - 2));
    if (!isNaN(out)) {
        return out;
    } else {
        return null;
    }
}

function parsePrefixToNum(fullString, prefixString) {
    var out = Number(fullString.slice(prefixString.length,fullString.length));
    if (!isNaN(out)) {
        return out;
    } else {
        return null;
    }
}
function parsePrefixToString(fullString, prefixString) {
    var out = fullString.slice(prefixString.length,fullString.length);
    if (out.length > 0) {
        return out;
    } else {
        return null;
    }
}

var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "Chrome"
		},
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			   string: navigator.userAgent,
			   subString: "iPhone",
			   identity: "iPhone/iPod"
	    },
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};

/*******

	***	Anchor Slider by Cedric Dugas   ***
	*** Http://www.position-absolute.com ***
	
	Never have an anchor jumping your content, slide it.

	Don't forget to put an id to your anchor !
	You can use and modify this script for any project you want, but please leave this comment as credit.
	
*****/

jQuery.fn.anchorAnimate = function(settings) {

 	settings = jQuery.extend({
		speed : 200
	}, settings);	
	
	return this.each(function(){
		var caller = this;
		$(caller).mouseenter(function (event) {	
			event.preventDefault();
			var elementClick = $(caller).attr("id");
			
			var destination = $("#"+elementClick+"_anchor").offset().top;
			$("html:not(:animated),body:not(:animated)").stop(true, true);
			$("html:not(:animated),body:not(:animated)").animate({ scrollTop: destination}, settings.speed, function() {
			});
		  	return false;
		})
	})
}
/*
 * jQuery Input Hint Overlay plugin v1.1.14, 2010-12-14
 * Only tested with jQuery 1.4.1 (early versions - YMMV)
 * 
 *   http://jdeerhake.com/inputHintOverlay.php
 *   http://plugins.jquery.com/project/inputHintOverlay
 *   http://github.com/jdeerhake/inputHintOverlay
 *
 *
 * Copyright (c) 2010 John Deerhake
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
jQuery.fn.inputHintOverlay = function (topNudge, leftNudge, useChangeEvent) {
	topNudge = typeof(topNudge) != 'undefined' ? topNudge : 0;
	leftNudge = typeof(leftNudge) != 'undefined' ? leftNudge : 0;
	useChangeEvent = typeof(useChangeEvent) != 'undefined' ? useChangeEvent : false;
	var suffix = 'jqiho';
	return this.each(function (){
		var curParent = jQuery(this);
		var textAreas = jQuery(this).find("textarea");
		var pass = jQuery(this).find("input[type=password]")
		jQuery(this).find("input[type=text]").add(textAreas).add(pass).each(function() {
			var relHint = jQuery(this).attr('title');
			var curValue = jQuery(this).attr('value');
			var inp = jQuery(this);
			var safeHint;
			var newDiv;
			if(relHint) {
				safeHint = relHint.replace(/[^a-zA-Z0-9]/g, '');
				jQuery(this).wrap("<div class='inputHintOverlay' style='position:relative' id='wrap" + safeHint + suffix + "' />");
				var wrap = jQuery(this).parent();
				var newPos = jQuery(this).position();
				newZ = jQuery(this).css('z-index');
				if(newZ == "auto") newZ = "2000";
				else newZ = newZ + 20;
				var newCSS = {
					'position' : 'absolute',
					'z-index' : newZ,
					'left' : newPos['left'] + leftNudge,
					'top': newPos['top'] + topNudge,
					'cursor' : 'text'
				};
				newDiv = jQuery(document.createElement('label'))
					.appendTo(wrap)
					.attr('for', jQuery(this).attr('id'))
					.attr('id', safeHint + suffix)
					.addClass('inputHintOverlay')
					.html(relHint)
					.css(newCSS)
					.click(function() {
						jQuery(this).toggle(false);
						inp.trigger("focus");
					});
			}
			if(newDiv){
				if(curValue) {
					newDiv.toggle(false);
				}
				jQuery(this).focus(function() {
					newDiv.toggle(false);
				});
				if(useChangeEvent){
					jQuery(this).change(function() {
						var element = jQuery(this);
						newDiv.toggle(jQuery(this).attr('value') == "");
					});
				}else{
					jQuery(this).blur(function() {
						if (jQuery(this).attr('value') == "") { newDiv.toggle(true); }
					});
				}
			}
		});
	});
}
