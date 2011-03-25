/********************************
 * Javascript for the Canvas Page
 ********************************/
var MARGIN_WIDTH = 10; // set a global margin
var BORDER_WIDTH = 4; // set a global margin
var ARTIFACT_HEIGHT = 175; // The standard height of all artifacts
var WRAPPER_WIDTH = 955;
var THRESHOLD = 0.8; // Maximum crop amount
var STAGING_SIZE = 6; // Number of photos staged before they're added to the page
var is_iOS;

window.artifactServerData = [] // A global that holds json representations of all returned artifacts
/*
 * artifactServeData Object = {
 *     id : "<id>",
 *     image_url : "<image_url>",
 *     thumb_url : "<thumb_url>",
 *     visible : 1|0,
 *     width : <width in px>,
 *     height : <height in px>
 * }
 */

window.artifactDivs; // A global used to keep track of the position of all artifact divs

/**
 * A queue that dispatches all changes to the window.artifactDivs global
 */
window.updateQueue = [];

window.enableLive = true; // A boolean flag that indicates whether or not we should be adding elements to the page

window.numRows = 0; // The total number of rows on the page
window.zoomHeight; // A global that says how tall the center area of the page is
window.scaleFactor = 1; // The factor that artifacts scale by when zoomed. Defaults to 1
window.previousScaleFactor = 1; // Used to adjust zooming when the scale factor changes
window.zoomedIn = false;
window.previousZoomTarget = undefined; // The last target that we were zoom focused on
window.canvasTitle = ""; // We store the canvas title as a global to get it back from the truncated version
window.justChangedHidden = false; // Used to temporarily disable the hide button hover
window.uploadError = false; // Keeps track if there's an upload error
window.stagingPhotos = {} // A dictionay of jQuery upload File objects keyed by index
window.stagingPhotos.length = function () {
    var count = 0;
    for (var i in window.stagingPhotos) {count ++;}
    return count;
}


/***********************************************
  Detect whether iOS is running
 * *********************************************/
function iOS_running() {
    if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPad/i))) {
    	is_iOS = true;
	var visible = 0;
	$.post("/toggle_visibility", {'visibility':visible, 'id':'add_artifact'});
	$("#add_artifact").hide();
    	$("#add_artifact").remove();
    	updateArtifactDivs();

	
    }
    is_iOS = false;
}

/***********************************************
  ARTIFACTDIV Data Structure Handling
 **********************************************/

/*
 * STRATEGY:
 * I have a base object called ArtifactDiv
 * add_artifact and new_artifact are no longer ArtifactDivs
 * ArtifactDivList contains ArtifactDivs and has several methods that let us
 * quickly get data in and out
 *
 * We no longer let anything directly manipulate artifacts on the page.
 *
 * All modifying actions must go through the ArtifactDivList methods.
 *
 * These methods add the corresponding request onto the queue and fires
 * a queue handle event.
 *
 * If the queue isn't doing anything, it processes the item on top of the queue
 * When finished processing, the queue processes remaining items on it until
 * it's empty
 *
 * Flags on all the set methods indicate whether or not a redraw should occur
 */

/**
 * Primary model class for all artifact elements on the page
 */
function ArtifactDiv() {
    // These bits are populated from the populateArtifacts method
    this.id = undefined;
    this.noCrop = undefined;
    this.realWidth = undefined;
    this.divArea = undefined;
    this.display = undefined;

    // These bits come from the calculateCrop method
    this.croppedWidth = undefined;
    this.row = undefined;
    this.posInRow = undefined;

    // These bits come from the server and are populated by refreshServerData
    this.height = undefined;
    this.width = undefined;
    this.image_url = undefined;
    this.thumb_url = undefined;
    this.visible = undefined;
}
/*
function ArtifactDivList() {
    this.addDivList = []
    this.artifactDivList = []
    this.deleteDivList = []

    this.eventQueue = []
    this.eventInProgress = false
    this.processEvent = function()

    this.get = function(id)
    this.getField = function(id, field)
    this.getIndex = function(index)
    this.getByRowPos = function(row, posInRow)

    this.add = function(ArtifactDiv, render)
    this._add = function(ArtifactDiv, render)
    this.edit = function(id, field, value, render)
    this._edit = function(id, field, value, render)
    this.delete = function(id, render)
    this._delete = function(id, render)

    this.render = function()
    this._render = function()
}
*/

function getArtifactDivByID(id) {
    var adiv_length = window.artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.id == id) {
            return artifactDiv;
        }
    }
    return false;
}
function getArtifactIndexByID(id) {
    var adiv_length = window.artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.id == id) {
            return i;
        }
    }
    return false;
}
function getFieldFromArtifactByID(id, field) {
    var adiv_length = window.artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.id == id) {
            return artifactDiv[field];
        }
    }
    return undefined;
}
function getArtifactDivByRowPos(row, posInRow) {
    var adiv_length = window.artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.row == row && artifactDiv.posInRow == posInRow) {
            return artifactDiv;
        }
    }
    return false;
}
function getArtifactDivRowLength(row) {
    var adiv_length = window.artifactDivs.length;
    var row_length = 0;
    for (var i = 0; i < adiv_length; i++) {
        var artifactDiv = window.artifactDivs[i];
        if (artifactDiv.row == row) {
            if (artifactDiv.id != "add_artifact" && artifactDiv.id != "new_artifacts") {
                row_length ++;
            }
        }
    }
    return row_length;
}
function getServerDataByID(id) {
    var serverData;
    for (var i in window.artifactServerData) {
        serverData = window.artifactServerData[i];
        if (serverData.id == id) {
            return serverData;
        }
    }
    return false;
}
function getServerDataIndexByID(id) {
    var serverData;
    for (var i in window.artifactServerData) {
        serverData = window.artifactServerData[i];
        if (serverData.id == id) {
            return i;
        }
    }
    return false;
}
function getServerDataFieldByID(id, field) {
    var serverData;
    for (var i in window.artifactServerData) {
        serverData = window.artifactServerData[i];
        if (serverData.id == id) {
            return serverData[field];
        }
    }
    return undefined;
}


/******************************************
 * UPDATING HORIZONTAL ARTIFACT LAYOUT
 * ***************************************/
/**
 * Creates a data structure that calcaultes the state the artifact divs should be in
 * Then calls the methods to rearrange the page accordingly
 */
function updateArtifactDivs(/*artifactDivs*/) {
    // Create a new data structure to populate
    var _artifactDivs = [];
    populateArtifacts(_artifactDivs);
    //populateArtifacts(_artifactDivs);

    refreshServerData(_artifactDivs);

    calculateCrop(_artifactDivs);

    moveArtifactDivs(_artifactDivs);

    window.artifactDivs = _artifactDivs;
}

/**
 * Performs the same tasks as updateArtifactDivs except instead of populating a
 * new data structure, it loads in the global one and applies any changes that
 * may have been made to it. This is primarily used with other methods (such as the zoom)
 * modify the global data structure and wish to see changes invoked on the page
 */
function updateModifiedArtifactDivs() {
    // Create a local copy to perform updates on then update the global
    var _artifactDivs = $.extend(true, [], window.artifactDivs);

    refreshServerData(_artifactDivs);

    calculateCrop(_artifactDivs);

    moveArtifactDivs(_artifactDivs);

    window.artifactDivs = _artifactDivs;
}

/**
 * Fills a list with artifactDiv objects that contain the state of all of
 * the artifacts on the current page
 */
function populateArtifacts(_artifactDivs) {
    $(".artifact").each(function() {
        var artifactDiv = new ArtifactDiv();
        artifactDiv['id'] = $(this).attr("id");
        $(this).hasClass("no_crop") ? artifactDiv['noCrop'] = true : artifactDiv['noCrop'] = false;
        artifactDiv['realWidth'] = getRealWidth($(this));
        $(this).css('display') == "none" ? artifactDiv['display'] = false : artifactDiv['display'] = true;
        artifactDiv['divArea'] = $(this).parents(".zoom_div").attr("id");
        _artifactDivs.push(artifactDiv);
    });
}

/** getRealWidth(artifactDiv)
 *  Determines the width of the artifact by detecting its type.
 *  Photos you calculate differently than videos or tweets
 *
 *  returns the width of the div in pixels
 */
function getRealWidth(artifactDiv) {
    var width = ARTIFACT_HEIGHT;
    if ($(artifactDiv).hasClass("photo")) {
        // The artifact is a photo
        width = $(artifactDiv).children(".photo_container").width();
    }
    else if ($(artifactDiv).attr("id") == "add_artifact") {
        // The artifact is the "add artifact" button
        width = $(artifactDiv).width();
    } else if ($(artifactDiv).attr("id") == "new_artifacts") {
        // We're looking at the add artifact upload area
        width = $(artifactDiv).width();
    } else if ($(artifactDiv).hasClass("upload_file_canvas_div")) {
        // The artifact is a file upload progress box
       width = $(artifactDiv).children(".photo_container").width(); 
    }

    return width;
}

/***********************************************
  Socket IO Canvas Implementation
***********************************************/
/**
 * Given a message of type update, this method modifies the global
 * window.artifactDivs and also repalces the correpsonding image with
 * the image indicated in the message object
 * @param {json} message - The json return from the socket io module
 * action : "ping"|"update"
 * type : "photo"
 * _id : "<id>"
 * thumb : "<thumb_url>"
 * full : "<full_url>"
 */
