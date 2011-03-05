// JavaScript Document
var maxPhotoSize = 0;
var originalCanvasWidth;

$(document).ready(function(){
	$("span.anchorLink").anchorAnimate()

	originalCanvasWidth = $('#photo_canvas_center').width();
	
	$('#canvas_login_form').show();


    $("#multi_session").val(randomString());
	
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

    /* ************************************************* *
     * Controls the hide button on photo_divs
     * **************************************************/
    $(".hide_photo").click(function(){
        var visible;

        if ($(this).parent().hasClass("artifact_hidden")) {
            visible = 0;
            $.post("/toggle_visibility", {'visibility':visible, 'id':$(this).parent().attr("id")});
            $(this).html("<a href='#'>hide</a>");
            $(this).parent().removeClass("artifact_hidden");
        } else { 
            visible = 1; 
            $.post("/toggle_visibility", {'visibility':visible, 'id':$(this).parent().attr("id")});
            $(this).parent(".photo_div").hide('fast', function(){
                $(this).parent(".photo_div").remove();
                photoHFit();
            });
        }

    });


    /* ************************************************* *
     * Login Forms
     * **************************************************/
	$("#landing_login_form").inputHintOverlay(-3, 6);
	$("#canvas_login_form").inputHintOverlay(-3, 6);
	
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


    $(".login_form").submit(function(e){
        var validationFail = false;
        $(this).find("input:text, input:password").each(function() {
            if ($(this).parent().parent().parent().css("display") != "none") {
                if ($(this).val() == "") {
                    $(".login_error_messages").html("Please fill in everything");
                    validationFail = true;
                }
            }
        });

        return !validationFail;

    });

    $(".login_email").focusin(function() {
        $(".login_prompt").hide();
        $(".login_checking").show();
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

    function checkForEmail() {
        //http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        var re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i

        email = $(".login_email input").val();
        if (email == '') {
            hideAllLogin();
            $(".login_prompt").show();
        }
        if (re.test(email)) {
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
        }
    }

    function hideAllLogin() {
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

    $(".photo_div").hover(function() {
        $(this).children(".hide_photo").show();
    }, function() {
        $(this).children(".hide_photo").hide();
    });

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

});

function randPhoto(mem_id) {
    mem_id = mem_id.slice(7,mem_id.length);
    div = $("#memdiv_" + mem_id);
    $.getJSON("/get_rand_photo", {"mem_id":mem_id}, function(json){
        content = "<div class='artifact_item'><img src='"+json.thumb_url+"' height='200px'/></div>";
        $(div).find(".artifact_previews").append(content);
        moveAmount = $(div).find(".artifact_item:first").width() + 10;
        $(div).find(".artifact_previews").animate({
            left:-moveAmount
        }, 'slow', function(){
            $(div).find(".artifact_item:first").remove();
            $(div).find(".artifact_previews").css("left", "0");
        });
    });
}

function randomString() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 16;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
    return randomstring;
}


function findInHoverQueue(search, queue) {
    //console.log("Entered findInHoverQueue!");
    // Searches for the id within the hover queue. Returns the index if it finds it
    // otherwise it returns -1
    queue.forEach(function(value, index){
        if (search == value[0]) {
            //console.log("FOUND ONE: returning index: "+index);
            return index;
        }
    });

    //console.log('about to return -1');
    //console.log("search: " + search);
    //console.log("queue: " + queue);
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

    //console.log("updating queues")
    //console.log(in_queue);
   //console.log(out_queue);

    for (i=in_queue.length-1; i >= 0; i-- ) {
        // Start at the end of the queue, or the latest one that was added.
        if (i == in_queue.length - 1) {
            // This is the latest hover request we've received
            $('#' + in_queue[i][0]).animate(
                {width: $('#' + in_queue[i][0]).children('.photo').width()},
                500,
                function() {
                    in_index = findInHoverQueue($(this).attr('id'),in_queue);
                    //console.log("Getting rid of index: " + in_index);
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
    //console.log("START ----------------------------------");
	var margin = 10;
	var max_width = $("#photo_wrapper").width();
	var row_accumulator = [];
	var width_accumulator = 0;
	
	$(".photo").each(function(){
        if ($(this).parent().css("display") != "none") {
            if ($(this).width() > maxPhotoSize) {
                maxPhotoSize = $(this).width();
            }

            if (width_accumulator < max_width) {
                width_accumulator += $(this).width() + margin;
                row_accumulator.push($(this).parent('.photo_div'));
            } else {
                /*
                 * add one more photo, call the resizePhotoDivs method, then
                 * reset the row
                 */
//              resizePhotoDivs(row_accumulator, width_accumulator);
                resizePhotoDivs(row_accumulator, width_accumulator, this);

                width_accumulator = 0 + $(this).width() + margin;
                row_accumulator = [];
                row_accumulator.push($(this).parent('.photo_div'));
            }
        }
	});
//	resizePhotoDivs(row_accumulator, width_accumulator);
	resizePhotoDivs(row_accumulator, width_accumulator, this);
    //console.log("END ----------------------------------");
}

/** resizePhotoDivs
 * crops the photos on a row to be of the appropriate size
 */
function resizePhotoDivs(row_accumulator, default_width, photo) {
	var i;
	var overspill;
	var length = row_accumulator.length;
    var max_width = 955;
	var threshold;
    
    for (i=0; i<row_accumulator.length; i++) {
        if ($(row_accumulator[i]).hasClass("no_crop")) {
            length -= 1;
            max_width = max_width - $(row_accumulator[i]).width() - 14; //dont forget margin and border!
            default_width = default_width - $(row_accumulator[i]).width();
            row_accumulator.splice(i,1);
        }
    }
    //console.log(row_accumulator);
    //console.log(default_width);

	if (default_width >= max_width) {
		overspill = default_width - max_width;
		crop = Math.floor(overspill / length);
		threshold = Math.floor(max_width/length);
		
		var width_accumulator = 0; 
		for (i=0; i<length; i++) {
            //console.log(i);
			photo_div = row_accumulator.pop();
			
			if (i == length - 1) {
				// This means we're on the last photo. The last photo should take up the remaining slack.
                	foo = max_width - width_accumulator;
			var new_width = max_width - width_accumulator - 10; // -10 because of the margin
			
/*			if (new_width < 1.0*threshold){
				new_width = 1.0*threshold;	
			}*/
//			var pic_width_diff = -1*($(photo).offset() - new_width);			
			

            /*
			if (new_width < 1.0*threshold){
				new_width = 1.0*threshold;	
			}
            */
			var pic_width_diff = -1*($(photo).offset() - new_width);

			//$(photo).css({"left": pic_width_diff + "px"});
			//console.log("photo left--->", $(photo).css('left'));
			
			//$(photo_div).width(new_width); //<--- photo_div
//			$(photo).width(new_width);

			} else {
				// Else make the divs a bit smaller based on the crop size

				newsize = $(photo_div).children(".photo").width() - crop;

				var pic_width_newsize = -1*($(photo).offset() - newsize);
				//$(photo).css({"left": pic_width_newsize + "px"});
				$(photo_div).width(newsize);// <--- photo_div
//				$(photo).width(newsize);
			}
			
			width_accumulator += $(photo_div).width() + 10; //<--photo_div
//			width_accumulator += $(photo).width() + 10;
			
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
	
	$('#header_accent_bar').height($('#canvas_header').height());
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
