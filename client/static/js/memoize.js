// JavaScript Document
var loginBoxActive = false;

$(document).ready(function(){
	defaultCanvasWidth = $('#photo_canvas_center').width();
	
	$('#canvas_login_form').show();
	loginBoxActive = false;
	
	photoHFit();
	
	wrapResize();
	
	$(window).resize(wrapResize);
	$("#landing_login_form").inputHintOverlay(-1, 4);
	$("#canvas_login_form").inputHintOverlay(1, 4);
	
	$("div.inputHintOverlay").hover(function() {
		$(this).children("input").toggleClass("input_hover");
	});
	
	$("#canvas_login_text").click(function() {
		loginBoxActive = true;
		updateLoginBoxState();
	});
	
	$("#share_area").hover(function() {
		$("#share_link_area").show();
	}, function() {
		$("#share_link_area").hide();
	});
	
	hover_in_queue = [];
	hover_out_queue = [];
	original_width = 0;
	last_edited = null;
	hoverin = 0;
	$(".photo_div").hover(function() {
		hover_in_queue.push([$(this), $(this).width()]);
		updateHoverQueue(hover_in_queue, hover_out_queue);
		if (hoverin != 0) {
			// Be sure to fix the last thing that didn't clear
			$(last_edited).animate({
				width: original_width,
			}, 500);
			
			hoverin = 0
		}
		
		hoverin = 1;
		
		diff = $(this).children('.photo').width() - $(this).width();
		$('#photo_canvas_center').width($('#photo_canvas_center').width() + diff);
		original_width = $(this).width();
		last_edited = $(this);
		
		$(this).animate({
				width: $(this).children('.photo').width(),
			}, 500, function() {
		});
		
	}, function() {
		if (hoverin == 1) {
			hoverin = 0;
			diff = $(this).width() - original_width;
			$(this).animate({
					width: original_width,
				}, 500, function() {
				$('#photo_canvas_center').width($('#photo_canvas_center').width() - diff);
			});
		}
	});
	
	/*
	$("#canvas_login_div").mouseleave(function() {
		loginBoxActive = false;
		updateLoginBoxState();
	});
	*/
});

function updateHoverQueue(in_queue, out_queue) {
}

function photoHFit() {
	var margin = 10;
	var max_width = $("#photo_wrapper").width();
	var row_accumulator = [];
	var width_accumulator = 0;
	
	$(".photo").each(function(){
		if (width_accumulator < max_width) {
			width_accumulator += $(this).parent('.photo_div').width() + parseInt($(this).parent().css('margin-left')) + parseInt($(this).parent().css('margin-right'));
			row_accumulator.push($(this).parent('.photo_div'));
		} else {
			resizePhotoDivs(row_accumulator, width_accumulator);
			width_accumulator = 0 + $(this).parent('.photo_div').width() + parseInt($(this).parent().css('margin-left')) + parseInt($(this).parent().css('margin-right'));
			row_accumulator = [];
			row_accumulator.push($(this).parent('.photo_div'));
		}
	});
	resizePhotoDivs(row_accumulator, width_accumulator);
}

function resizePhotoDivs(row_accumulator, default_width) {
	console.log("row_accumulator: ");
	console.log(row_accumulator);
	console.log("default_width: " + default_width);
	var i;
	var overspill;
	var length = row_accumulator.length;
	
	if (default_width > 955) {
		overspill = default_width - 955;
		console.log("overspill: " + overspill);
		crop = Math.floor(overspill / length);
		console.log("crop: " + crop);
		
		var width_accumulator = 0; 
		console.log("lengthh: " + length);
		for (i=0; i<length; i++) {
			console.log(i);
			photo_div = row_accumulator.pop();
			console.log(photo_div);
			
			if (i == length - 1) {
				console.log("LAST PHOTO");
				// This means we're on the last photo. The last photo should take up the remaining slack.
				$(photo_div).width(955 - width_accumulator - 10); // -10 because of the margin
			} else {
				// Else make the divs a bit smaller based on the crop size
				newsize = $(photo_div).width() - crop;
				console.log("original width: " + $(photo_div).width());
				console.log("new width: " + newsize);
				$(photo_div).width(newsize);
			}
			
			width_accumulator += $(photo_div).width() + 10;
			console.log("width_accumulator: " + width_accumulator);
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
