// JavaScript Document
var maxPhotoSize = 0;
var originalCanvasWidth;
var MARGIN_WIDTH = 10; // set a global margin
var BORDER_WIDTH = 4; // set a global margin
var ARTIFACT_HEIGHT = 175; // The standard height of all artifacts
var WRAPPER_WIDTH = 955;
window.artifacts = [] // A global that holds json representations of all returned artifacts
window.artifactDivs; // A global used to keep track of the position of all artifact divs
window.zoomHeight; // A global that says how tall the center area of the page is
window.scaleFactor = 1; // The factor that artifacts scale by when zoomed. Defaults to 1
window.zoomedIn = false;
window.previousZoomTarget = undefined; // The last target that we were zoom focused on

/*============================================================ 
 * On Startup
 *==========================================================*/
$(document).ready(function(){
    BrowserDetect.init(); // See http://www.quirksmode.org/js/detect.html

    /* ************************************************* *
     * STREAM - Scrolls the page on table of contents hover
     * **************************************************/
	$("span.anchorLink").anchorAnimate()

	originalCanvasWidth = $('#photo_canvas_center').width();
	
    $("#multi_session").val(randomString());
	
    /* ************************************************* *
     * CANVAS - Runs the initial horizontal fit on the canvas
     * **************************************************/
	//photoHFit();
	
    /* ************************************************* *
     * INDEX - Vertically centers the uploader in the page
     * **************************************************/
	wrapResize();
	$(window).resize(wrapResize);

    /* ************************************************* *
     * CANVAS - Controls the hide button on artifacts
     * **************************************************/
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

	$("#landing_login_form").inputHintOverlay(-1, 6);
	$("#canvas_login_form").inputHintOverlay(-1, 6);
	
	$("div.inputHintOverlay").hover(function() {
		$(this).children("input").toggleClass("input_hover");
	});
	
	$("#canvas_login_text").click(function() {
        $("#canvas_login_div").show();
        $("#canvas_login_prompt").hide();
	});
    $("#canvas_login_close").click(function(){
        $("#canvas_login_prompt").show();
        $("#canvas_login_div").hide();
    })

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
	$("#share_area").hover(function() {
		$("#share_link_area").show();
        $("#share_link_value").focus().select();
	}, function() {
		$("#share_link_area").hide();
        $("#share_link_value").blur();
	});
	

    /* ************************************************* *
     * Control Hover action on artifact divs
     * **************************************************/

    $("#add_artifact").hover(function(){
        $(".blue_hover").css("color", "#11b0aa");
    }, function(){
        $(".blue_hover").css("color", "#189792");
    });

    $(".artifact").hover(function() {
        if (window.zoomedIn == false) {
            $(this).children(".hide_photo").show();
            var artifact = getArtifactDivByID($(this).attr("id"));
            $(this).animate({width:artifact.realWidth},'fast');
        }
    }, function() {
        if (window.zoomedIn == false) {
            $(this).children(".hide_photo").hide();
            var artifact = getArtifactDivByID($(this).attr("id"));
            $(this).animate({width:artifact.croppedWidth},'fast');
        }
    });

    $(".artifact").click(function() {
        zoomToArtifact($(this));
    })
    
    /* ************************************************* *
     * Stream page get more random photos
     * **************************************************/
    timers = [];
    $(".more_photos").each(function() {
        randomnumber=Math.floor(Math.random()*3000) + 4000;
        id = $(this).attr('id');
        t = setInterval("randPhoto('"+id+"')", randomnumber);
        timers.push(t);
    });

	updateArtifactDivs();
});






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
 * Zoom in on an artifact. Assume it's already in the #in_zoom_div
 */
function doZoom(artifact) {
    var artifactDiv = getArtifactDivByID($(artifact).attr("id"));

    var offset = $(artifact).position();
    var xOrigin = offset.left / $("#in_zoom_div").width() * 100;
    var yOrigin = offset.top / $("#in_zoom_div").height() * 100;

    var topOffset = 1.5*MARGIN_WIDTH * window.scaleFactor;
    var scrollOffset = $(window).scrollTop();
    var centeringOffset = $("#in_zoom_div").width() / 2 - (artifactDiv.realWidth / 2 * window.scaleFactor);

    $("#above_zoom_div").css("visibility", "hidden");
    $("#below_zoom_div").css("visibility", "hidden");

    var aboveZoomDivHeight = $("#above_zoom_div").height();
    if (aboveZoomDivHeight > 0) {
        // If there's stuff above the zoomDiv
        xTranslate = offset.left - centeringOffset;
        yTranslate = offset.top - scrollOffset - topOffset + aboveZoomDivHeight;
    } else {
        // If there isn't stuff above the zoom div. This means we're near the top of the page
        xTranslate = offset.left - centeringOffset;
        yTranslate = offset.top - scrollOffset - topOffset;
    }

    // Be sure we're looking at an expanded photo with no cruft on it
    $(artifact).animate({width:artifactDiv.realWidth},'fast');
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
                doUnZoom(artifact);
                return
            }

            // Return the previous photo to its normal cropped state
            var previousArtifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
            $(window.previousZoomTarget).animate({width:previousArtifactDiv.croppedWidth},'fast');
        }

