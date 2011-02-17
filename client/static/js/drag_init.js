$(function () {
    $('.upload').fileUploadUI({
        uploadTable: $('.upload_files'),
        downloadTable: $('.download_files'),
        buildUploadRow: function (files, index) {
            var file = files[index];
			//return $('<div id=  style="border: 2px dashed; width:150px; height: 100%; overflow: auto;"></div>' +
					
            /*return $('<tr><td>' + file.name + '<\/td>' +
                    '<td class="file_upload_progress"><div><\/div><\/td>' +
                    '<td class="file_upload_cancel">' +
                    '<div class="ui-state-default ui-corner-all ui-state-hover" title="Cancel">' +
                    '<span class="ui-icon ui-icon-cancel">Cancel<\/span>' +
                    '<\/div><\/td><\/tr>');*/
			
			//return $('<td class="file_upload_progress" style="border: 2px dashed #1e5957"><div><\/div><\/td>');
			return $();
        },
        buildDownloadRow: function (file) {
            return $('<tr><td>' + file.name + '<\/td><\/tr>');
        }
    });
});