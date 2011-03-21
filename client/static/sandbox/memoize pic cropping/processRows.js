//function processRow(row_accumulator, width_accumulator, artifactDivs) {
function processRow(rowToCrop, constraint) {  
    var max_width = 955;
    var overspill;
    var crop;
    var row_accumulator = getRow[0]
    var artifactDivs = getRow[2]
//    var width_accumulator = artifactSizeList.sum()
    var width_accumulator = 0
    var sizeList_length = artifactSizeList.length;
    
    for (var i = 0; i < sizeList_length; i++) {
	width_accumulator += sizeList[i];
    }

    /*
     * Now we calculate and crop the rest
     */
    if (width_accumulator >= max_width && width_accumulator > 0 && max_width > 0) {
        overspill = width_accumulator - max_width;
        crop = Math.floor(overspill / rowacc_length);

        var row_width_accumulator = 0;
        for (var k = 0; k < rowacc_length; k ++) {
            var artifact_id = row_accumulator.pop();
            artifactDivs[artifact_id].posInRow = k;
            if (k == rowacc_length - 1) {
                // This means we're on the last photo. It should take up the remaining slack
                var new_width = max_width - row_width_accumulator - MARGIN_WIDTH;
                artifactDivs[artifact_id].croppedWidth = new_width;
            } else {
                var new_width = artifactDivs[artifact_id].realWidth - crop;
                artifactDivs[artifact_id].croppedWidth = new_width;
            }

            row_width_accumulator += artifactDivs[artifact_id].croppedWidth + MARGIN_WIDTH;
        }
    } else {
        // This means that the photos don't need to be cropped. Let's just copy in the
        // appropriate width then
        for (var k = 0; k < rowacc_length; k ++) {
            var artifact_id = row_accumulator.pop();
            artifactDivs[artifact_id].posInRow = k;
            var real_width = artifactDivs[artifact_id].realWidth;
            artifactDivs[artifact_id].croppedWidth = real_width;

        }
    }
}

