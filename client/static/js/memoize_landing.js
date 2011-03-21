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
    previewSelector: $('.file_upload_preview'),
    progressSelector: $('.file_upload_progress'),
    cancelSelector: $('.file_upload_cancel'),
    onProgress: function (event, files, index, xhr, handler) {
        if (handler.progressbar) {
            handler.progressbar.progressbar(
                'value',
                parseInt(event.loaded / event.total * 100, 10)
            );
        }
    },
    beforeSend:function (event, files, index, xhr, handler, callBack) {
        $(".example_fileholders").hide();
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
        '           <div class="file_upload_content">'+
                        'uploading...' +
        '               <div class="file_upload_progress"><\/div>'+
        '               <div class="file_upload_cancel"><\/div>'+
        '           <\/div>'+
        '           <div class="file_upload_preview"><\/div>'+
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
