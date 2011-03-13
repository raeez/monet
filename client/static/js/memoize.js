// JavaScript Document
var maxPhotoSize = 0;
var originalCanvasWidth;
var MARGIN_WIDTH = 10; // set a global margin
var BORDER_WIDTH = 4; // set a global margin
window.artifacts = [] // A global that holds json representations of all returned artifacts
window.artifactDivs; // A global used to keep track of the position of all artifact divs

/*artifactsDivs=[{
	nocrop:
	id:
	realWidth:
	croppedWidth:
	row:
	div_area:
	rowPos:
}]
*/

/*============================================================ 
 * On Startup
 *==========================================================*/
$(document).ready(function(){
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
	

    /*****************
     * Control hover actions on photos
     *
     */
    $("#add_artifact").hover(function(){
        $(".blue_hover").css("color", "#11b0aa");
    }, function(){
        $(".blue_hover").css("color", "#189792");
    });

    $(".artifact").hover(function() {
        $(this).children(".hide_photo").show();
        var artifact = getArtifactDivByID($(this).attr("id"));
        $(this).animate({width:artifact.realWidth},'fast');
    }, function() {
        $(this).children(".hide_photo").hide();
        var artifact = getArtifactDivByID($(this).attr("id"));
        $(this).animate({width:artifact.croppedWidth},'fast');
    });

//	hover_in_queue = [];
//	hover_out_queue = [];
//	$(".artifact").hover(function() {
//		hover_in_queue.push([$(this).attr('id'), $(this).width()]);
//		updateHoverQueue(hover_in_queue, hover_out_queue);
//	}, function() {
//		hover_out.push([$(this).attr('id'), $(this).width()]);
//		updateHoverQueue(hover_in_queue, hover_out_queue);
//	});
	
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
    load_top = $(window).scrollTop() - 200;
    load_bottom = $(window).scrollTop() + $(window).height() + 700;

    var artifacts = jsonParse(window.artifacts);

    for (var i in artifacts) {
            /*
        if (window.stopScrolling == true) {
             * If we're scrolling quickly past here, we don't want to get stuck loading
             * a bunch of photos we won't see. Since Javascript doesn't have good
             * threading controls, we have the scroll callback change a global variable
             * from underneath us thereby stopping the loop and quitting this iteration
             * of the loadViewportPhotos function
            return
        }
             */
        var artifact = artifacts[i];
        artifact_top = $("#artifact_"+artifact.id).offset().top;
        if (artifact_top >= load_top && artifact_top <= load_bottom) {
            div_width = $("#artifact_"+artifact.id).width();
            photo_width = $("#artifact_"+artifact.id).children(".photo_container").width();
            centering = (photo_width - div_width) / -2;

            imgdiv = "<img src="+artifact.thumb_url+" height='175' class='photo'/>"
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


function findInHoverQueue(search, queue) {
    // Searches for the id within the hover queue. Returns the index if it finds it
    // otherwise it returns -1
    queue.forEach(function(value, index){
        if (search == value[0]) {
            return index;
        }
    });

    return -1;
}

function updateHoverQueue(in_queue, out_queue) {
    /*
     * Stat with the in_queue first
     * Start the latest ones in the queue
     * Stop anything else in the queue
     * Call the a close function for those that do NOT exist in the out_queue
     *
     * Call a close on everything in the out queue
     */

    // Make sure our canvas is big enough to use
	if ($('#photo_canvas_center').width() != originalCanvasWidth + maxPhotoSize) {
        $('#photo_canvas_center').width(originalCanvasWidth + maxPhotoSize);
    }

    for (i=in_queue.length-1; i >= 0; i-- ) {
        // Start at the end of the queue, or the latest one that was added.
        if (i == in_queue.length - 1) {
            // This is the latest hover request we've received
            $('#' + in_queue[i][0]).animate(
                {width: $('#' + in_queue[i][0]).children('.photo_container').width()},
                500,
                function() {
                    in_index = findInHoverQueue($(this).attr('id'),in_queue);
                    if (in_index >= 0) {
                        // make sure we found something
                        in_queue.splice(in_index, 1);
                    }
                }
            );
        } else {
            $('#' + in_queue[i][0]).stop(true,true);
            out_index = findInHoverQueue(in_queue[i][0], out_queue);
            if (out_index == -1) {
                // We're only going to call a close on things that aren't already
                // in the out queue
                $(in_queue[i][0]).animate(
                    {width: in_queue[i][1]}, 
                    500
                );

            }
        }
    }

    for (i=out_queue.length - 1; i >= 0; i-- ) {
        $(out_queue[i][0]).animate(
            {width: out_queue[i][1]},
            500
        );
    }
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
    // Create a local copy to perform updates on then update the global
    //var _artifactDivs = $.extend(true, [], window.artifactDivs);
    var _artifactDivs = [];

    populateArtifacts(_artifactDivs);

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
    var width = 175;
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

        if (!artifactDiv.id || !artifactDiv.croppedWidth) {
            console.log("ERROR: artifactDiv has undefined terms");
            console.log(artifactDiv);
        }

        if (artifactDiv.croppedWidth && $("#"+artifactDiv.id).width() != artifactDiv.croppedWidth) {
            $("#"+artifactDiv.id).width(artifactDiv.croppedWidth);
        }
        
        row_num = $("#"+artifactDiv.id).parents(".artifact_row").attr("id");
        row_num = row_num.slice(4,row_num.length); // Take off the "row_" prefix
        row_num = Number(row_num);

        if (artifactDiv.row > row_num) {
            if ($("row_"+artifactDiv.row).length) {
                $("#row_"+artifactDiv.row).prepend($("#"+artifactDiv.id));
            } else {
                // We need to make a new row first
                new_row = "<div class='artifact_row' id='row_"+artifactDiv.row+"'></div>"
                $("#artifact_wrapper").append(new_row);
                $("#row_"+artifactDiv.row).prepend($("#"+artifactDiv.id));
            }
        } else if (artifactDiv.row < row_num) {
            $("#row_"+artifactDiv.row).append($("#"+artifactDiv.id));
        } else {
            // Do nothing. leave it where it is.
        }
    }
}



function wrapResize(adjustment) {
    adjustment = typeof(adjustment) != 'undefined' ? adjustment : 0;
    var standard_offset = 205;

	$('#landing_wrapper').css("top", function() {
		if ($(window).height() > 300) {
			return $(window).height() / 2 - (standard_offset + adjustment);
		} else {
			return -30;
		}
	});
	
	//$('#header_accent_bar').height($('#canvas_header').height());
}

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
