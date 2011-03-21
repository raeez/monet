/*********************************
 * Javascript for the Landing Page
 *********************************/

/**
 * Re-centers the landing_page content in the middle of the page
 * Takes an optional adjustment value that is used once we add
 * images to the page
 */
function landingPageResize(adjustment) {
    adjustment = typeof(adjustment) != 'undefined' ? adjustment : 0;
    var standard_offset = 255;

	$('#landing_wrapper').css("top", function() {
		if ($(window).height() > 300) {
            var newTop = $(window).height() / 2 - (standard_offset + adjustment);
            if (newTop <= -30) {
                return -30;
            } else {
                return newTop;
            }
		} else {
			return -30;
		}
	});

    $("#landing_bg").height($(document).height());
}


/**
 * Checks the center area to see if it's empty. If so, bring back the dashed boxes
 */
function checkForEmptyArea() {
    if ($.trim($("#upload_area #files").html()) == "") {
        $(".example_fileholders").show();
    }
}

/****************************************
 * FILE UPLOAD ON LANDING PAGE
 * *************************************/
$(function () {
$('#file_upload').fileUploadUI({
    onAbort: function(event) {
        $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
        $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
        $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
    },
    onDrop: function(event) {
        $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
        $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
        $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
    },
    fieldName: "photo",
    dropZone: $('html'),
    uploadTable: $('#files'),
    downloadTable: $('#files'),
    progressSelector: $(".file_upload_progress"),
    initProgressBar: function (node, value) {
        if (typeof node.progressbar === 'function') {
            return node.progressbar({
                value: value
            });
        } else {
            var progressbar = $('<progress value="' + value + '" max="100"/>').appendTo(node);
            progressbar.progressbar = function (key, value) {
                progressbar.attr('value', value);
            };
            return progressbar;
        }
    },
    beforeSend:function (event, files, index, xhr, handler, callBack) {
        $(".example_fileholders").hide();

        var regexp = /\.(bmp)|(png)|(jpg)|(jpeg)|(gif)$/i;
        // Using the filename extension for our test,
        // as legacy browsers don't report the mime type
        if (!regexp.test(files[index].name)) {
            handler.uploadRow.find('.file_upload_message').html("MUST BE IMAGE (BMP PNG JPG JPEG GIF)");
            $(handler.uploadRow).css("border-color","#e3372d")
            setTimeout(function () {
                handler.removeNode(handler.uploadRow);
                $(handler.uploadRow).remove();
                checkForEmptyArea();
            }, 5000);
            return;
        }

        if (files[index].size === 0) {
            handler.uploadRow.find('.file_upload_message').html('FILE IS EMPTY!');
            $(handler.uploadRow).css("border-color","#e3372d")
            setTimeout(function () {
                handler.removeNode(handler.uploadRow);
                $(handler.uploadRow).remove();
                checkForEmptyArea();
            }, 5000);
            return;
        }

        if (files[index].size > FILE_UPLOAD_LIMIT) {
            var maxSizeMB = FILE_UPLOAD_LIMIT / 1000000;
            handler.uploadRow.find('.file_upload_message').html('FILE TOO BIG! Max: '+maxSizeMB+"MB");
            $(handler.uploadRow).css("border-color","#e3372d")
            setTimeout(function () {
                handler.removeNode(handler.uploadRow);
                $(handler.uploadRow).remove();
                checkForEmptyArea();
            }, 5000);
            return;
        }

        callBack();
    },
    onComplete: function (event, files, index, xhr, handler) {
        var json = handler.response;

        link = '<a href="'+json.memory_url+'" target="_blank">'+json.memory_url+'</a>';
        if ($("#memory_url").html() != link) {
            $("#memory_url").html(link);
        }
        if (!$("#memory_url_area").is(":visible")) {
            $("#memory_url_area").show();
        }

        $("#memory_id").val(json.memory);

        $(".file_upload_link").attr("href", json.memory_url);

        var heightAdjustment = $("#landing_drag_area_content").height() / 2 - 130;

        landingPageResize(heightAdjustment); // Re-center since the images added space to the upload area
    },
    buildUploadRow: function (files, index) {
        return $(
        '       <div class="upload_file_div">'+
        '           <div class="file_upload_progress"></div>'+
        '           <div class="file_upload_content">'+
        '               <div class="file_upload_message">uploading...</div>' +
        '           <\/div>'+
        '       <\/div>'
        );
    },
    buildDownloadRow: function (file) {
        return $(
        '       <div class="upload_file_div">'/*+
        '           <div class="file_upload_content">'+
            file.name + 
        '           <\/div>'*/+
        '           <a class="file_upload_link" target="_blank"><div class="file_upload_preview"><img src="'+file.thumb_url+'"\/><\/div></a>'+
        '       <\/div>'
        );
    }
});
});



$(document).ready(function(){
    $("#multi_session").val(randomString());

	landingPageResize();

	$(window).resize(landingPageResize);

    /* ************************************************* *
     * Landing Page - Login Form Methods
     * **************************************************/
	$("#landing_login_form").inputHintOverlay(3, 5);

});