function updateArtifact(message) {
    // Need to update both window.artifactDivs and window.artifactServerData
    var j = getServerDataIndexByID("artifact_"+message._id);
    if (j === false) {
        // This means we need to make a new artifact.
        var serverObj = new Object();
        serverObj = {
            id : message._id,
            image_url : message.full,
            thumb_url : message.thumb,
            visible : 1,
            width : message.width,
            height : message.height
        };
        window.artifactServerData.push(serverObj);

        console.log("updating artifact divs because we got pushed a new artifact by the socket");
        updateArtifactDivs();

        // We don't deal with window.artifactDivs because there's no div
        // made for it yet and we'll let updateArtifacts() do that
    } else {
        window.artifactServerData[j].thumb_url = message.thumb;
        window.artifactServerData[j].image_url = message.full;

        // This following will try and put the thumb in place
        // We need to check if it's in the staging area or if it's in
        // the main canvas

        if(window.enableLive == true && $("#artifact_"+message._id).length) {
            // We found a div!
            if ($("#artifact_"+message._id).find("img").attr("src") == message.thumb) {
                // If the img doesn't exist, it will return 'undefined'
                return;
            }
            var div_width = $("#artifact_"+message._id).width();
            var photo_width = $("#artifact_"+message._id).children(".photo_container").width();
            var centering = (photo_width - div_width) / -2;
            $("#artifact_"+message._id).find("img").remove();
            var imgdiv = "<img src="+message.thumb+" height='"+ARTIFACT_HEIGHT+"' width='"+window.artifactDivs[i].width+"' class='photo'/>"
            $("#artifact_"+message._id).children(".photo_container").css('left', centering);
            $("#artifact_"+message._id).children(".photo_container").html(imgdiv);
        }
        
    }
}

/********************************
**FUNCTIONS FOR CROPPING PHOTOS**
*********************************
/**
 * Once loadartifacts runs, a global is populated with server information
 * for each artifactDiv. This method merges the two data sets into one.
 *
 * The format of artifactServerData is determined by the server.
 * artifactDivs are full of ArtifactDiv objects
 */
function refreshServerData(artifactDivs) {
    var serverData;
    var artifact;
    var id;

    var a_divlength = artifactDivs.length;
    for (var j = 0; j < a_divlength; j ++ ) {
        serverData = getServerDataByID(parsePrefixToString(artifactDivs[j]["id"], "artifact_"));
        if (serverData === false) {
            continue;
        } else {
            artifactDivs[j]["height"] = serverData.height;
            artifactDivs[j]["width"] = serverData.width;
            artifactDivs[j]["image_url"] = serverData.image_url;
            artifactDivs[j]["thumb_url"] = serverData.thumb_url;
            artifactDivs[j]["visible"] = serverData.visible;
        }
    }

    var sDataLength = window.artifactServerData.length;
    for (var i = 0; i < sDataLength; i ++ ) {
        var a_div = getArtifactDivByID("artifact_" + window.artifactServerData[i]["id"]);
        if (a_div === false) {
            /*
             * This likely means there exsists a server data element
             * because the server pushed one in before the actual div
             * element was put on the page and updated. We should make
             * an artifact div so it gets included in the next render
             */
            if (window.enableLive == true) {
                // We only want to make new divs like this if we're accepting
                // pushed elements
                var sData = window.artifactServerData[i];
                var artifactDiv = new ArtifactDiv();
                artifactDiv['id'] = "artifact_" + sData.id;
                artifactDiv['noCrop'] = false; // Assuming it's always a cropable artifact
                artifactDiv['realWidth'] = sData.width; // 
                artifactDiv['display'] = true; // We want it to be displayed!
                zoomDiv = $("#new_artifacts").parents(".zoom_div").attr("id");
                artifactDiv['divArea'] = zoomDiv // Assuming new elements are always pu aboveZoom Div)
                artifactDiv["height"] = sData.height; // 
                artifactDiv["width"] = sData.width;
                artifactDiv["image_url"] = sData.image_url;
                artifactDiv["thumb_url"] = sData.thumb_url;
                artifactDiv["visible"] = sData.visible;
                artifactDivs.splice(2,0,artifactDiv);
            }
        } else {
            // No need to update anything in the serverData
            continue;
        }
    }
}


/**
 * This function should expect that the artifactDiv list
 * has nocrop, id, and realWidth filled in for each element
 *
 * This function calculates and fills in the croppedWidth
 * row, and div_area for each object in the list.
 *
 * It modifies the list objects in place
 *
 * Returns a copy of the artifactDivs
 */
function calculateCrop(artifactDivs) {
    var max_width = WRAPPER_WIDTH;
    var row_accumulator = [];
    var width_accumulator = 0;

    var rownum = 0;

    var artifactDivs_length = artifactDivs.length;
    for (var i = 0; i < artifactDivs_length; i ++) {
        var artifactDiv = artifactDivs[i];
        if (inStagingPhotos(artifactDiv.id)) {
            // I don't want to include divs that are still in the staging
            // area
            continue;
        }
        if (artifactDiv.display) {
            if (width_accumulator < max_width) {
		        width_accumulator += artifactDiv.realWidth + MARGIN_WIDTH;
                if (artifactDiv.noCrop) {
		             width_accumulator += BORDER_WIDTH;
		        }
                row_accumulator.push(i);
                artifactDivs[i].row = rownum;
            } else {
                processRow(row_accumulator, width_accumulator, artifactDivs);
                width_accumulator = 0 + artifactDiv.realWidth + MARGIN_WIDTH;
	    
                if (artifactDiv.noCrop) {
                    width_accumulator += BORDER_WIDTH;
                }

                row_accumulator = [];
                rownum ++;
                row_accumulator.push(i);
                artifactDivs[i].row = rownum;
            }
        }
    }

    processRow(row_accumulator, width_accumulator, artifactDivs);
}

/**
 * Determines crop amount for a given row and updates the div object
 * Called an used exclusively from calculateCrop
 * does a greedy cropping
 * does not crop pictures past a certain threshold
 * bigger pictures are cropped more than smaller pics
 */
function processRow(row_accumulator, width_accumulator, artifactDivs) {
    
    var max_width = WRAPPER_WIDTH;
    var overspill;
    var crop;
    var threshold = THRESHOLD;

    /*
     * We first need to remove all objects that we don't want to crop
     * This pops it off of the row and adjusts the total width thresholds we use
     */
    var rowacc_length = row_accumulator.length
    for (var j = 0; j < row_accumulator.length; j++) {
        // we need to recalculate row_accumulator.length each time since we
        // modify the data structure in place with this loop
        if (artifactDivs[row_accumulator[j]].noCrop) {
            rowacc_length -= 1;
            max_width = max_width - artifactDivs[row_accumulator[j]].realWidth - MARGIN_WIDTH - BORDER_WIDTH;
            width_accumulator = width_accumulator - artifactDivs[row_accumulator[j]].realWidth - MARGIN_WIDTH - BORDER_WIDTH;
            artifactDivs[row_accumulator[j]].croppedWidth = artifactDivs[row_accumulator[j]].realWidth;
            row_accumulator.splice(j,1);
            j -= 1; // Need to decrement the index we because we're removing the artifacts in place
        }
    }

    /*
     * Now we greedily crop the rest such that, pics not cropped past threshold
     *
     * We first bin the divs in the rows into buckets based on size.
     * We then decide how much to crop each size category
     * We then go through and bin, by bin, apply the crop to the photo's data structure
     * The last photo in the row then takes up the slack to prevent us from accumulating rouding errors
     */
    if (width_accumulator >= max_width && width_accumulator > 0 && max_width > 0) {
	//create a size map: size--->location(s)
	//
        overspill = width_accumulator - max_width;
        crop = Math.floor(overspill / rowacc_length);
	var row_width_accumulator = 0;
	var amtLeft = overspill;
	var sizeDict = new Array();
	var posDict = new Array();
	var sizeList = []
	// does size include margin size?????

	// creates sizeDict. maps: size ---> list(indices)
	// creates posDict. maps: artifact_id ---> position
	for (var j = 0; j < rowacc_length; j++) {
	    var index = row_accumulator[j];
	    var size = artifactDivs[index].realWidth;
	    posDict[index] = j;
	    if (size in sizeDict) {
		sizeDict[size].push(index);
	    } else {
		var indexList = [index];
		sizeDict[size] = indexList;
		sizeList.push(size);
	    }
	}
	sizeList.sort();
	sizeList.reverse();

	var isPerfect = checkPerfectCrop(overspill, threshold, width_accumulator);

	// if there is no way to crop w/out going past threshold, lightly relax threshold
	while(isPerfect == 'False') {
		threshold = 0.9*threshold;
		isPerfect = checkPerfectCrop(overspill, threshold, width_accumulator);
	}
	
	var sizeListLength = sizeList.length;
	for (var k = 0; k < sizeListLength; k++) {
	    var sizeIndex = sizeList[k]; //<--a pic size
	    var toCropList = sizeDict[sizeIndex];
	    var newSize;
	
	    for (var z = 0; z < toCropList.length; z++) {
            var artifact_id = toCropList[z];
            var maxRemove = Math.ceil((1-threshold)*sizeIndex);

            if (amtLeft > 0 && amtLeft <= maxRemove) {
                //cropping this pic will finish it off
                newSize = sizeIndex - amtLeft;
                amtLeft = 0;
            } 
            else if (amtLeft > maxRemove) {
                if (k == sizeListLength - 1 && z == toCropList.length - 1) {
                    // This means we're cropping the last one in the row.
                    // We should be sure it takes up the remaining slack because
                    // rounding errors could leave a couple pixel-wide jagged edge
                    // otherwise
                    newSize = max_width - row_width_accumulator - MARGIN_WIDTH;
                    amtLeft = 0;
                } else {
                    newSize = sizeIndex - maxRemove;
                    amtLeft = amtLeft - maxRemove;
                }
            } else {
                newSize = artifactDivs[artifact_id].realWidth;
            }

            artifactDivs[artifact_id].croppedWidth = newSize;
            artifactDivs[artifact_id].posInRow = posDict[artifact_id];
            row_width_accumulator += artifactDivs[artifact_id].croppedWidth + MARGIN_WIDTH;
	    }
	}
    } else {
        // This means the row doesn't fill up the width. We simply need
        // to give each element it's appropriate row * pos
        for (var m = 0; m < rowacc_length; m++) {
            var index = row_accumulator[m];
            artifactDivs[index].croppedWidth = artifactDivs[index].realWidth;
            artifactDivs[index].posInRow = m;
        }
    }
}