//FIXME
//FIXME AHHHHHH Goddamn browser bugs. Haven't even gotten to IE yet :(
//FIXME
        if (BrowserDetect.browser == "Firefox") {
            xTranslate = (offset.left);
        }


        $("#in_zoom_div").animate({
            scaleX: window.scaleFactor,
            scaleY: window.scaleFactor,
            left: - xTranslate + 'px',
            top: - yTranslate + 'px',
        },'slow', function() {
            // As soon as we're done panning, we need to see if we
            // need to update #in_zoom_div. This will happen any time
            // we pan up or down since we need to add or pop rows
            // accordingly

            updateInZoomDivPan(artifactDiv, previousArtifactDiv);
        });
    }
    window.previousZoomTarget = artifact;
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
                thisRow = parsePrefix($(this).attr("id"), "row_");
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
                thisRow = parsePrefix($(this).attr("id"), "row_");
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

            $("#in_zoom_div").children(".artifact_row").each(function() {
                thisRow = parsePrefix($(this).attr("id"), "row_");
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
                thisRow = parsePrefix($(this).attr("id"), "row_");
                if (thisRow === null) {
                    return;
                }
                if (thisRow <= includeUpToRow ) {
                    // Any row that's below me that's supposed to be in #in_zoom_div gets moved in
                    $("#in_zoom_div").append($(this));
                }
            });
        }
        
        var postAboveHeight = $("#above_zoom_div").height();
        var postPosition = $("#in_zoom_div").position();

        // Now that the rows have been moved, we need to reposition the div and scroll accordingly
        var aboveHeightDiff = postAboveHeight - initialAboveHeight;
        var positionDiff = postPosition.top - initialPosition.top ;
        positionDiff = positionDiff * window.scaleFactor;

        $(window).scrollTop(initialScrollTop + aboveHeightDiff);
        //var newTop = parseCssPx($("#in_zoom_div").css("top")) + positionDiff + aboveHeightDiff;

        var newTop = parseCssPx($("#in_zoom_div").css("top")) + positionDiff;

        $("#in_zoom_div").css("top",newTop);

    }

}


/**
 * Undoes the zoom. Updates the globals and resets the zoom parameters
 */
function doUnZoom(artifact) {
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
    },'slow');
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
        artifact_top = $("#artifact_"+artifact.id).offset().top;
        if (artifact_top >= load_top && artifact_top <= load_bottom) {
            div_width = $("#artifact_"+artifact.id).width();
            photo_width = $("#artifact_"+artifact.id).children(".photo_container").width();
            centering = (photo_width - div_width) / -2;

            imgdiv = "<img src="+artifact.thumb_url+" height='"+ARTIFACT_HEIGHT+"' class='photo'/>"
            $("#artifact_"+artifact.id).children(".photo_container").css('position', 'relative');
            $("#artifact_"+artifact.id).children(".photo_container").css('left', centering);
            $("#artifact_"+artifact.id).children(".photo_container").html(imgdiv);
        }
    }
}

/** Fills in images based on viewport
 */

function randPhoto(mem_id) {
    mem_id = mem_id.slice(7,mem_id.length);
    div = $("#memdiv_" + mem_id);
    $.getJSON("/get_rand_photo", {"mem_id":mem_id}, function(json){
        content = "<div class='artifact_artifact'><img src='"+json.thumb_url+"' height='200px'/></div>";
        $(div).find(".artifact_previews").append(content);
        moveAmount = $(div).find(".artifact_artifact:first").width() + 10;
        $(div).find(".artifact_previews").animate({
            left:-moveAmount
        }, 'slow', function(){
            $(div).find(".artifact_artifact:first").remove();
            $(div).find(".artifact_previews").css("left", "0");
        });
    });
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
    var standard_offset = 205;

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
    out = Number(css_string.slice(0,css_string.length - 2));
    if (!isNaN(out)) {
        return out;
    } else {
        return null;
    }
}

function parsePrefix(fullString, prefixString) {
    out = Number(fullString.slice(prefixString.length,fullString.length));
    if (!isNaN(out)) {
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
