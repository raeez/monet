$(function () {
    $('#file_upload').fileUploadUI({
        onDragEnter: function(event) {
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_glow_bottom.png) no-repeat top left");
        },
        onAbort: function(event) {
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },
        onDragLeave: function(event) {
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },
        onDrop: function(event) {
            $("#landing_drag_area_top").css("background", "transparent url(/static/images/Landing_DragAreaBG_top.png) no-repeat top left");
            $("#landing_drag_area_middle").css("background", "transparent url(/static/images/Landing_DragAreaBG_middle.png) repeat-y top left");
            $("#landing_drag_area_bottom").css("background", "transparent url(/static/images/Landing_DragAreaBG_bottom.png) no-repeat top left");
        },
        dropZone: $('body'),
        uploadTable: $('#files'),
        downloadTable: $('#files'),
        previewSelector: $('.file_upload_preview'),
        progressSelector: $('.file_upload_progress'),
        cancelSelector: $('.file_upload_cancel'),
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
            '           <div class="file_upload_preview"><\/div>'+
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
