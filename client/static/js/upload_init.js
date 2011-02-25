$(function () {

/****************************************
 * FILE UPLOAD ON CANVAS PAGE
 * *************************************/

$("#canvas_file_upload").fileUploadUI({
    
        fieldName: "photo",
        dropZone: $('html'),
        uploadTable: $('#new_artifacts'),
        downloadTable: $('#new_artifacts'),
        progressSelector: $('.file_upload_progress'),
        cancelSelector: $('.file_upload_cancel'),
        onDragEnter: function(event) {
            $("#add_artifact").css("-moz-box-shadow", "2px 2px 11px #1e5957");
            $("#add_artifact").css("-webkit-box-shadow", "2px 2px 11px #1e5957");
            $("#add_artifact").css("box-shadow", "2px 2px 11px #1e5957");
        },
        onAbort: function(event) {
            $("#add_artifact").css("-moz-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("-webkit-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("box-shadow", "2px 2px 7px #111");
        },
        onDragLeave: function(event) {
            $("#add_artifact").css("-moz-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("-webkit-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("box-shadow", "2px 2px 7px #111");
        },
        onDrop: function(event) {
            $("#add_artifact").css("-moz-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("-webkit-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("box-shadow", "2px 2px 7px #111");
        },
        beforeSend:function (event, files, index, xhr, handler, callBack) {
            photoHFit();
            callBack();
        },
        onComplete: function (event, files, index, xhr, handler) {
            photoHFit();
        },
        buildUploadRow: function (files, index) {
            return $(
            '       <div class="upload_file_canvas_div photo_div no_crop">'+
            '           <div class="file_upload_canvas_content">'+
                            files[index].name +
            '               <div class="file_upload_progress"><\/div>'+
            '               <div class="file_upload_cancel"><\/div>'+
            '           <\/div>'+
            '           <div class="file_upload_canvas_preview"><\/div>'+
            '           <div class="photo"><div class="mock_photo><\/div><\/div>"'+
            '       <\/div>'
            );
        },
        buildDownloadRow: function (file) {
            return $(
            '       <div class="photo_div">'+
            '           <img class="photo" src="'+file.thumb_url+'" height="175"\/>'+
            '       <\/div>'
            );
        }

});


/****************************************
 * FILE UPLOAD ON LANDING PAGE
 * *************************************/

    $('#file_upload').fileUploadUI({
        /*equivalent to drop_zone_enlarge function already defined
	onDragEnter: function(event) {
            //console.log("onDragEnter:");
            //console.log(event);
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_bottom.png) no-repeat top left");
        },*/
        onAbort: function(event) {
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },
        /* equivalent to "dropzonereduce function already defined
	onDragLeave: function(event) {
            //console.log("onDragLeave:");
            //console.log(event);
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },*/
        onDrop: function(event) {
            //console.log("onDrop:");
            //console.log(event);
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
            //console.log("PROGRESS!");
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

            wrapResize(50);
            /*
            console.log("COMPLETED==================");
            console.log("event, files, index, xhr, handler, json");
            console.log(event);
            console.log(files);
            console.log(index);
            console.log(xhr);
            console.log(handler);
            console.log(json);
            console.log("---------------------------");
            */
        },
        buildUploadRow: function (files, index) {
            return $(
            '       <div class="upload_file_div">'+
            '           <div class="file_upload_content">'+
			    //files[index].name + 
                            'uploading...' +
            '               <div class="file_upload_progress"><\/div>'+
            '               <div class="file_upload_cancel"><\/div>'+
            '           <\/div>'+
            '           <div class="file_upload_preview"><\/div>'+
            '       <\/div>'
            );
        },
        buildDownloadRow: function (file) {
	    alert(file);
            return $(
            '       <div class="upload_file_div">'+
            '           <div class="file_upload_content">'+
                            //file.name +
			    file.name + 
            '           <\/div>'+
            '           <div class="file_upload_preview"><img src="'+file.thumb_url+'"\/><\/div>'+
            '       <\/div>'
            );
        }
    });
});
/*
        buildUploadRow: function (files, index) {
            return $('<tr><td>' + files[index].name + '<\/td>' +
                    '<td class="file_upload_progress"><div><\/div><\/td>' +
                    '<td class="file_upload_cancel">' +
                    '<button class="ui-state-default ui-corner-all" title="Cancel">' +
                    '<span class="ui-icon ui-icon-cancel">Cancel<\/span>' +
                    '<\/button><\/td><\/tr>');
        },
        buildDownloadRow: function (file) {
            return $('<tr><td>' + file.name + '<\/td><\/tr>');
        }
        */
