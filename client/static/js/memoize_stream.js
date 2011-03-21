/********************************
 * Javascript for the Stream Page
 ********************************/
window.timers = {}; // Dictionary of timers for the stream page

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

/**
 * Given a memory on the stream page, it tries to grab a random photo from the server
 * If it successfully finds one, it inserts it at the end of the canvas,
 * pops one off the front, and slides the whole thing to the left.
 *
 * If it sees that the photo it grabbed is already there, it tries again to find a
 * random photo. It does this up to 5 times recursively before bailing.
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









$(document).ready(function(){
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
});