/* checks if there is a perfect crop
 * that is, we dont have to crop all pics past threshold
 */
function checkPerfectCrop(overspill, threshold, width_accumulator) {
    if (Math.floor((1-threshold)*width_accumulator) >= overspill) {
	return 'True';
    } else {
	return 'False';
    }
}
/************************************
************************************/

/**
 * Given a fully populated list of artifactDivs, this method moves the divs to the appropriate
 * location on the page. It, however first checks to see if the div is already in the
 * correct location. If it is, it does not move it
 */
function moveArtifactDivs(artifactDivs) {
    var adivs_length = artifactDivs.length;
    for (var i=0; i < adivs_length; i++) {
        var artifactDiv = artifactDivs[i];

        /*
         * Check to make sure add_artifact and new_artifacts are #1 and 2 respectively
         */
        if (artifactDiv.id == "add_artifact" && i != 0) {
            // Fix data structure
            var tmp = artifactDivs.splice(i,1);
            artifactDivs.unshift(tmp[0]);
            // Since we're always sure we're putting this before the current
            // index, we don't have to update it.
            
            // Also move the physical div.
	    if (is_iOS == false) {
            	$("#add_artifact").parent(".artifact_row").prepend($("#add_artifact"));
	    }
            continue;
        }

        if (artifactDiv.id == "new_artifacts" && i != 1) {
            // Fix data structure
            var tmp = artifactDivs.splice(i,1);
            artifactDivs.splice(1,0,tmp[0]);
            // Since we're always sure we're putting this before the current
            // index, we don't have to update it.
            
            // Also move the physical div.
            $("#new_artifacts").siblings("#add_artifact").after($("#new_artifacts"));
            continue;
        }

        if (artifactDiv.id == "add_artifact" || artifactDiv.id == "new_artifacts") {
            // Don't move these special divs; If they need to be moved, the 
            // previous two methods will have taken care of that
            continue;
        }

            /*
             * This means the div does not exist yet. This is likely
             * because our socket added it to the data structure
             * before it was drawn.
             */
            
            // If it's in window.stagingPhotos, we skip this since it will
            // be automatically added to the main area by clearStaging
            

            /*
             *
             * The following code should ONLY be run when we are progressively
             * loading!
             *
             */

        if (inStagingPhotos(artifactDiv.id)) {
            continue;
        } else {
            if (!$("#"+artifactDiv.id).length) {
                console.log("Appending artifact from moveArtifact Divs");
                var newArtifact = ''+
                '       <div id="'+artifactDiv.id+'" class="artifact photo">'+
                '           <div class="hide_photo"><a href="#">hide</a></div>'+
                '           <div class="photo_container" style="width:'+artifactDiv.width+'px; height:'+artifactDiv.height+'px;">' + 
                '               <img class="photo" src="'+artifactDiv.thumb_url+'" height="175"\/>'+
                '           </div>' + 
                '       <\/div>';
                $("#new_artifacts").after(newArtifact);
                /*
                if ($("#row_"+artifactDiv.row).length) {
                    console.log($("#row_" + artifactDiv.row));
                    console.log(newArtifact);
                    $("#row_"+artifactDiv.row).prepend(newArtifact);
                    console.log($("#row_" + artifactDiv.row));
                } else {
                    // We need to make a new row first
                    new_row = "<div class='artifact_row' id='row_"+artifactDiv.row+"'></div>"
                    $("#"+artifactDiv.divArea).prepend(new_row);
                    $("#row_"+artifactDiv.row).prepend(newArtifact);
                }
                */
            } 
        }

        if (artifactDiv.row > window.numRows) {
            window.numRows = artifactDiv.row;
        }

        if (!artifactDiv.id || !artifactDiv.croppedWidth || !artifactDiv.divArea) {
            console.log("ERROR: artifactDiv has undefined terms");
            console.log(artifactDiv);
        }

        if (artifactDiv.croppedWidth && $("#"+artifactDiv.id).width() != artifactDiv.croppedWidth) {
            $("#"+artifactDiv.id).width(artifactDiv.croppedWidth);
        }
        

        // Be sure the images are centered properly
        var photoContainer = $("#"+artifactDiv.id).children(".photo_container");
        if (photoContainer.length > 0) {
            var centering = (artifactDiv.realWidth - artifactDiv.croppedWidth) / -2;
            var oldCenteringPos = photoContainer.css("left");
            if (centering != parseCssPx(oldCenteringPos)) {
                $("#"+artifactDiv.id).children(".photo_container").css('left', centering+"px");
            }
        }
        
        var row_num = $("#"+artifactDiv.id).parents(".artifact_row").attr("id");
        row_num = row_num.slice(4,row_num.length); // Take off the "row_" prefix
        row_num = Number(row_num);

        if (artifactDiv.row > row_num) {
            if ($("#row_"+artifactDiv.row).length) {
                $("#row_"+artifactDiv.row).prepend($("#"+artifactDiv.id));
            } else {
                // We need to make a new row first
                new_row = "<div class='artifact_row' id='row_"+artifactDiv.row+"'></div>"
                $("#"+artifactDiv.divArea).append(new_row);
                $("#row_"+artifactDiv.row).prepend($("#"+artifactDiv.id));
            }
        } else if (artifactDiv.row < row_num) {
            $("#row_"+artifactDiv.row).append($("#"+artifactDiv.id));
        } else {
            // Do nothing. leave it where it is.
        }

        // Move the rows to be in the correct div area
        
        var zoom_div = $("#"+artifactDiv.id).parents(".zoom_div").attr("id");
        if (artifactDiv.divArea != zoom_div) {
            // If we're not in the correct area, we should move the row
            var first_num = $("#"+artifactDiv.divArea).children(".artifact_row:first").attr("id");
            var last_num = $("#"+artifactDiv.divArea).children(".artifact_row:last").attr("id");
            if (first_num) {
                first_num = first_num.slice(4,first_num.length); // Take off the "row_" prefix
                first_num = Number(first_num);
            } else {first_num = -1;}
            if (last_num) {
                last_num = last_num.slice(4,last_num.length); // Take off the "row_" prefix
                last_num = Number(last_num);
            } else {last_num = 999999;}

            if (first_num == -1) {
                // This means the row doesn't have any divs in it yet. Doesn't matter whether
                // or not I append or prepend
                $("#"+artifactDiv.divArea).append($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num < first_num) {
                $("#"+artifactDiv.divArea).prepend($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num > last_num) {
                $("#"+artifactDiv.divArea).append($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num == first_num) {
                // This shouldn't happen. Why do we have a duplicate row!
                console.warn("Warning: Duplicate rows when trying to move rows in between divs");
                $("#"+artifactDiv.divArea+" row_"+row_num).remove();
                $("#"+artifactDiv.divArea).prepend($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num == last_num) {
                // This shouldn't happen. Why do we have a duplicate row!
                console.warn("Warning: Duplicate rows when trying to move rows in between divs");
                $("#"+artifactDiv.divArea+" row_"+row_num).remove();
                $("#"+artifactDiv.divArea).append($("#"+artifactDiv.id).parents(".artifact_row"));
            } else if (row_num > first_num && row_num < last_num){
                $("#"+artifactDiv.divArea).children(".artifact_row").each(function() {
                    var iter_row_num = $(this).attr("id");
                    iter_row_num = iter_row_num.slice(4,iter_row_num.length);
                    iter_row_num = Number(iter_row_num);
                    if (artifactDiv.row >= iter_row_num) {
                        $("#"+artifactDiv.id).parents(".artifact_row").insertAfter($(this));
                    }
                })
            }
        }
    }
}


/*****************************************
 * ARTIFACT PROGRESSIVE LOADING
 *****************************************/

/** loadartifacts([offset[, numartifacts]])
 * Loads the artifacts in json format for this memory
 * Stores it in the window.artifactServerData global
 *
 * @param offset - The photo index to start loading from
 * @param numartifacts - The number of artifacts to pull
 *
 * @returns Void
 *
 */
function loadartifacts(offset, numartifacts) {
    var loaded_artifacts = null;
    var memory_id = $("#memory_id").html();
    if ($("#hidden_prompt").hasClass("showing_hidden")) {
        var show_hidden = 1;
    } else { var show_hidden = 0;}

    $.get("/memory", {"_id":memory_id, "offset":offset, "numartifacts":numartifacts, "show_hidden":show_hidden}, function(data) {
        window.artifactServerData = jsonParse(data);
        refreshServerData(window.artifactDivs);
        loadViewportPhotos();
    });
}

/**
 * loadViewportPhotos will read from the window.artifactDivs,
 * decide what photos are in the viewport, then insert the
 * thumbnail images for only those that don't have one already
 */
function loadViewportPhotos() {
    var load_top = $(window).scrollTop() - 200;
    var load_bottom = $(window).scrollTop() + $(window).height() + 700;

    var a_divlength = window.artifactDivs.length;
    for (var i = 0; i < a_divlength; i++) {
        var artifact = window.artifactDivs[i];

        if (artifact.id == "add_artifact" || artifact.id == "new_artifacts") {continue;}

        if (artifact.thumb_url == undefined) {
            // This means that the server data hasn't populated yet.
            // That needs to happen before this function runs.
            return;
        }

        var artifact_top = $("#"+artifact.id).offset().top;
        if (artifact_top >= load_top && artifact_top <= load_bottom) {
            if ($("#"+artifact.id).find("img").attr("src") == artifact.thumb_url) {
                // If the img doesn't exist, it will return 'undefined'
                continue;
            }
            var div_width = $("#"+artifact.id).width();
            var photo_width = $("#"+artifact.id).children(".photo_container").width();
            var centering = (photo_width - div_width) / -2;

            var imgdiv = "<img src="+artifact.thumb_url+" height='"+ARTIFACT_HEIGHT+"' width='"+artifact.width+"' class='photo'/>"
            $("#"+artifact.id).children(".photo_container").css('left', centering);
            $("#"+artifact.id).children(".photo_container").html(imgdiv);
        }
    }
}

/**************************************
 * Photo Drag Functions
 * ***********************************/

function updatePos() {
    var newPositions = []
    var addArtifact = getArtifactDivByID("add_artifact");
    newPositions.push(addArtifact);

    //create a new artifactDiv array
    var rowCounter = 0;
    $(".artifact_row").each(function() {
	rowCounter ++;
    });

    $(".artifact_row").each(function() {
	//get artifactDivs in each row
	var rowCounter = 0;
	var row = $(this).sortable('toArray');
	if (row[0] == "new_artifacts") {
	    //row.splice(0,1);
	    var newArts = row[0];
	}
	var rowLength = row.length;
	for (var i = 0; i < rowLength; i++) {
	    //add each artifactDiv to newPositions
	    //newPositions gives new, updated array
	    var id = row[i]
	    var artifactDiv = getArtifactDivByID(id);
	    newPositions.push(artifactDiv);

	    //OR
	    //ui.item = current dragged element
	    //get that artifact's (ui.item) index in original array
	    //get a (new) neighbor's index in original array
	    //splice that artifact div out
	    //put that artifact div in the correct place in array
		//next to its new neighbor

	}
    });
    //window.artifactDivs = newPositions;
    console.log("updating artifact divs because we dragged and dropped");
    updateArtifactDivs(/*newPositions*/);
    
}


function initPhotoDrag() {
    $(".artifact_row").sortable({
	connectWith: ".artifact_row",
	items: "> div:not(#add_artifact)",
	update: function() {
		    if (window.artifactDivs) {
		    	updatePos();
		    }

		}    
    });
}


/**************************************
 * Expansion Functions
 * ************************************/

/**
 * Our zoom function needs to know what the image looks like
 * after it has expanded. That's the only way we can get accurate
 * reference coordinates of the image.
 *
 * This method is very similar to the artifactExpand method, except
 * it does not actually change any photos
 *
 * It returns the number of pixels the top-left corner will move by.
 * + means it moves to the right
 * - means it moves to the left
 *
 * Note that currently this should always return either 0 or a negative number
 */
function calculateArtifactExpansion(artifact) {
    var a_div = getArtifactDivByID($(artifact).attr("id"));
    var left_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow + 1);
    var slack = a_div.realWidth - a_div.croppedWidth;
    if (left_ofDiv !== false && right_ofDiv !== false) {
        // This means there are items to both the left AND right
        return -slack / 2
    } else if (left_ofDiv === false && right_ofDiv !== false) {
        // This means our artifact is on the far left margin
        // The top-left corner should not move
        return 0;
    } else if (left_ofDiv !== false && right_ofDiv === false) {
        // This means our artifact is on the far right margin
        return -slack;
    } else {
        // This means our div is all by itself on the row
        // The top-left corner should not move
        return 0;
    }
}

/**
 * Expands the preview of the current artifact and shrinks
 * the surrounding artifacts so it fits properly
 */
function artifactExpand(artifact, instant) {
    instant = instant || false;
    var a_div = getArtifactDivByID($(artifact).attr("id"));
    var left_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow + 1);
    var slack = a_div.realWidth - a_div.croppedWidth;

    $("#"+a_div.id).stop(true,false);
    if (left_ofDiv !== false){
        $("#"+left_ofDiv.id).stop(true,false);
    }
    if (right_ofDiv !== false){
        $("#"+right_ofDiv.id).stop(true,false);
    }

    if (instant) {
        $("#"+a_div.id).width(a_div.realWidth);
    } else {
        $("#"+a_div.id).animate({width:a_div.realWidth}, 'fast');
    }
    
    if (instant) {
        $("#"+a_div.id).children(".photo_container").css("left","0px");
    } else {
        $("#"+a_div.id).children(".photo_container").animate({left:0}, 'fast');
    }

    if (left_ofDiv !== false && right_ofDiv !== false) {
        // This means there are items to both the left AND right
        var leftWidth = left_ofDiv.croppedWidth - slack / 2;
        var rightWidth = right_ofDiv.croppedWidth - slack / 2;
        if (instant) {
            $("#"+left_ofDiv.id).width(leftWidth);
            $("#"+right_ofDiv.id).width(rightWidth);
        } else {
            $("#"+left_ofDiv.id).animate({width:leftWidth},'fast');
            $("#"+right_ofDiv.id).animate({width:rightWidth},'fast');
        }
    } else if (left_ofDiv === false && right_ofDiv !== false) {
        // This means our artifact is on the far left margin
        var rightWidth = right_ofDiv.croppedWidth - slack;
        if (instant) {
            $("#"+right_ofDiv.id).width(rightWidth);
        } else {
            $("#"+right_ofDiv.id).animate({width:rightWidth},'fast');
        }
    } else if (left_ofDiv !== false && right_ofDiv === false) {
        // This means our artifact is on the far right margin
        var leftWidth = left_ofDiv.croppedWidth - slack;
        if (instant) {
            $("#"+left_ofDiv.id).width(leftWidth);
        } else {
            $("#"+left_ofDiv.id).animate({width:leftWidth},'fast');
        }
    } else {
        // This means our div is all by itself on the row
    }
}
/**
 * unexpands the div and fixes its neighbors. If instant is true, it does
 * not animate. This is used by the doZoom function notably
 */
function artifactUnExpand(artifact, instant) {
    instant = instant || false;
    
    var a_div = getArtifactDivByID($(artifact).attr("id"));
    var left_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = getArtifactDivByRowPos(a_div.row, a_div.posInRow + 1);

    $("#"+a_div.id).children(".photo_container").stop(true,false);
    var centering = (a_div.realWidth - a_div.croppedWidth) / -2;
    if (instant) {
        $("#"+a_div.id).children(".photo_container").css("left", centering+"px");
    } else {
        $("#"+a_div.id).children(".photo_container").animate({left:centering}, 'fast');
    }

    $("#"+a_div.id).stop(true,false);
    if (instant) {
        $("#"+a_div.id).width( a_div.croppedWidth );
    } else {
        $("#"+a_div.id).animate({width:a_div.croppedWidth}, 'fast');
    }

    if (left_ofDiv !== false) {
        $("#"+left_ofDiv.id).stop(true,false);
        if (instant) {
            $("#"+left_ofDiv.id).width( left_ofDiv.croppedWidth );
        } else {
            $("#"+left_ofDiv.id).animate({width:left_ofDiv.croppedWidth}, 'fast');
        }
    }
    if (right_ofDiv !== false) {
        $("#"+right_ofDiv.id).stop(true,false);
        if (instant) {
            $("#"+right_ofDiv.id).width( right_ofDiv.croppedWidth );
        } else {
            $("#"+right_ofDiv.id).animate({width:right_ofDiv.croppedWidth}, 'fast');
        }
    }
}


/*******************************************************
 * ZOOM FUNCTIONS
 * *****************************************************
 * STRATEGY:
 * On click, load in existing artifacts
 * Modify them to specify what div area they must be placed in
 * Move all of the divs
 * Calculate the zoom coordinates of the div
 * Handle the zoom.
 ******************************************************/

/**
 * Calculates and updates the scaleFactor global based on the inputted image size
 * If no inputs are given, it uses ARTIFACT_HEIGHT as the default scale value
 */
function calculateScaleFactor(a_width, a_height) {
    window.previousScaleFactor = window.scaleFactor;
    a_height = a_height || ARTIFACT_HEIGHT;
    a_width = a_width || ARTIFACT_HEIGHT;
    window.zoomHeight = ($(window).height() - 60) * (1 - (4 * MARGIN_WIDTH / a_height));
    window.zoomWidth = ($(window).width()) * (1 - (4.5 * MARGIN_WIDTH / a_width));

    var scaleWidth = window.zoomWidth / a_width;
    var scaleHeight = window.zoomHeight / a_height;

    window.scaleFactor = Math.min(scaleWidth, scaleHeight);
    
    //If default is 175, max size will be 800px. Don't go bigger than that
    window.scaleFactor = Math.min(window.scaleFactor, 4.5714);

    if(window.scaleFactor <= 0) {window.scaleFactor = 0.1;}

}


/**
 * Takes a jquery element as the zoom target.
 * The zoom target must have the class 'artifact'
 * It must be visible within the canvas area
 */
function zoomToArtifact(artifact) {
    if (window.zoomedIn == false) {
        updateContainerDivs(artifact); // Modify the artifactDivs data structure
        updateModifiedArtifactDivs(); // Move the divs to the appropriate spots
    }
    doZoom(artifact); // Actually do the transform
}

/**
 * Updates the global window.artifactDivs data structure to indicate
 * where the various photos should go
 */
function updateContainerDivs(artifact) {
    // Create a local copy to perform updates on then update the global
    var _artifactDivs = $.extend(true, [], window.artifactDivs);
    var scroll_top = $(window).scrollTop();
    var scroll_bottom = $(window).scrollTop() + $(window).height();
    var artifactTop = $(artifact).offset().top;

    var zoom_top;
    var zoom_bottom;

    if ((artifactTop - MARGIN_WIDTH - ARTIFACT_HEIGHT) <= scroll_top) {
        // This means we need to add an extra row to the zoom_top
        zoom_top = artifactTop - MARGIN_WIDTH - ARTIFACT_HEIGHT;
    } else {
        zoom_top = scroll_top - (ARTIFACT_HEIGHT - 60);
    }

    if ((artifactTop + ARTIFACT_HEIGHT + MARGIN_WIDTH) >= scroll_bottom) {
        // This means we need to add an extra row to the zoom_bottom
        zoom_bottom = scroll_bottom + MARGIN_WIDTH + ARTIFACT_HEIGHT;
    } else {
        zoom_bottom = scroll_bottom + (ARTIFACT_HEIGHT - 60);
    }

    var adiv_length = _artifactDivs.length;
    for (var i = 0; i < adiv_length; i++) {
        var a_top = $("#"+_artifactDivs[i].id).offset().top;
        if (a_top < zoom_top) {
            // This should be above the zoom div
            _artifactDivs[i].divArea = "above_zoom_div";
        } else if (a_top >= zoom_top && a_top <= zoom_bottom) {
            // This should be in our zoom div
            _artifactDivs[i].divArea = "in_zoom_div";
        } else if (a_top > zoom_bottom) {
            // This should be below the zoom div
            _artifactDivs[i].divArea = "below_zoom_div";
        } else {
            // We've got a problem
        }
    }
    
    window.artifactDivs = _artifactDivs;
    
}

/**
 * This is called from doUnZoom and adds some divs to the bottom
 * of #in_zoom_div so we don't get a wonky zoom out effect
 */
function addBottomContainers() {
    var scroll_top = $(window).scrollTop() + 70;
    var scroll_bottom = $(window).scrollTop() + $(window).height();

    $("#below_zoom_div").children(".artifact_row").each(function (){
        var a_top = $(this).offset().top;
        if (a_top <= scroll_bottom && a_top >= scroll_top) {
            // This should be above the zoom div
            $("#in_zoom_div").append($(this));
        } 
    });
}


/**
 * When the canvas is resized, make sure our all of our elements fit properly
 */
function resizeCanvas() {
    /**
     * Resolutions to keep in mind:
     * iPhone 3G: 320 x 480
     * iPhone 4: 640 x 960
     * iPad: 768 x 1024
     */

    calculateScaleFactor();

    var windowWidth = $(window).width();
    var sidemargins = 105; // The teal bars on the left and right
    if (windowWidth < 1060 && windowWidth > 320) {
        if (windowWidth <= 640) {
            $("#canvas_header #login").hide();
            $("#add_artifact").hide();
            $("#canvas_footer").hide();
            $("#header_accent_bar").hide();
            $(".canvas_center").css("margin-left",MARGIN_WIDTH + "px");
            var loginWidth = 0;
            sidemargins = MARGIN_WIDTH *2;
        } else {
            $("#canvas_header #login").show();
            $("#add_artifact").show();
            $("#canvas_footer").show();
            $("#header_accent_bar").show();
            $(".canvas_center").css("margin-left",0);
            var loginWidth = $("#canvas_header #login").width();
            sidemargins = 105;
        }

        $(".canvas_outer_wrapper").width(windowWidth);
        $(".canvas_center").width(windowWidth - sidemargins); // Normally 955px

        $("#canvas_title_wrap").width(windowWidth - sidemargins - loginWidth - 5);
        truncateTitle(windowWidth - sidemargins - loginWidth - 5);

        $("#new_artifacts").width($(".canvas_center").width() - 175 - 10 - 10);

        // This is to get a default padding of 113 px when it's > 1060px
        var alertbar_padding = windowWidth - 947;
        if (alertbar_padding >= 0) {
            $("#canvas #alert_bar").show();
            $("#canvas #alert_bar").css("padding-left", alertbar_padding+"px");
        } else {
            // This means it's too small for the alert bar
            $("#canvas #alert_bar").hide();
        }
    }
    WRAPPER_WIDTH = $(".canvas_center").width(); // Update resize global

    console.log("updating artifact divs because we resized the canvas");
    updateArtifactDivs();
}

/**
 * Truncates the title based on the amount of enclosing space available
 * Replaces the text with a "Title ..."
 */
function truncateTitle(enclosingSize) {
    enclosingSize = enclosingSize - 40; // Room for the '...'
    var truncatedTitle = window.canvasTitle.slice();
    var textSize = $("#canvas_title .click").width();
    var addDotDotDot = false;

    if (textSize <= 0 || enclosingSize <= 20) {
        return;
    }

    while (textSize >= enclosingSize) {
        addDotDotDot = true;
        truncatedTitle = truncatedTitle.slice(0, truncatedTitle.length - 1); // Pop off char
        $("#canvas_title .click").html(truncatedTitle);
        textSize = $("#canvas_title .click").width();
    }

    if (addDotDotDot) {
        truncatedTitle = truncatedTitle + "...";
        $("#canvas_title .click").html(truncatedTitle);
    } else {
        $("#canvas_title .click").html(window.canvasTitle);
    }
}

/**
 *
 * ====================== NOTES ON ZOOMING BROWSER DETAILS ==========
 * We adjust the left and top css position properties because they
 * reliably work across all browsers.
 *
 * !!! Left and Top are NOT affected by the scale. They are applied BEFORE
 * the zoom. This is true in both Chrome and Firefox. This represents the
 * position without any transform business
 *
 * !!! Offset and Position ARE affectd by the scale. They are calculated
 * by jquery after the scale happens. This represents the TRUE top and left
 * of a div after the scale is applied. This is true in both Chrome and FF
 *
 * !!! For elements INSIDE a scaled div, for example, the .artifacts inside
 * of #in_zoom_div, the behavior is DIFFERENT between browsers
 *     In CHROME, the position is calculated AFTER the scale
 *     In FIREFOX, the position is calculated BEFORE the scale
 *     The two numbers will be different by a the scale factor
 *
 * !!! The width and height for elements inside of a scaled div
 * (like .artifacts inside of #in_zoom_div) do NOT change depending
 * on the scale. This means if you want to translate by one of these
 * dimensions for a scaled div, you must multiply the dimension by the
 * scale factor
 *
 */
/**
 * Zoom in on an artifact. Assume it's already in the #in_zoom_div
 */
function doZoom(artifact) {
    window.enableLive = false;
    var artifactDiv = getArtifactDivByID($(artifact).attr("id"));

    calculateScaleFactor(artifactDiv.realWidth, ARTIFACT_HEIGHT);

    if (window.zoomedIn == false) {
        // If we're zooming in for the first time, quickly re-fix
        // the width to be expanding. This will hide a glitch caused
        // by updateModifiedArtifactDivs which undoes the expansion
        // Note, that if we already expand it, we don't need to recalculate
        // the expansion shift
        artifactExpand(artifact,true);
        var xExpansionShift = 0;
    } else {
        var xExpansionShift = calculateArtifactExpansion(artifact);
    }

    if (window.previousZoomTarget) {
        // Assuming there was a previous...
        if (window.zoomedIn == true) {
            // Return the previous photo to its normal cropped state
            // We need to do this so we can more easily calculate the appropriate
            // offset to move the divs when we're zoomed in.
            // It's easier to just move the divs (which we have to do anyways)
            // than to recalculate the whole thing
            if ($(window.previousZoomTarget).attr("id") != $(artifact).attr("id")) {
                // Only do this, of course, if we haven't clicked on the same image
                // If so, we're actually just zooming out
                var previousArtifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                artifactUnExpand(window.previousZoomTarget, true);
            }

        }
    }


    if ($("#alert_bar:visible").length > 0) {
        $("#alert_bar").hide('fast');
    }

    $("#artifact_wrapper").height($("#in_zoom_div").height()*window.scaleFactor);

    var zoomDivWidth = $("#in_zoom_div").width();
    var zoomDivHeight = $("#in_zoom_div").height();

    var artifactPos = $(artifact).position();
    if (window.zoomedIn == false) {
        artifactPos.left = artifactPos.left + 0; // Shift because of image expansion
    } else {
        if (BrowserDetect.browser == "Firefox") {
            // See zoom notes above as to why we have to do this
            artifactPos.left = (artifactPos.left + xExpansionShift) * window.scaleFactor;
            artifactPos.top = artifactPos.top * window.scaleFactor;
        } else {
            artifactPos.left = artifactPos.left + (xExpansionShift * window.scaleFactor); // Shift because of image expansion
        }
    }

    var xOrigin = (artifactPos.left) / $("#in_zoom_div").width() * 100;
    var yOrigin = (artifactPos.top) / $("#in_zoom_div").height() * 100;

    var topOffset = ($(window).height() - 70 - ( $(artifact).height() + 10 ) * window.scaleFactor) / 2;
    var scrollOffset = $(window).scrollTop();

    var rightMargin = $(window).width() - $("#artifact_wrapper").width() - $("#artifact_wrapper").offset().left;
    var leftMargin = $("#artifact_wrapper").offset().left;
    var symmetryBias = ( rightMargin - leftMargin ) / 2 - 20; // subtract 20 for the scrollbar
    var centeringOffset = $("#artifact_wrapper").width() / 2 + symmetryBias - (artifactDiv.realWidth / 2 * window.scaleFactor);

    $("#above_zoom_div").css("visibility", "hidden");
    $("#below_zoom_div").css("visibility", "hidden");

    var aboveZoomDivHeight = $("#above_zoom_div").height();

    var newPosX = $("#in_zoom_div").width() * (xOrigin/100) - centeringOffset;
    var newPosY = $("#in_zoom_div").height() * (yOrigin/100) - scrollOffset - topOffset + aboveZoomDivHeight;

    var xTranslate = newPosX;
    var yTranslate = newPosY;

    $(artifact).children(".hide_photo").hide();

    if (window.zoomedIn == false) {
        $("#in_zoom_div").transform({origin:[xOrigin+'%', yOrigin+'%']});
        $("#in_zoom_div").animate({
            scaleX: window.scaleFactor,
            scaleY: window.scaleFactor,
            left: - xTranslate + 'px',
            top: - yTranslate + 'px'
        },'slow');

        $("#canvas_footer").animate({
            bottom:'-60px'
        }, 'slow');

        window.zoomedIn = true;
    } else if (window.zoomedIn == true) {

        if (window.previousZoomTarget) {
            if ($(window.previousZoomTarget).attr("id") == $(artifact).attr("id")) {
                // This means we've clicked on the same thing
                doUnZoom();
                return
            }

        }
        $("#in_zoom_div").animate({
            origin: ["0%", "0%"],
            scaleX: window.scaleFactor,
            scaleY: window.scaleFactor,
            left: - xTranslate + 'px',
            top: - yTranslate + 'px',
        },'fast', function() {
            // As soon as we're done panning, we need to see if we
            // need to update #in_zoom_div. This will happen any time
            // we pan up or down since we need to add or pop rows
            // accordingly
            updateInZoomDivPan(artifactDiv, previousArtifactDiv);
        });
    }

    // Be sure we're looking at an expanded photo with no cruft on it
    artifactExpand(artifact);

    window.previousZoomTarget = artifact;
}

/**
 * Zoom Transforms ================================
 * We need transform functions to interchange between the CSS top and left
 * values we get out of our divs and the position properties that is returned
 * by jQuery. Position is relative to the enclosing container. Top and Left are
 * the relative offset positions of the divs before the transform is applied.
 *
 * The transform needs to take into account the scale origins as well since that
 * affects the positioning of the elements.
 *
 * This has been tested to be true in Chrome and Firefox
 */
function posYToTop(posY, height, scale, yOrigin, aboveHeight) {
    return posY + (height * scale * yOrigin)/200 - aboveHeight;
}
function topToPosY(div_top, height, scale, yOrigin, aboveHeight) {
    return (div_top + aboveHeight) - (height * scale * yOrigin)/200;
}
function posXToLeft(posX, width, scale, xOrigin) {
    return posX + (width * scale * xOrigin)/200;
}
function leftToPosX(div_left, width, scale, xOrigin) {
    return div_left - (width * scale * xOrigin)/200;
}

/**
 * After a pan has been completed when looking at zoomed-in photos, we may have to update
 * the #in_zoom_div to add or remove rows. This detects whether or not this has
 * to happen and then moves the rows in place without changing the relative viewport
 * 
 * artifactDiv and previousArtifactDiv are ArtifactDiv objects
 */
function updateInZoomDivPan(artifactDiv, previousArtifactDiv) {
    // Now we need to see if we're navigating up or down. If so, we need to try and grab another row to add to the #in_zoom_div
    var previousRow = previousArtifactDiv.row;
    var currentRow = artifactDiv.row;

    if (previousRow != currentRow) {
        // First see what the first and last rows of #in_zoom_div are so we can grab the correct row
        
        var initialAboveHeight = $("#above_zoom_div").height();
        var initialPosition = $("#in_zoom_div").position();
        var initialScrollTop = $(window).scrollTop();

        var first_num = $("#in_zoom_div").children(".artifact_row:first").attr("id");
        if (first_num) {
            first_num = first_num.slice(4,first_num.length); // Take off the "row_" prefix
            first_num = Number(first_num);
        }
        var last_num = $("#in_zoom_div").children(".artifact_row:last").attr("id");
        if (last_num) {
            last_num = last_num.slice(4,last_num.length); // Take off the "row_" prefix
            last_num = Number(last_num);
        }

        if (previousRow > currentRow) {
            // PAN UP ------------------
            // This means we've clicked a photo above the last one we were just at.
            // I want to pop off everything plus 2 rows (inclusive) below me
            // I want to make sure the row above me and two rows above me exists
            var cutOffRow = currentRow + 2;
            var includeUpToRow = currentRow - 2;
            
            $("#in_zoom_div").children(".artifact_row").each(function() {
                thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                if (thisRow === null) {
                    return;
                }
                if (thisRow > cutOffRow ) {
                    // Any row too far below gets moved into #below_zoom_div
                    $("#below_zoom_div").prepend($(this));
                }
                if (thisRow < includeUpToRow) {
                    // Any row too far above gets moved into #above_zoom_div
                    $("#above_zoom_div").append($(this));
                }
            });

            $("#above_zoom_div").children(".artifact_row").each(function() {
                thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                if (thisRow === null) {
                    return;
                }
                if (thisRow >= includeUpToRow ) {
                    // Any row that's above me that's supposed to be in #in_zoom_div gets moved in
                    $("#in_zoom_div").prepend($(this));
                }
            });

        } else if (previousRow < currentRow) {
            // PAN DOWN -----------
            // This means we've clicked an artifact below the last one we were just at.
            // I want to pop off everything minus 2 rows (inclusive) and above of me.
            // I want to try and make sure that the row below me and two rows below
            // me exist
            var cutOffRow = currentRow - 2;
            var includeUpToRow = currentRow + 2;

            if (currentRow < window.numRows) {
                // Don't change stuff if we've reached the last row
                // This prevents a visual glitch related to the fact that scroll
                // can't scroll beyond the bottom of the page
                $("#in_zoom_div").children(".artifact_row").each(function() {
                    thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                    if (thisRow === null) {
                        return;
                    }
                    if (thisRow < cutOffRow ) {
                        // Any row too far above gets moved into #above_zoom_div
                        $("#above_zoom_div").append($(this));
                    }
                    if (thisRow > includeUpToRow) {
                        // Any row too far below gets moved into #below_zoom_div
                        $("#below_zoom_div").prepend($(this));
                    }
                });

                $("#below_zoom_div").children(".artifact_row").each(function() {
                    thisRow = parsePrefixToNum($(this).attr("id"), "row_");
                    if (thisRow === null) {
                        return;
                    }
                    if (thisRow <= includeUpToRow ) {
                        // Any row that's below me that's supposed to be in #in_zoom_div gets moved in
                        $("#in_zoom_div").append($(this));
                    }
                });
            }
        }
        
        var postAboveHeight = $("#above_zoom_div").height();
        var postPosition = $("#in_zoom_div").position();

        // Now that the rows have been moved, we need to reposition the div and scroll accordingly
        var aboveHeightDiff = postAboveHeight - initialAboveHeight;
        var positionDiff = postPosition.top - initialPosition.top ;
        positionDiff = positionDiff * window.scaleFactor;

        var newTop = parseCssPx($("#in_zoom_div").css("top")) + positionDiff;

        $("#in_zoom_div").css("top",newTop);

        $(window).scrollTop(initialScrollTop + aboveHeightDiff);
        //var newTop = parseCssPx($("#in_zoom_div").css("top")) + positionDiff + aboveHeightDiff;

    }

}


/**
 * Undoes the zoom. Updates the globals and resets the zoom parameters
 */
function doUnZoom() {
    window.zoomedIn = false;

    // Need to add some from #below_zoom_div to #in_zoom_div before we zoom out
    
    addBottomContainers(); // Modify the artifactDivs data structure

    $("#above_zoom_div").css("visibility", "visible");
    $("#below_zoom_div").css("visibility", "visible");
    $("#canvas_footer").animate({
        bottom:'0px'
    }, 'slow');
    $("#in_zoom_div").animate({
        scaleX: 1,
        scaleY: 1,
        left: 0,
        top: 0
    },'slow', function() {
        $("#artifact_wrapper").height('auto');
        window.enableLive = true;
        console.log("Updating divs after unzoom just in case we have more live photos");
        updateArtifactDivs();
    });
}



/**
 * In the upload area, we need to resize the holding and staging
 * wrappers so the images tile properly and display correctly
 */
function resizeHoldingWrappers() {
    var numHolding = $("#uploadArea_holding_div").children(".canvas_upload_div").length
    var numStaging = $("#uploadArea_staging_div #staging_content").children(".canvas_upload_div").length

    var holdingWidth = Math.ceil(numHolding / 2) * 80 + 10; // 70px + 10px of margins
    var minStagingWidth = Math.ceil(numStaging / 2) * 80; // Space needed for staging photos
    var availableArea = $("#new_artifacts").width() - 101; // 101px for #uploadArea_title_div and border
    var maxHoldingWrapperWidth = availableArea - (minStagingWidth + 1);

    if (holdingWidth <= maxHoldingWrapperWidth) {
        var holdingWrapperWidth = holdingWidth;
        var stagingWrapperWidth = availableArea - holdingWrapperWidth - 1;
        var stagingWidth = minStagingWidth;
    } else {
        var holdingWrapperWidth = availableArea - (minStagingWidth +1);
        var stagingWrapperWidth = minStagingWidth;
        var stagingWidth = minStagingWidth;
    }

    $("#uploadArea_holding_div").width(holdingWidth);
    $("#uploadArea_holding_wrapper").width(holdingWrapperWidth);
    $("#uploadArea_staging_div").width(stagingWrapperWidth);
    $("#uploadArea_staging_div #staging_content").width(stagingWidth);
}


/**
 * Checks to see if the id is in staging Photos
 * @param {string} id - The id of an artifact (without prefix)
 * @return True if in, false if not
 */
function inStagingPhotos(artifactId) {
    for (var id in window.stagingPhotos) {
        var file = window.stagingPhotos[id]
        if (artifactId == "artifact_" + file.id) {
            return true;
        } else {
            continue;
        }
    }
    return false;
}


/**
 * Grabs the divs inside of the upload staging area and adds them to the page
 * and calls update ArtifactDivs
 */
function clearStaging() {
    if (window.zoomedIn == false) {
        var id;

        if (!$("#row_1").length) {
            var new_row = "<div class='artifact_row' id='row_1'></div>"
            $("#above_zoom_div").append(new_row);
        }

        for (id in window.stagingPhotos) {
            if (id == "length") {
                continue;
            }
            var file = window.stagingPhotos[id];
            console.log("============================");
            console.log(file);
            $("#artifact_"+file.id).remove(); // Should remove from the staging area

            // Check to see if the Socket populated this photo first
            var existingThumb = getServerDataFieldByID(file.id, "thumb_url");
            if (existingThumb !== undefined) {
                file.thumb_url = existingThumb;
            }

            // Now we build it again prepending to row 1
            if (!$("#artifact_"+file.id).length) {
                // Only add the new artifact if it doesn't exist yet!
                console.log("Appending artifact from clear Staging");
                var newArtifact = ''+
                '       <div id="artifact_'+file.id+'" class="artifact photo">'+
                '           <div class="hide_photo"><a href="#">hide</a></div>'+
                '           <div class="photo_container" style="width:'+file.width+'px; height:'+file.height+'px;">' + 
                '               <img class="photo" src="'+file.thumb_url+'" height="175"\/>'+
                '           </div>' + 
                '       <\/div>';
                $("#new_artifacts").after(newArtifact);
            }

            delete window.stagingPhotos[id];
        }

        console.log("updating artifact divs because we're clearing the staging area");
        updateArtifactDivs();

    }
}


/**
 * When we get an upload error we leave divs lying around.
 * This function cleans them up and is simply a copy and paste convenience
 */
function clearUploadError(handler) {
    handler.removeNode(handler.uploadRow);
    $(handler.uploadRow).remove();
    window.uploadError = false;
    $("#new_artifacts").hide('fast', function() {
        clearStaging();
    });
}



/****************************************
 * FILE UPLOAD ON CANVAS PAGE
 * *************************************/
$(function() {
$("#canvas_file_upload").fileUploadUI({
    
        fieldName: "photo",
        dropZone: $('html'),
        uploadTable: $('#uploadArea_holding_div'),
        downloadTable: $('#uploadArea_staging_div #staging_content'),
        progressSelector: $('.file_upload_canvas_progress'),
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
        onDragEnter: function(event) {
            $("#add_artifact").css("-moz-box-shadow", "2px 2px 11px #1e5957");
            $("#add_artifact").css("-webkit-box-shadow", "2px 2px 11px #1e5957");
            $("#add_artifact").css("box-shadow", "2px 2px 11px #1e5957");
        },
        onAbort: function(event, files, index, xhr, handler) {
            $("#add_artifact").css("-moz-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("-webkit-box-shadow", "2px 2px 7px #111");
            $("#add_artifact").css("box-shadow", "2px 2px 7px #111");
            handler.removeNode(handler.uploadRow);
            handler.onCompleteAll(files);
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
            if (!files.uploadCounter) {
                window.enableLive = false;
                files.uploadCounter = 1;  
                /* files.uploadCounter is set the after the first upload 
                 * If we get here that means we're looking at the first upload */
                $("#new_artifacts").show();
                $("#uploadArea_title_div #total").html(files.length);
                console.log("updating artifact divs because we just showed the new artifacts uploader pane");
                updateArtifactDivs();
            } else {
                files.uploadCounter += 1;
            }
            $("#uploadArea_title_div #current").html(files.uploadCounter);
            resizeHoldingWrappers();

            var regexp = /\.(bmp)|(png)|(jpg)|(jpeg)|(gif)$/i;
            // Using the filename extension for our test,
            // as legacy browsers don't report the mime type
            if (!regexp.test(files[index].name)) {
                $(handler.uploadRow).html("MUST BE IMAGE (BMP PNG JPG JPEG GIF)");
                $(handler.uploadRow).css("border-color","#e3372d")
                window.uploadError = true;
                setTimeout(function () {
                    clearUploadError(handler);
                }, 5000);
                return;
            }

            if (files[index].size === 0) {
                $(handler.uploadRow).html('FILE IS EMPTY!');
                $(handler.uploadRow).css("border-color","#e3372d")
                window.uploadError = true;
                setTimeout(function () {
                    clearUploadError(handler);
                }, 5000);
                return;
            }

            if (files[index].size > FILE_UPLOAD_LIMIT) {
                var maxSizeMB = FILE_UPLOAD_LIMIT / 1000000;
                $(handler.uploadRow).html('FILE TOO BIG! Max: '+maxSizeMB+"MB");
                $(handler.uploadRow).css("border-color","#e3372d")
                window.uploadError = true;
                setTimeout(function () {
                    clearUploadError(handler);
                }, 5000);
                return;
            }


            callBack();
        },
        onComplete: function (event, files, index, xhr, handler) {
            handler.onCompleteAll(files);
        },
        onCompleteAll: function (files) {
            // The files array is a shared object between the instances of an upload selection.
            // We extend it with a uploadCounter to calculate when all uploads have completed:

            if (files.uploadCounter != 0 && files.uploadCounter % STAGING_SIZE == 0) {
                clearStaging();
            }
        
            resizeHoldingWrappers();

            if (files.uploadCounter >= files.length) {
                /* your code after all uplaods have completed */
                if (window.stagingPhotos.length()) {
                    clearStaging();
                }

                if (window.uploadError == false) {
                    $("#new_artifacts").hide('fast', function() {
                        console.log("updating artifact divs because we just hid the new_artifacts upload pane");
                        updateArtifactDivs();
                    });
                }
                window.enableLive = true;
            }
        },
        buildUploadRow: function (files, index) {
            return $(
                '<div class="canvas_upload_div">'+files[index].name+'</div>'
            );
        },
        buildDownloadRow: function (file) {
            window.stagingPhotos[file.id] = file;

            // Check to see if the Socket populated this photo first
            var existingThumb = getServerDataFieldByID(file.id, "thumb_url");
            if (existingThumb !== undefined) {
                file.thumb_url = existingThumb;
            }

            return $(
                '<div id="artifact_'+file.id+'" class="canvas_upload_div" style="float:left">' +
                '   <img class="photo" src="'+file.thumb_url+'" height="70"\/>'+
                '<\/div>'
            );
        }

});
});






$(document).ready(function(){
    iOS_running();

    loadartifacts(0,100);

    window.canvasTitle = $("#canvas_title .click").html();

    /* ************************************************* *
     * CANVAS - Controls the hide button on artifacts
     * **************************************************/
  if (is_iOS == false) {
    $(".hide_photo").hover(function(){
        $(this).parent(".artifact").addClass("opacity40");
        if ($(this).parent(".artifact").hasClass("artifact_hidden")) {
            // Don't do anything, keep it lit.
        } else {
            $(this).parent(".artifact").css("opacity", "0.5");
            $(this).parent(".artifact").css("-ms-filter", "alpha(opacity=.5)");
            $(this).parent(".artifact").css("filter", "alpha(opacity=.5)");
        }
    }, function(){
        $(this).parent(".artifact").removeClass("opacity40");
        if($(this).parent(".artifact").hasClass("artifact_hidden")) {
            // Do nothing
        } else {
            $(this).parent(".artifact").css("opacity", "1");
            $(this).parent(".artifact").css("-ms-filter", "alpha(opacity=1)");
            $(this).parent(".artifact").css("filter", "alpha(opacity=1)");
        }
    });
  
    $(".hide_photo").click(function(){
        var visible;

        // Note, IDs of artifacts are prefixed with 'artifact_'. We must strip this first
        id = $(this).parent().attr("id");
        id = id.slice(9,id.length);

        if ($(this).parent().hasClass("artifact_hidden")) {
            visible = 0;
            $.post("/toggle_visibility", {'visibility':visible, 'id':id});
            $(this).parent(".artifact").css("opacity", "1");
            $(this).parent(".artifact").css("-ms-filter", "alpha(opacity=1)");
            $(this).parent(".artifact").css("filter", "alpha(opacity=1)");
            $(this).html("<a href='#'>hide</a>");
            $(this).parent().removeClass("artifact_hidden");
            window.justChangedHidden = true;
        } else { 
            visible = 1; 
            $.post("/toggle_visibility", {'visibility':visible, 'id':id});

            if ($("#hidden_prompt").hasClass("showing_hidden")) {
                $(this).parent(".artifact").css("opacity", "0.5");
                $(this).parent(".artifact").css("-ms-filter", "alpha(opacity=.5)");
                $(this).parent(".artifact").css("filter", "alpha(opacity=.5)");
                $(this).parent().addClass("artifact_hidden");
                $(this).html("hidden photo<br/><a href='#'>show</a>");
                window.justChangedHidden = true;
            } else {
                $(this).parent(".artifact").hide();
                $(this).parent(".artifact").remove();
                
                console.log("updating artifact divs because we just hid a photo");
                updateArtifactDivs();
            }
        }

    });
  }


    /* ************************************************* *
     * CANVAS - Login Form Methods
     * **************************************************/
	$('#canvas_login_form').show();
	$("#canvas_login_form").inputHintOverlay(3, 5);

    $("#canvas_login_close").click(function(){
        $("#canvas_login_prompt").show();
        $("#canvas_login_div").hide();
    })
	$("#canvas_login_text").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});
	$("#canvas_signup_text").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});

	$("#alert_bar_login").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});
	$("#alert_bar_signup").click(function() {
        $("#canvas_login_div").show();
        $(".login_email #email").focus();
        $("#canvas_login_prompt").hide();
	});

    /* ************************************************* *
     * CANVAS - Share Bar
     * **************************************************/
    var originalShareText = "<div id='prompt'>Copy this Link:</div><div id='chrome_fix_div'><div id='link'><input id='share_link_value' type='text' value='"+window.location+"' /></div></div>";
	$("#share_area").hover(function() {
		$("#share_link_area").show();
		$("#share_area #share_link_value").focus();
		$("#share_area #share_link_value").select();
	}, function(e) {
        if (e.target == this || $(e.target).attr("id") == "share_bar" || $(e.target).attr("id") == "chrome_fix_div" || $(e.target).attr("id") == "share_link_area") {
            $("#share_link_area").hide();
            $("#share_area #share_link_area").html(originalShareText);
        }
	});
    $("#share_area").mousedown(function() {
        $("#share_area #share_bar").css("background", "#11b0aa url(/static/images/share_hover.jpg) no-repeat top left");
        $("#share_area #share_link_area").css("background", "#11b0aa");
    });
    $("#share_area").mouseup(function() {
        $("#share_area #share_bar").css("background", "#189792 url(/static/images/share_default.jpg) no-repeat top left");
        $("#share_area #share_link_area").css("background", "#189792");
		$("#share_area #share_link_value").focus();
		$("#share_area #share_link_value").select();
    });

    $("#share_area").bind("copy", function() {
        var share_link_area_text = "<div id='prompt'>Copied to clipboard! Give to friends! Any of them with this link can add their photos too.</div>"
        $("#share_area #share_link_area").html(share_link_area_text);
    });

    $("#alert_bar #share").click(function() {
        $("#share_link_area").show();
    });
    $("#alert_bar #hide_this").click(function() {
        $("#alert_bar").hide('fast');
    });
    
    /* ************************************************* *
     * Control photo-dragging on artifact divs
     * **************************************************/
    //getArtifactDivByID($(artifact).attr("id"));
    initPhotoDrag();

    /* ************************************************* *
     * Control Hover action on artifact divs
     * **************************************************/
  if (is_iOS == false) {
    $("#add_artifact").hover(function(){
        $(".blue_hover").css("color", "#11b0aa");
    }, function(){
        $(".blue_hover").css("color", "#189792");
    });
    $("#add_artifact").click(function() {
        if (window.zoomedIn == true) {
            doUnZoom();
        }
    })

    $(".artifact").live("mouseenter", function() {
        if (window.zoomedIn == false) {
            $(this).children(".hide_photo").show();

            $(this).css("opacity", "1");
            $(this).css("-ms-filter", "alpha(opacity=1)");
            $(this).css("filter", "alpha(opacity=1)");

            artifactExpand($(this));
        }
    }).live("mouseleave", function() {
        if (window.zoomedIn == false) {
            $(this).children(".hide_photo").hide();

            if($(this).hasClass("artifact_hidden")) {
                $(this).css("opacity", "0.5");
                $(this).css("-ms-filter", "alpha(opacity=.5)");
                $(this).css("filter", "alpha(opacity=.5)");
            }

            artifactUnExpand($(this));
        }
    });

    $(".photo_container").live("click",function() {
        if ($(this).parents(".artifact").hasClass("no_crop")) {
            return;
        }
        zoomToArtifact($(this).parent(".artifact"));
    });
  }

    /* ************************************************* *
     * Title renaming
     * **************************************************/
	$(".click").editable("/rename_memory", { 
        data : function(value, settings) {
            return window.canvasTitle;
        },
        indicator : "<img src='{{url_for('static', filename='images/indicator.gif')}}'>",
        tooltip   : "Click to edit. Push enter to save.",
        style  : "inherit",
        id: "id",
        name: "new_name",
	    onblur: "submit",
        callback : function(value, settings) {
            window.canvasTitle = value;
            truncateTitle($("#canvas_title_wrap").width());
        }
	});
    WRAPPER_WIDTH = $("#artifact_wrapper").width();

    /* ************************************************* *
     * Detect Scroll
     * **************************************************/
    $(window).mousewheel(function(e){
        if (window.zoomedIn == true) {
            e.preventDefault();
        }
    });
    $(window).scroll(function(){
        if($(window).scrollTop() + $(window).height() >= 
            $(document).height() - ARTIFACT_HEIGHT ) {
        } else {
            loadViewportPhotos();
        }
    });

    /* ************************************************* *
     * Detect Arrow Keys
     * **************************************************/
    $(window).keydown(function(key) {
        if (key.keyCode == 37) {
            // LEFT
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                leftArtifact = getArtifactDivByRowPos(artifactDiv.row, artifactDiv.posInRow - 1);
                if (leftArtifact !== false) {
                    doZoom("#"+leftArtifact.id);
                } else {
                    // Look at the next row up on the other end
                    rowChange = getArtifactDivByRowPos(artifactDiv.row - 1, getArtifactDivRowLength(artifactDiv.row-1) - 1);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 38) {
            // UP
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                aboveArtifact = getArtifactDivByRowPos(artifactDiv.row - 1, artifactDiv.posInRow);
                if (aboveArtifact !== false) {
                    doZoom("#"+aboveArtifact.id);
                } else {
                    // There's probably one, but we're too far out.
                    rowChange = getArtifactDivByRowPos(artifactDiv.row - 1, getArtifactDivRowLength(artifactDiv.row-1) - 1);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 39) {
            // RIGHT
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                rightArtifact = getArtifactDivByRowPos(artifactDiv.row, artifactDiv.posInRow + 1);
                if (rightArtifact !== false) {
                    doZoom("#"+rightArtifact.id);
                } else {
                    // Look at the next row down on the other end
                    rowChange = getArtifactDivByRowPos(artifactDiv.row + 1, 0);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 40) {
            // DOWN
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = getArtifactDivByID($(window.previousZoomTarget).attr("id"));
                belowArtifact = getArtifactDivByRowPos(artifactDiv.row + 1, artifactDiv.posInRow);
                if (belowArtifact !== false) {
                    doZoom("#"+belowArtifact.id);
                } else {
                    // There's probably one, but we're too far out.
                    rowChange = getArtifactDivByRowPos(artifactDiv.row + 1, getArtifactDivRowLength(artifactDiv.row+1) - 1);
                    if (rowChange !== false) {
                        doZoom("#"+rowChange.id);
                    }
                }
            }
        } else if (key.keyCode == 8) {
            // BACKSPACE
            if (window.zoomedIn == true) {
                key.preventDefault();
                doUnZoom();
            }
        } else if (key.keyCode == 13) {
            // ENTER
            if (window.zoomedIn == true) {
                key.preventDefault();
                doUnZoom();
            }
        } else if (key.keyCode == 27) {
            // ESCAPE
            if ($("#canvas_login_div:visible").length > 0) {
                $("#canvas_login_div").hide();
                $("#canvas_login_prompt").show();
            }
            if (window.zoomedIn == true) {
                key.preventDefault();
                doUnZoom();
            }
        }
    });
    

    truncateTitle($(".canvas_center").width() - $("#canvas_header #login").width());
    resizeCanvas();
    loadViewportPhotos();
	// update ArtifactDivs() is run by resizeCanvas

	$(window).resize(resizeCanvas);

});

