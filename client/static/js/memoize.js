// JavaScript Document
var loginBoxActive = false;
var maxPhotoSize = 0;
var originalCanvasWidth;

$(document).ready(function(){
	originalCanvasWidth = $('#photo_canvas_center').width();
	
	$('#canvas_login_form').show();
	loginBoxActive = false;
	
    /*****************
     * Resizes the photos so they display nicely horizontally
     */
	photoHFit();
	
    /*****************
     * Adjusts the vertical position of the landing page box to
     * always be in the center of the page
     */
	wrapResize();
	$(window).resize(wrapResize);


    /*****************
     * Controls the form element hints for the login forms
     */
	$("#landing_login_form").inputHintOverlay(-1, 4);
	$("#canvas_login_form").inputHintOverlay(1, 4);
	
	$("div.inputHintOverlay").hover(function() {
		$(this).children("input").toggleClass("input_hover");
	});
	
	$("#canvas_login_text").click(function() {
		loginBoxActive = true;
		updateLoginBoxState();
	});
	

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
//	hover_in_queue = [];
//	hover_out_queue = [];
//	$(".photo_div").hover(function() {
//        console.log("Hover in");
//		hover_in_queue.push([$(this).attr('id'), $(this).width()]);
//		updateHoverQueue(hover_in_queue, hover_out_queue);
//	}, function() {
//        console.log("Hover out");
//		hover_out.push([$(this).attr('id'), $(this).width()]);
//		updateHoverQueue(hover_in_queue, hover_out_queue);
//	});
	
});

function findInHoverQueue(search, queue) {
    console.log("Entered findInHoverQueue!");
    // Searches for the id within the hover queue. Returns the index if it finds it
    // otherwise it returns -1
    queue.forEach(function(value, index){
        if (search == value[0]) {
            console.log("FOUND ONE: returning index: "+index);
            return index;
        }
    });

    console.log('about to return -1');
    console.log("search: " + search);
    console.log("queue: " + queue);
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

    console.log("updating queues")
    console.log(in_queue);
    console.log(out_queue);

    for (i=in_queue.length-1; i >= 0; i-- ) {
        // Start at the end of the queue, or the latest one that was added.
        if (i == in_queue.length - 1) {
            // This is the latest hover request we've received
            $('#' + in_queue[i][0]).animate(
                {width: $('#' + in_queue[i][0]).children('.photo').width()},
                500,
                function() {
                    in_index = findInHoverQueue($(this).attr('id'),in_queue);
                    console.log("Getting rid of index: " + in_index);
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

/** photoHFit
 * Loops through every photo, builds a list of them that should be in
 * a given row. Calls the resizePhotoDivs method on that row
 */
function photoHFit() {
	var margin = 10;
	var max_width = $("#photo_wrapper").width();
	var row_accumulator = [];
	var width_accumulator = 0;
	
	$(".photo").each(function(){
        if ($(this).width() > maxPhotoSize) {
            maxPhotoSize = $(this).width();
        }

		if (width_accumulator < max_width) {
			width_accumulator += $(this).parent('.photo_div').width() + parseInt($(this).parent().css('margin-left')) + parseInt($(this).parent().css('margin-right'));
			row_accumulator.push($(this).parent('.photo_div'));
		} else {
            /*
             * add one more photo, call the resizePhotoDivs method, then
             * reset the row
             */
			resizePhotoDivs(row_accumulator, width_accumulator);
			width_accumulator = 0 + $(this).parent('.photo_div').width() + parseInt($(this).parent().css('margin-left')) + parseInt($(this).parent().css('margin-right'));
			row_accumulator = [];
			row_accumulator.push($(this).parent('.photo_div'));
		}
	});
	resizePhotoDivs(row_accumulator, width_accumulator);
}

/** resizePhotoDivs
 * crops the photos on a row to be of the appropriate size
 */
function resizePhotoDivs(row_accumulator, default_width) {
	var i;
	var overspill;
	var length = row_accumulator.length;
	
	if (default_width > 955) {
		overspill = default_width - 955;
		crop = Math.floor(overspill / length);
		
		var width_accumulator = 0; 
		for (i=0; i<length; i++) {
			photo_div = row_accumulator.pop();
			
			if (i == length - 1) {
				// This means we're on the last photo. The last photo should take up the remaining slack.
				$(photo_div).width(955 - width_accumulator - 10); // -10 because of the margin
			} else {
				// Else make the divs a bit smaller based on the crop size
				newsize = $(photo_div).width() - crop;
				$(photo_div).width(newsize);
			}
			
			width_accumulator += $(photo_div).width() + 10;
		}
	}
}

function updateLoginBoxState() {
	if (loginBoxActive == false) {
		$('#canvas_login_prompt').css('display', 'block');
		$('#canvas_login_div').css('display', 'none');
	} else {
		$('#canvas_login_prompt').css('display', 'none');
		$('#canvas_login_div').css('display', 'block');
	}
}

function wrapResize() {
	$('#landing_wrapper').css("top", function() {
		if ($(window).height() > 300) {
			return $(window).height() / 2 - 180;
		} else {
			return -30;
		}
	});
	
	$('#header_accent_bar').height($('#canvas_header').height());
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
