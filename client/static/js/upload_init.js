$(function () {
    $('#file_upload').fileUploadUI({
        onDragEnter: function(event) {
            console.log("onDragEnter:");
            console.log(event);
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_bottom.png) no-repeat top left");
        },
        onAbort: function(event) {
            console.log("onAbort:");
            console.log(event);
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },
        onDragLeave: function(event) {
            console.log("onDragLeave:");
            console.log(event);
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },
        onDrop: function(event) {
            console.log("onDrop:");
            console.log(event);
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
            console.log("PROGRESS!");
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
                            files[index].name +
            '               <div class="file_upload_progress"><\/div>'+
            '               <div class="file_upload_cancel"><\/div>'+
            '           <\/div>'+
            '           <div class="file_upload_preview"><\/div>'+
            '       <\/div>'
            );
        },
        buildDownloadRow: function (file) {
            return $(
            '       <div class="upload_file_div">'+
            '           <div class="file_upload_content">'+
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
