/********************************
 * Javascript for the Canvas Page
 ********************************/
var MARGIN_WIDTH = 10; // set a global margin
var BORDER_WIDTH = 4; // set a global margin
var ARTIFACT_HEIGHT = 175; // The standard height of all artifacts
var WRAPPER_WIDTH = 955;
var THRESHOLD = 0.8; // Maximum crop amount
var STAGING_SIZE = 6; // Number of photos staged before they're added to the page
var LOAD_SIZE = 100; // Number of photos to load when you reach the bottom
var DOCUMENT_HEIGHT = 99999; // so we don't need to look this up every time
var is_iOS;

window.artifactDivList = new ArtifactDivList();
window.firstRowUploadWidth = ARTIFACT_HEIGHT + MARGIN_WIDTH; // The space used for the upload button on the first row
window.pendingRender = false;

// A clock timer to slow down live update renders
window.updateTimeout = false;

window.lastScrollPos = 0; // The scrollbar position before we zoomed in

// out update Queue
window.updateQueue = [];

window.loadOffset = 0;


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

window.enableZoomAnimation = false; // A flag to indicate whether or not to animate the zoom

window.numRows = 0; // The total number of rows on the page
window.zoomHeight; // A global that says how tall the center area of the page is
window.scaleFactor = 1; // The factor that artifacts scale by when zoomed. Defaults to 1
window.previousScaleFactor = 1; // Used to adjust zooming when the scale factor changes
window.zoomedIn = false;
window.previousZoomTarget = undefined; // The last target that we were zoom focused on
window.canvasTitle = ""; // We store the canvas title as a global to get it back from the truncated version
window.justChangedHidden = false; // Used to temporarily disable the hide button hover
window.uploadError = false; // Keeps track if there's an upload error
window.loadingMoreArtifacts = false // A Boolean to prevent the loading of more artifacts as we keep scrolling
window.numPhotosLoaded = 0; // Number of photos on the page right now


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
    this.id = undefined;
    this.noCrop = undefined;
    this.divArea = undefined;
    this.display = undefined;

    this.croppedWidth = undefined;
    this.row = undefined;
    this.posInRow = undefined;

    // These are updated on render. This is so we don't have to go searching
    // through the DOM to know whether or not a change needs to be made
    this.lastSeenRow = undefined;
    this.lastSeenPosInRow = undefined;

    this.height = undefined;
    this.width = undefined;
    this.image_url = undefined;
    this.thumb_url = undefined;
    this.visible = undefined;

    // A flag set by the live server to indicate it's ready
    this.doneProcessing = undefined;
}

/**
 * The primary class used to wrap the fundamental model of all Artifact
 * elements on the page. This implements a queue to funnel several
 * asynchronous requests. It also has methods to control the rendering
 * of the page given the output of the model
 */
function ArtifactDivList() {

    /**
     * The classes primary data structure and the ordered container of
     * ArtifactDiv objects
     * @type {Array.<AritfactDiv>}
     */
    this.artifactDivList = [];
    this.length = function() {
        return this.artifactDivList.length;
    }

    /**
     * The add, edit, and delete lists keep track of all changes that
     * have not yet been rendered. While we instantly update the
     * artifactDivList, we only update the viewport when render is
     * called
     * @type {Array.<ArtifactDiv>}
     */
    this.addDivList = [];
    /**
     * Contains arrays with the element's index in the div list id, field, and value
     * that was edited
     * @type {Array.<{index, id, field, value}>}
     */
    this.editDivList = [];
    /**
     * Contains a list of ids that were deleted
     * @type {Array.<id>}
     */
    this.deleteDivList = [];

    /**
     * The primary event queue that holds and proccesses all changes
     * to the main artifactDivList.
     *
     * The event queue is a tuple (Array) with the first element a string
     * indicating the method to call and the second argument a 
     * dictionary of arguments keyed by the name of the argument.
     * @type {Array.<Object>}
     */
    this.eventQueue = [];
    this.addToEventQueue = function(method, args) {
        this.eventQueue.push([method, args]);
        this.processEvent();
    }
    this.eventInProgress = false;

    this.eventQueueSize = function() {
        return this.eventQueue.length;
    }

    /**
     * Pops the latest item off the queue and dispatches the appropriate
     * method with the given args
     */
    this.processEvent = function() {
        if (this.eventInProgress === false) {
            // Be sure to only process the event if no other thread is
            this.eventInProgress = true;

            var event = this.eventQueue.shift();
            if (event === undefined) {
                this.eventInProgress = false;
                return
            }

            this.method = event[0];
            var args = event[1];

            this.method(args);

            this.eventInProgress = false;
            this.processEvent(); // Keep plowing through the queue
        }
    }

    /**
     * Methods that return ArtifactDivs and properties of artifact divs
     * retrieved through various mechanisms
     * @return undefined if the item could not be found or the ArtifactDiv object
     */
    this.get = function(id) {
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            var artifactDiv = this.artifactDivList[i];
            if (artifactDiv.id == id) {
                return artifactDiv;
            }
        }
        return undefined;
    }
    /**
     * Grab the value at the field for the artifact with the appropraite id
     * @return undefined if field could not be found, otherwise return
     * whatever was stored at that field
     */
    this.getField = function(id, field) {
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            var artifactDiv = this.artifactDivList[i];
            if (artifactDiv.id == id) {
                return artifactDiv[field];
            }
        }
        return undefined;
    }
    /**
     * Wrapper for direct index
     * @return undefined if no element found
     */
    this.getByIndex = function(index) {
        return this.artifactDivList[index];
    }
    this.getByRowPos = function(row, posInRow) {
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            var artifactDiv = this.artifactDivList[i];
            if (artifactDiv.row == row &&
                artifactDiv.posInRow == posInRow) {
                return artifactDiv;
            }
        }
        return undefined;
    }
    this.getByLastSeen = function(row, posInRow) {
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            var artifactDiv = this.artifactDivList[i];
            if (artifactDiv.lastSeenRow == row &&
                artifactDiv.lastSeenPosInRow == posInRow) {
                return artifactDiv;
            }
        }
        return undefined;
    }
    this.getRowLength = function(row) {
        var adiv_length = this.artifactDivList.length;
        var rowLength = 0;
        for (var i = 0; i < adiv_length; i++) {
            var artifactDiv = this.artifactDivList[i];
            if (artifactDiv.row == row) {
                rowLength ++;
            }
        }
        return rowLength;
    }

    /**
     */
    this.numStaging = function() {
        var numStaging = 0
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            if (this.artifactDivList[i]["divArea"] == "staging") {
                numStaging ++;
            };
        }
        return numStaging;
    }
    this.numUnprocessed = function() {
        var unprocessed = 0
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            if (this.artifactDivList[i]["doneProcessing"] == false) {
                unprocessed ++;
            };
        }
        return unprocessed;
    }

    /**
     * Adds an add request to the event queue.
     * @param {ArtifactDiv} - ArtifactDiv to add
     */
    this.add = function(ArtifactDiv) {
        this.addToEventQueue(this._add, {"ArtifactDiv":ArtifactDiv});
    }
    this.addToTop = function(ArtifactDiv) {
        this.addToEventQueue(this._addToTop, {"ArtifactDiv":ArtifactDiv});
    }

    /**
     * Called by the event queue only, this adds a new ArtifactDiv
     * to both the artifactDivList and the addDivList
     * @param {ArtifactDiv} - ArtifactDiv to add
     * @return false if something went wrong, true otherwise
     */
    this._add = function(args) {
        if (this.get(args.ArtifactDiv.id) === undefined) {
            this.artifactDivList.push(args.ArtifactDiv);
            this.addDivList.push(args.ArtifactDiv);
        } else {
            console.warn("Trying to add the ArtifactDiv "+args.ArtifactDiv.id+" which already exists");
        }
    }

    /**
     * Called by the event queue only, this prepends a new ArtifactDiv
     * to both the artifactDivList and the addDivList
     * @param {ArtifactDiv} - ArtifactDiv to add
     * @return false if something went wrong, true otherwise
     */
    this._addToTop = function(args) {
        if (this.get(args.ArtifactDiv.id) === undefined) {
            this.artifactDivList.unshift(args.ArtifactDiv);
            this.addDivList.push(args.ArtifactDiv);
        } else {
            console.warn("Trying to add the ArtifactDiv "+args.ArtifactDiv.id+" which already exists");
        }
    }

    /**
     * Adds an edit request to the event queue. Fetches by id
     * @param {string} id - The id of an ArtifactDiv
     * @param {string} field - The field of the ArtifactDiv to edit
     * @param {mixed} value - The value to put in the field
     */
    this.edit = function(id, field, value) {
        this.addToEventQueue(this._edit,
            {
            "id":id,
            "field":field,
            "value":value
            });
    }
    /**
     * Like _edit except it jumps the line in the queue. Used to update
     * values that are needed immediately. Must be carefully used since
     * this breaks our nice queue!
     */
    this.priorityEdit = function(id, field, value) {
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            if (this.artifactDivList[i].id == id) {
                this.editDivList.push({"index":i,"id":id,"field":field,"value":value});
                this.artifactDivList[i][field] = value;
            }
        }
    }
    /**
     * Adds an edit request to the event queue. Fetches by array index for a faster, but more internal function
     * @param {string} index - The index of an ArtifactDiv
     * @param {string} field - The field of the ArtifactDiv to edit
     * @param {mixed} value - The value to put in the field
     */
    this.editByIndex = function(index, field, value) {
        this.addToEventQueue(this._editByIndex,
            {
            "index":index,
            "field":field,
            "value":value
            });
    }

    /**
     * Called by the event queue only, this edits an existing ArtifactDiv
     * in the artifactDivList and adds an edit request to the editDivList.
     * The method will not add new fields if it can not find one. It will
     * merely return unsuccessfully. It will also not add new artifacts if
     * it does not find one.
     * @param {string} id - The id of an ArtifactDiv
     * @param {string} field - The field of the ArtifactDiv to edit
     * @param {mixed} value - The value to put in the field
     */
    this._edit = function(args) {
        var id = args.id;
        var field = args.field;
        var value = args.value
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            if (this.artifactDivList[i].id == id) {
                this.editDivList.push({"index":i,"id":id,"field":field,"value":value});
                this.artifactDivList[i][field] = value;
            }
        }
    }

    /**
     * Called by the event queue only, this edits an existing ArtifactDiv
     * in the artifactDivList and adds an edit request to the editDivList.
     * The method will not add new fields if it can not find one. It will
     * merely return unsuccessfully. It will also not add new artifacts if
     * it does not find one.
     * @param {string} index - The index of an ArtifactDiv
     * @param {string} field - The field of the ArtifactDiv to edit
     * @param {mixed} value - The value to put in the field
     */
    this._editByIndex = function(args) {
        var index = args.index;
        var field = args.field;
        var value = args.value
        this.artifactDivList[index][field] = value;
        var id = this.artifactDivList[index]["id"];
        this.editDivList.push({"index":index,"id":id,"field":field,"value":value});
    }

    /**
     * This gets called when we recalculate the crop so we only have the latest
     * sets of edits before rendering.
     */
    this.resetEditList = function() {
        this.editDivList = [];
    } 

    /**
     * Adds a remove request to the event queue.
     * @param {string} id - The id of an ArtifactDiv
     */
    this.remove = function(id) {
        this.addToEventQueue(this._remove, {"id":id});
    }
    /**
     * Called by the event queue only, this removes an existing ArtifactDiv
     * from the artifactDivList and adds a remove request to the removeDivList
     * If it cannot find an ArtifactDiv with the id, it returns unsuccessfully
     * @param {string} id - The id of an ArtifactDiv
     * @return false if something went wrong, true otherwise
     */
    this._remove = function(args) {
        var id = args.id
        var adiv_length = this.artifactDivList.length;
        for (var i = 0; i < adiv_length; i++) {
            if (this.artifactDivList[i].id == id) {
                this.deleteDivList.push(id);
                this.artifactDivList.splice(i,1);
                i -= 1; // We just spliced.
                adiv_length -= 1;
            }
        }
    }

    /**
     * Main method that activates a rendering of the page. This will first
     * check timing issues to control browser speed. It will then go through
     * the add, edit, and remove lists and only change elements that need
     * to be changed. As with other actionable methods, "render" adds this
     * action to the event queue. "_render" actually does the work
     */
    this.render = function() {
        this.addToEventQueue(this._render, {});
    }

    this._render = function(args) {

        //add
        while (this.addDivList.length > 0) {

            var addArtifact = this.addDivList.shift();

            if (addArtifact.divArea == "staging") {
                var newStagingArtifact = '' +
                '<div id="artifact_'+addArtifact.id+'" class="canvas_upload_div" style="float:left">' +
                '   <img class="photo" src="'+addArtifact.thumb_url+'" height="70"\/>'+
                '<\/div>'

                $("#uploadArea_staging_div #staging_content").append(newStagingArtifact);
                _resizeHoldingWrappers();
                continue;
            }

            // If we don't need to add it to the staging area, we should add it to the main canvas
            this._renderAddToMainCanvas(addArtifact);
        }

        //delete
        while (this.deleteDivList.length > 0) {
            var removeID = this.deleteDivList.shift();
            
            var removeDiv = $("#artifact_"+removeID);
            removeDiv.remove();
        }

        //edit
        while (this.editDivList.length > 0) {
            var edit = this.editDivList.shift();
            // Edit commands {index, id, field, value}
            if (edit.index >= this.artifactDivList.length) {
                console.warn("Trying to edit an index ("+edit.index+") that doesn't exit");
                continue;
            }
            var artifactObject = this.artifactDivList[edit.index];
            
            var editDiv = $("#artifact_"+edit.id);
            if (editDiv.length <= 0 ) {
                console.warn("The div you're trying to edit with id "+edit.id+" does not exist");
                continue;
            }

            //this.artifactDivList[edit.index][edit.field] = edit.value;
            if (edit.value === undefined) {
                // We should not take action on the actual display in this case
                continue;
            }

            switch(edit.field) {
                case "id":
                    console.warn("Should not be changing the id field");
                    break;
                case "noCrop":
                    console.warn("Should not be changing the noCrop field");
                    break;
                case "divArea":
                    if (editDiv.parent().attr("id") == "staging_content") {
                        // This means we're removing something from the staging div
                        $("#staging_content #artifact_"+artifactObject.id).remove();
                        _resizeHoldingWrappers();
                        // Now I need to add it to the proper place
                        this._renderAddToMainCanvas(artifactObject);
                        continue;
                    }

                    // First check to see if the div is already in the correct div area
                    var prevDivAreaId = editDiv.parents(".zoom_div").attr("id");
                    if (prevDivAreaId == edit.value) {
                        // Don't need to do anything :)
                        continue;
                    }

                    var divAreaDiv = $("#"+edit.value);
                    if (divAreaDiv.length <= 0 ) {
                        console.warn("Weird, for some reason the divArea "+edit.value+" does not exist on the page. This is a problem!");
                        continue;
                    }

                    // We need to move the row that this div is currently in
                    if (artifactObject.row === undefined) {
                        console.warn("Object with id of "+edit.id+" has an undefined row, please be sure you set the row and posInRow before trying to set the divArea");
                        continue;
                    }

                    var row_div = $("#row_"+artifactObject.row);
                    if (row_div.length <= 0 ) {
                        console.warn("Object with id of "+edit.id+" does not have an existing row of "+artifactObject.row+" on the page. Please be sure you set row and posInRow before trying to set the divArea");
                        continue;
                    }

                    var closestRowDistance = 99999;
                    var closestSign = "";
                    var closestRow = null;

                    divAreaDiv.children(".artifact_row").each(function() {
                        var rownum = parsePrefixToNum($(this).attr("id"), "row_");
                        if (rownum == artifactObject.row) {
                            // looking at the row alread, keep going
                            return
                        }

                        var d = artifactObject.row - rownum;
                        if (Math.abs(d) < closestRowDistance) {
                            closestRowDistance = Math.abs(d);
                            d < 0 ? closestSign = "negative" : closestSign = "positive";
                            closestRow = rownum;
                        }
                    });

                    if (closestRow === null || closestSign == "") {
                        // Nothing in the row we care about. I can just put it in
                        divAreaDiv.append(row_div);
                        continue
                    }

                    if (closestSign == "negative") {
                        $("#row_"+closestRow).before(row_div);
                    } else if (closestSign == "positive") {
                        $("#row_"+closestRow).after(row_div);
                    }

                    break;

                    /*
                    var prev_row = $("#row_"+artifactObject.row-1, divAreaDiv);
                    // Find a previous row in the given divarea
                    if (prev_row.length <= 0) {
                        // This means the place I'm moving too has no previous row, maybe I'm supposed to be the first row in the area. I should check for that next
                        var next_row = $("#row_"+artifactObject.row+1, divAreaDiv);
                        if (next_row.length <= 0) {
                            //Hmm, there wasn't a row after too. That probably means that this is the first time the row is being placed within this div area. I should just move it wherever then
                            divAreaDiv.append(row_div);
                            continue;
                        } else {
                            next_row.before(row_div);
                            continue;
                        }
                    } else {
                        prev_row.after(row_div);
                        continue;
                    }
                    */
                    
                case "display":
                    break;
                case "croppedWidth":
                    if (editDiv.croppedWidth == edit.value) {
                        continue;
                    }
                    editDiv.width(edit.value);

                    // Be sure the images are centered properly
                    var photoContainer = editDiv.children(".photo_container");
                    if (photoContainer.length > 0) {
                        var centering = (artifactObject.width - edit.value) / -2;
                        photoContainer.css('left', centering+"px");
                    }
                    break;
                case "row":
                    // First see if the element in question is already in the correct row. If it is, we don't really need to do anything
                    if (edit.value == artifactObject.lastSeenRow) {
                        // Don't need to do anything :)
                        continue;
                    }

                    // posInRow takes care of everything regarding actually moving the div, all this needs to do is update the model and make sure that we have a posInRow change queued up next
                    this.eventQueue.shift([this._edit, {
                        "id":artifactObject.id,
                        "field":"posInRow",
                        "value":artifactObject.posInRow
                    }]);

                    break;
                case "posInRow":

                    if (artifactObject.row == artifactObject.lastSeenRow &&
                        edit.value == artifactObject.lastSeenPosInRow) {
                        // Don't need to do anything :)
                        continue;
                    }
                    var rowDiv = $("#row_"+artifactObject.row);
                    if (rowDiv.length <= 0) {
                        // This means that the row does not exist yet. This can happen if we are moving the div to a whole new row.

                        addAndPlaceNewRow(artifactObject.row, artifactObject.divArea);

                        // Now add to the row we just made
                        // Be sure to re-search for the row since it was just made
                        $("#row_"+artifactObject.row).append(editDiv);
                        this.priorityEdit(artifactObject.id, "lastSeenPosInRow", 0);
                        this.priorityEdit(artifactObject.id, "lastSeenRow", artifactObject.row);
                        continue;
                    }

                    var closestPosDistance = 99999;
                    var closestSign = "";
                    var closestDiv;
                    rowDiv.children(".artifact").each(function() {
                        var a_div = window.artifactDivList.get(parsePrefixToString($(this).attr("id"), "artifact_"));
                        if (a_div.row == artifactObject.row) {
                            if (edit.value == a_div.posInRow) {
                                // Looks like I'm looking at myself for this pass
                                // through the loop. Keep going..
                                return
                            }

                            var d = edit.value - a_div.posInRow;
                            if (Math.abs(d) < closestPosDistance) {
                                closestPosDistance = Math.abs(d);
                                d < 0 ? closestSign = "negative" : closestSign = "positive";
                                closestDiv = $(this);
                            }
                        }
                    });

                    if (!closestDiv || closestSign == "") {
                        // Nothing in the row we care about. I can just put it in
                        rowDiv.append(editDiv);
                        this.priorityEdit(artifactObject.id, "lastSeenPosInRow", artifactObject.posInRow);
                        this.priorityEdit(artifactObject.id, "lastSeenRow", artifactObject.row);
                        continue
                    }

                    if (closestSign == "negative") {
                        closestDiv.before(editDiv);
                    } else if (closestSign == "positive") {
                        closestDiv.after(editDiv);
                    }

                    this.priorityEdit(artifactObject.id, "lastSeenPosInRow", artifactObject.posInRow);
                    this.priorityEdit(artifactObject.id, "lastSeenRow", artifactObject.row);
                    continue
                    break
                case "lastSeenRow":
                    // Nothing to render
                    break;
                case "lastSeenPosInRow":
                    // Nothing to render
                    break;
                case "height":
                    // Since we're fixed-height for now, this makes no visual change
                    break;
                case "width":
                    // We never control the actual width of the div, that's set by the image that's loaded in at the given time
                    break;
                case "image_url":
                    // We don't yet have the image url full-res view yet
                    break;
                case "thumb_url":
                    var img = editDiv.children("img");
                    if (img.attr("src") != edit.value) {
                        img.attr("src", edit.value);
                    }

                    break;
                case "visible":
                    if (edit.value) {
                        editDiv.hide();
                    } else {
                        editDiv.show();
                    }
                    break;
                case "doneProcessing":
                    break;
                default:
                    console.warn("Invalid field");
                    break;
            }
        }


        window.pendingRender = false;
    }

    /**
     * Adds the corresponding artifact object to the main canvas
     * This is broken out in its own funciton so it can be called from the edit
     * list when we move an artifact from the staging area to the main canvas
     */

    this._renderAddToMainCanvas = function(addArtifact) {
        if (addArtifact.croppedWidth === undefined ||
            addArtifact.posInRow === undefined ||
            addArtifact.row === undefined) {
            console.warn("Trying to add artifact "+addArtifact.id+" to the canvas before you have calculated where it's supposed to go!");
        }

        if ($("#artifact_" + addArtifact.id).length != 0) {
            // This means there's already one on the page. We shouldn't be
            // adding a copy! Something went wrong.
            console.warn("Trying to add artifact "+addArtifact.id+" to the canvas when it's already there");
            return;
        }

        if (addArtifact.visible == '0') {
            var artifact_hidden = "artifact_hidden";
            var hide_text = "show";
        } else {
            var artifact_hidden = "";
            var hide_text = "hide";
        }

        var newArtifact = ''+
        '       <div id="artifact_'+addArtifact.id+'" class="artifact photo '+artifact_hidden+'">'+
        '           <div class="hide_photo"><a href="#">'+hide_text+'</a></div>'+
        '           <div class="photo_container" style="width:'+addArtifact.width+'px; height:'+addArtifact.height+'px;">' + 
        '               <img class="photo" src="'+addArtifact.thumb_url+'" height="175"\/>'+
        '           </div>' + 
        '       <\/div>';

        // See if it's the first one in the first row. This is the uploader
        // area problem.
        if (addArtifact.row == 0 && addArtifact.posInRow == 0) {
            $("#new_artifacts").after(newArtifact);
            return;
        }
        
        var closestPosDistance = 99999;
        var closestSign = "";
        var closestDiv;

        var rowDiv = $("#row_"+addArtifact.row);
        if (rowDiv.length > 0) {
            rowDiv.children(".artifact").each(function() {
                var a_div = window.artifactDivList.get(parsePrefixToString($(this).attr("id"), "artifact_"));
                if (a_div.row == addArtifact.row) {
                    if (addArtifact.posInRow == a_div.posInRow) {
                        // Looks like I'm looking at myself for this pass
                        // through the loop. Keep going..
                        return
                    }

                    var d = addArtifact.posInRow - a_div.posInRow;
                    if (Math.abs(d) < closestPosDistance) {
                        closestPosDistance = Math.abs(d);
                        d < 0 ? closestSign = "negative" : closestSign = "positive";
                        closestDiv = $(this);
                    }
                }
            });

            if (!closestDiv || closestSign == "") {
                // Nothing in the row we care about. I can just put it in
                rowDiv.append(newArtifact);
                this.priorityEdit(addArtifact.id, "lastSeenPosInRow", addArtifact.posInRow);
                this.priorityEdit(addArtifact.id, "lastSeenRow", addArtifact.row);
                return;
            }

            if (closestSign == "negative") {
                closestDiv.before(newArtifact);
            } else if (closestSign == "positive") {
                closestDiv.after(newArtifact);
            }
            this.priorityEdit(addArtifact.id, "lastSeenPosInRow", addArtifact.posInRow);
            this.priorityEdit(addArtifact.id, "lastSeenRow", addArtifact.row);
        } else {
            // we need to make the row

            addAndPlaceNewRow(addArtifact.row, addArtifact.divArea);
    
            // Now add to the row we just made
            $("#row_"+addArtifact.row).append(newArtifact);
            this.priorityEdit(addArtifact.id, "lastSeenPosInRow", 0);
            this.priorityEdit(addArtifact.id, "lastSeenRow", addArtifact.row);
        }
    }
}
/**
 * This will create a new row and figure out where to place it relative to
 * rows that should be adjacent to it. This is called when new artifacts are
 * created and when artifacts are told to get moved to rows that do not exist yet.
 * A similar version can be found in the divArea moving function. That one is
 * different because rows must be made within the divArea provided while this
 * method does not impose such a requirement
 * @param {Number} baseRow - The row which we are trying to place
 * @param {String} divArea - The area to put the row if we can't find any other
 * rows the key off of. This is usually the row stored with the artifactObject
 */
function addAndPlaceNewRow(baseRow, divArea) {
    var row_div = "<div class='artifact_row' id='row_"+baseRow+"'></div>"
    var prev_row = $("#row_"+baseRow-1);
    // Find a previous row in the given divarea
    if (prev_row.length <= 0) {
        // This means the place I'm moving too has no previous row, maybe I'm supposed to be the first row in the area. I should check for that next
        var next_row = $("#row_"+baseRow+1);
        if (next_row.length <= 0) {
            //Hmm, there wasn't a row after too. That probably means that this is the first time the row is being placed within this div area. I should just move it wherever then
            $("#"+divArea).append(row_div);
            return;
        } else {
            next_row.before(row_div);
            return;
        }
    } else {
        prev_row.after(row_div);
        return;
    }
}

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
}

/**
 * Performs the same tasks as updateArtifactDivs except instead of populating a
 * new data structure, it loads in the global one and applies any changes that
 * may have been made to it. This is primarily used with other methods (such as the zoom)
 * modify the global data structure and wish to see changes invoked on the page
 */
function updateModifiedArtifactDivs() {
    // Create a local copy to perform updates on then update the global
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
 * @param {json} message - The json return from the socket io module
 * action : "ping"|"update"
 * type : "photo"
 * _id : "<id>"
 * thumb : "<thumb_url>"
 * full : "<full_url>"
 */
function _updateArtifact(message) {
    var artifactDiv = window.artifactDivList.get(message._id);
    if (artifactDiv === undefined) {
        var livemade = true;
        var artifactDiv = new ArtifactDiv();
        artifactDiv['id'] = message._id;
        artifactDiv['noCrop'] = false; // Assuming it's always a cropable artifact
        artifactDiv['divArea'] = "above_zoom_div";
        artifactDiv['display'] = true; // We want it to be displayed!
        artifactDiv['croppedWidth'] = undefined;
        artifactDiv['row'] = undefined;
        artifactDiv['posInRow'] = undefined;
        artifactDiv["height"] = message.height; // 
        artifactDiv["width"] = message.width;
        artifactDiv["image_url"] = message.full;
        artifactDiv["thumb_url"] = message.thumb;
        artifactDiv["visible"] = 1;
        artifactDiv["doneProcessing"] = true;

        window.artifactDivList.addToTop(artifactDiv); // Puts in on the queue
    } else {
        var livemade = false;
        window.artifactDivList.edit(message._id, "thumb_url", message.thumb);
        window.artifactDivList.edit(message._id, "doneProcessing", true);

        if (artifactDiv.divArea == "staging") {
            window.artifactDivList.edit(message._id, "divArea", "above_zoom_div");

            // See if we have to close the uploader div
            if ($("#uploadArea_holding_div").children(".canvas_upload_div").length) {
                // First see if there are any still uploading

                // pass
            } else {
                // If there are no more uploading, we need to check the staging area
                var numStaging = window.artifactDivList.numStaging();
                var numUnprocessed = window.artifactDivList.numUnprocessed();
                if (numStaging == 0 &&
                    numUnprocessed == 0 && 
                    window.uploadError == false &&
                    $("#new_artifacts:visible").length > 0) {
                    $("#new_artifacts").hide('fast', function() {
                        _calculateCrop();
                        window.artifactDivList.render();
                    });
                    // Return because we'll already render once the new_artifacts
                    // area closes
                    return;
                }
            }
        }
    } 

    _calculateCrop();

    if (window.uploading == true && window.enableLive == true) {
        // If we're uploading, show them as soon as they come in
        window.artifactDivList.render();
    } else {
        // If we're getting from live, only render every half second
        if (!window.updateTimeout) {
            window.artifactDivList.render();
            window.updateTimeout = true;
            setTimeout("window.updateTimeout = false", 500);
        }
    }

}
/********************************
**FUNCTIONS FOR CROPPING PHOTOS**
*********************************/

function _calculateCrop() {
    if (window.pendingRender == true) {
        // Only take the latest calculate crop until we re-render
        window.artifactDivList.resetEditList();
    }

    var max_width = WRAPPER_WIDTH;
    var row_accumulator = [];
    var width_accumulator = 0;

    var rownum = 0;

    var artifactDivs_length = window.artifactDivList.length();
    window.firstRowUploadWidth = firstRowSpace();
    for (var i = 0; i < artifactDivs_length; i ++) {
        var artifactDiv = window.artifactDivList.getByIndex(i);
        if (rownum == 0) {
            max_width = WRAPPER_WIDTH - firstRowSpace();
        } else {
            max_width = WRAPPER_WIDTH;
        }
        if (max_width < 0) {max_width = 0;}
        if (artifactDiv.divArea == "staging") {
            // I don't want to include divs that are still in the staging area
            continue;
        }
        if (artifactDiv.display) {
            if (width_accumulator < max_width && max_width > 40) {
		        width_accumulator += artifactDiv.width + MARGIN_WIDTH;
                if (artifactDiv.noCrop) {
		             width_accumulator += BORDER_WIDTH;
		        }
                row_accumulator.push(i);
                window.artifactDivList.editByIndex(i,"row",rownum);
            } else {
                _processRow(row_accumulator, width_accumulator);
                width_accumulator = 0 + artifactDiv.width + MARGIN_WIDTH;
	    
                if (artifactDiv.noCrop) {
                    width_accumulator += BORDER_WIDTH;
                }

                row_accumulator = [];
                rownum ++;
                row_accumulator.push(i);
                window.artifactDivList.editByIndex(i,"row",rownum);
            }
        }
    }

    window.numRows = rownum;

    _processRow(row_accumulator, width_accumulator);

    window.pendingRender = true;
}

/**
 * Determines crop amount for a given row and updates the div object
 * does a greedy cropping
 * does not crop pictures past a certain threshold
 * bigger pictures are cropped more than smaller pics
 */
function _processRow(row_accumulator, width_accumulator) {
    
    var max_width = WRAPPER_WIDTH;
    var overspill;
    var crop;
    var threshold = THRESHOLD;
    var firstRowAdjusted = false;

    /*
     * We first need to remove all objects that we don't want to crop
     * This pops it off of the row and adjusts the total width thresholds we use
     */
    var rowacc_length = row_accumulator.length
    for (var j = 0; j < row_accumulator.length; j++) {
        // we need to recalculate row_accumulator.length each time since we
        // modify the data structure in place with this loop
        var artifactDiv = window.artifactDivList.getByIndex(row_accumulator[j]);
        if (artifactDiv.row == 0 && firstRowAdjusted === false) {
            // Be sure we clean out other things that may be on row 0
            max_width = max_width - firstRowSpace();
            firstRowAdjusted = true;
        }
        if (artifactDiv.noCrop) {
            rowacc_length -= 1;
            max_width = max_width - artifactDiv.width - MARGIN_WIDTH - BORDER_WIDTH;
            width_accumulator = width_accumulator - artifactDiv.width - MARGIN_WIDTH - BORDER_WIDTH;
            window.artifactDivList.editByIndex(row_accumulator[j], "croppedWidth", artifactDiv.width);
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
        var artifactDiv = window.artifactDivList.getByIndex(index);
	    var size = artifactDiv.width;
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
            var artifact_index = toCropList[z];
            var artifactDiv = window.artifactDivList.getByIndex(artifact_index);
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
                newSize = artifactDiv.width;
            }
            window.artifactDivList.editByIndex(artifact_index, "croppedWidth", newSize);
            window.artifactDivList.editByIndex(artifact_index, "posInRow", posDict[artifact_index]);
            row_width_accumulator += newSize + MARGIN_WIDTH;
	    }
	}
    } else {
        // This means the row doesn't fill up the width. We simply need
        // to give each element it's appropriate row * pos
        for (var m = 0; m < rowacc_length; m++) {
            var index = row_accumulator[m];
            var artifactDiv = window.artifactDivList.getByIndex(index);
            window.artifactDivList.editByIndex(index, "croppedWidth", artifactDiv.width);
            window.artifactDivList.editByIndex(index, "posInRow", m);
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

function firstRowSpace() {
    var firstRowUploadWidth = 0
    if ($("#add_artifact:visible").length) {
        firstRowUploadWidth += 175;
        firstRowUploadWidth += 10; // Margin space
    }

    if ($("#new_artifacts:visible").length) {
        firstRowUploadWidth += $("#new_artifacts").width();
        firstRowUploadWidth += 10; // margin space
        firstRowUploadWidth += 4; // border space
    }

    return firstRowUploadWidth;
}


/*****************************************
 * ARTIFACT PROGRESSIVE LOADING
 *****************************************/

function _loadArtifacts(offset, numArtifacts) {
    // FIXME We're very, naievely loading artifacts. Please fix
    //console.log("Loading " + numArtifacts + " artifacts starting at " + offset);
    window.loadingMoreArtifacts = true;
    var memory_id = $("#memory_id").html();
    if ($("#hidden_prompt").hasClass("showing_hidden")) {
        var show_hidden = 1;
    } else { var show_hidden = 0;}

    $.get("/memory", {"_id":memory_id, "offset":offset, "numartifacts":numArtifacts, "show_hidden":show_hidden}, function(data) {
        data = jsonParse(data);
        var newPhotosLength = data.length;
        if (newPhotosLength) {
            window.numPhotosLoaded += numArtifacts;
            window.loadOffset += (offset + numArtifacts);
        }
        for (var j = 0; j < newPhotosLength; j ++) {
            var newPhoto = data[j];
            var artifactDiv = new ArtifactDiv();
            artifactDiv['id'] = newPhoto.id;
            artifactDiv['noCrop'] = false; // Assuming it's always a cropable artifact
            artifactDiv['divArea'] = "above_zoom_div";
            artifactDiv['display'] = true; // We want it to be displayed!
            artifactDiv['croppedWidth'] = undefined;
            artifactDiv['row'] = undefined;
            artifactDiv['posInRow'] = undefined;
            artifactDiv["height"] = newPhoto.height; // 
            artifactDiv["width"] = newPhoto.width;
            artifactDiv["image_url"] = newPhoto.image_url;
            artifactDiv["thumb_url"] = newPhoto.thumb_url;
            artifactDiv["visible"] = newPhoto.visible;
            artifactDiv["doneProcessing"] = true;

            window.artifactDivList.add(artifactDiv); // Puts in on the queue
        }
        _calculateCrop();
        window.artifactDivList.render();
        window.loadingMoreArtifacts = false;
        DOCUMENT_HEIGHT = $(document).height();
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

    var a_divlength = window.artifactDivList.length();
    for (var i = 0; i < a_divlength; i++) {
        var artifact = window.artifactDivList.getByIndex(i);
        var artifactDiv = $("#artifact_"+artifact.id);

        if (artifact.thumb_url == undefined) {
            // This means that the server data hasn't populated yet.
            // That needs to happen before this function runs.
            return;
        }

        var artifact_top = artifactDiv.offset().top;
        if (artifact_top >= load_top && artifact_top <= load_bottom) {
            window.artifactDivList.edit(adiv.id, "divArea", "in_zoom_div");
            if (artifactDiv.find("img").attr("src") == artifact.thumb_url) {
                // If the img doesn't exist, it will return 'undefined'
                continue;
            }
            var div_width = artifactDiv.width();
            var photo_width = artifactDiv.children(".photo_container").width();
            var centering = (photo_width - div_width) / -2;

            var imgdiv = "<img src="+artifact.thumb_url+" height='"+ARTIFACT_HEIGHT+"' width='"+artifact.width+"' class='photo'/>"
            artifactDiv.children(".photo_container").css('left', centering);
            artifactDiv.children(".photo_container").html(imgdiv);
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
    var a_div = window.artifactDivList.get(parsePrefixToString(artifact.attr("id"), "artifact_"));
    var left_ofDiv = window.artifactDivList.getByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = window.artifactDivList.getByRowPos(a_div.row, a_div.posInRow + 1);
    var slack = a_div.width - a_div.croppedWidth;
    if (left_ofDiv !== undefined && right_ofDiv !== undefined) {
        // This means there are items to both the left AND right
        return -slack / 2
    } else if (left_ofDiv === undefined && right_ofDiv !== undefined) {
        // This means our artifact is on the far left margin
        // The top-left corner should not move
        return 0;
    } else if (left_ofDiv !== undefined && right_ofDiv === undefined) {
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
function _artifactExpand(artifact, instant) {
    instant = instant || false;
    var a_div = window.artifactDivList.get(parsePrefixToString(artifact.attr("id"), "artifact_"));
    var left_ofDiv = window.artifactDivList.getByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = window.artifactDivList.getByRowPos(a_div.row, a_div.posInRow + 1);
    var slack = a_div.width - a_div.croppedWidth;

    $("#artifact_"+a_div.id).stop(true,false);
    if (left_ofDiv !== undefined){
        $("#artifact_"+left_ofDiv.id).stop(true,false);
    }
    if (right_ofDiv !== undefined){
        $("#artifact_"+right_ofDiv.id).stop(true,false);
    }

    if (instant) {
        $("#artifact_"+a_div.id).width(a_div.width);
    } else {
        $("#artifact_"+a_div.id).animate({width:a_div.width}, 'fast');
    }
    
    if (instant) {
        $("#artifact_"+a_div.id).children(".photo_container").css("left","0px");
    } else {
        $("#artifact_"+a_div.id).children(".photo_container").animate({left:0}, 'fast');
    }

    if (left_ofDiv !== undefined && right_ofDiv !== undefined) {
        // This means there are items to both the left AND right
        var leftWidth = left_ofDiv.croppedWidth - slack / 2;
        var rightWidth = right_ofDiv.croppedWidth - slack / 2;
        if (instant) {
            $("#artifact_"+left_ofDiv.id).width(leftWidth);
            $("#artifact_"+right_ofDiv.id).width(rightWidth);
        } else {
            $("#artifact_"+left_ofDiv.id).animate({width:leftWidth},'fast');
            $("#artifact_"+right_ofDiv.id).animate({width:rightWidth},'fast');
        }
    } else if (left_ofDiv === undefined && right_ofDiv !== undefined) {
        // This means our artifact is on the far left margin
        var rightWidth = right_ofDiv.croppedWidth - slack;
        if (instant) {
            $("#artifact_"+right_ofDiv.id).width(rightWidth);
        } else {
            $("#artifact_"+right_ofDiv.id).animate({width:rightWidth},'fast');
        }
    } else if (left_ofDiv !== undefined && right_ofDiv === undefined) {
        // This means our artifact is on the far right margin
        var leftWidth = left_ofDiv.croppedWidth - slack;
        if (instant) {
            $("#artifact_"+left_ofDiv.id).width(leftWidth);
        } else {
            $("#artifact_"+left_ofDiv.id).animate({width:leftWidth},'fast');
        }
    } else {
        // This means our div is all by itself on the row
    }
}
/**
 * unexpands the div and fixes its neighbors. If instant is true, it does
 * not animate. This is used by the doZoom function notably
 */
function _artifactUnExpand(artifact, instant) {
    instant = instant || false;

    var a_div = window.artifactDivList.get(parsePrefixToString(artifact.attr("id"), "artifact_"));
    var left_ofDiv = window.artifactDivList.getByRowPos(a_div.row, a_div.posInRow - 1);
    var right_ofDiv = window.artifactDivList.getByRowPos(a_div.row, a_div.posInRow + 1);

    $("#artifact_"+a_div.id).children(".photo_container").stop(true,false);
    var centering = (a_div.width - a_div.croppedWidth) / -2;
    if (instant) {
        $("#artifact_"+a_div.id).children(".photo_container").css("left", centering+"px");
    } else {
        $("#artifact_"+a_div.id).children(".photo_container").animate({left:centering}, 'fast');
    }

    $("#artifact_"+a_div.id).stop(true,false);
    if (instant) {
        $("#artifact_"+a_div.id).width( a_div.croppedWidth );
    } else {
        $("#artifact_"+a_div.id).animate({width:a_div.croppedWidth}, 'fast');
    }

    if (left_ofDiv !== undefined) {
        $("#artifact_"+left_ofDiv.id).stop(true,false);
        if (instant) {
            $("#artifact_"+left_ofDiv.id).width( left_ofDiv.croppedWidth );
        } else {
            $("#artifact_"+left_ofDiv.id).animate({width:left_ofDiv.croppedWidth}, 'fast');
        }
    }
    if (right_ofDiv !== undefined) {
        $("#artifact_"+right_ofDiv.id).stop(true,false);
        if (instant) {
            $("#artifact_"+right_ofDiv.id).width( right_ofDiv.croppedWidth );
        } else {
            $("#artifact_"+right_ofDiv.id).animate({width:right_ofDiv.croppedWidth}, 'fast');
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
function _calculateScaleFactor(a_width, a_height) {
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
 * When the canvas is resized, make sure our all of our elements fit properly
 */
function _resizeCanvas() {
    /**
     * Resolutions to keep in mind:
     * iPhone 3G: 320 x 480
     * iPhone 4: 640 x 960
     * iPad: 768 x 1024
     */

    _calculateScaleFactor();

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
            $("#add_artifact")
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

    _calculateCrop();
    window.artifactDivList.render();
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
function _doZoom(artifact) {
    window.enableLive = false;
    artifact.children(".hide_photo").hide();

    var artifactDiv = window.artifactDivList.get(parsePrefixToString(artifact.attr("id"), "artifact_"));

    if (window.previousZoomTarget) {
        if (window.previousZoomTarget.attr("id") == artifact.attr("id") &&
            window.zoomedIn == true) {
            // This means we've clicked on the same thing
            _doUnZoom();
            return
        } else {
            _artifactUnExpand(window.previousZoomTarget, true);
            var prevRow = parsePrefixToNum(window.previousZoomTarget.parent(".artifact_row").attr("id"),"row_");
            if (prevRow > artifactDiv.row) {
                // Pan up
                window.lastScrollPos -= (ARTIFACT_HEIGHT + MARGIN_WIDTH);
            } else if (prevRow < artifactDiv.row) {
                // Pan down
                window.lastScrollPos += ARTIFACT_HEIGHT + MARGIN_WIDTH;
            } else if (prevRow == artifactDiv.row) {
                // Same row
            }
        }
    }

    if (window.zoomedIn == false) {
        window.lastScrollPos = $(window).scrollTop();
    }

    var row = artifactDiv.row;
    var rowAbove = row - 2;
    var rowBelow = row + 2;
    var rowAbove = Math.max(rowAbove, 0);
    var rowBelow = Math.min(rowBelow, window.numRows);

    var adiv_length = window.artifactDivList.length();
    for (var i = 0; i < adiv_length; i++) {
        var a_div = window.artifactDivList.getByIndex(i);
        if (a_div.row >= rowAbove && a_div.row <= rowBelow) {
            window.artifactDivList.editByIndex(i, "divArea", "in_zoom_div");
        } else if (a_div.row < rowAbove){
            window.artifactDivList.editByIndex(i, "divArea", "above_zoom_div");
        } else if (a_div.row > rowBelow) {
            window.artifactDivList.editByIndex(i, "divArea", "below_zoom_div");
        } else {
            continue;
        }
    }

    var inZoomDiv = $("#in_zoom_div");
    inZoomDiv.show();
    window.artifactDivList.render();
    $("#above_zoom_div").hide();
    $("#below_zoom_div").hide();


    if ($("#alert_bar:visible").length > 0) {
        $("#alert_bar").hide();
    }

    _calculateScaleFactor(artifactDiv.width, ARTIFACT_HEIGHT);

    _artifactExpand(artifact, true); // Instant mode
    if (window.zoomedIn == false) {
        var xExpansionShift = 0;
    } else {
        var xExpansionShift = calculateArtifactExpansion(artifact);
    }

    var artifactPos = artifact.position();
    if (window.zoomedIn == false) {
        artifactPos.left = artifactPos.left * window.scaleFactor;
    } else {
        if (BrowserDetect.browser == "Firefox") {
            // See zoom notes above as to why we have to do this
            artifactPos.left = (artifactPos.left + xExpansionShift) * window.scaleFactor;
        } else {
            artifactPos.left = artifactPos.left + (xExpansionShift * window.scaleFactor); // Shift because of image expansion
        }
    }

    /* Figure out where to center on the page */
    var rightMargin = $(window).width() - $("#artifact_wrapper").width() - $("#artifact_wrapper").offset().left;
    var leftMargin = $("#artifact_wrapper").offset().left;
    // Subtract 20 for the scrollbar
    var symmetryBias = ( rightMargin - leftMargin ) / 2;
    var centeringOffset = $("#artifact_wrapper").width() / 2 + symmetryBias - (artifactDiv.width / 2 * window.scaleFactor);
    var newPosX = artifactPos.left - centeringOffset;


    inZoomDiv.transform({
        origin: [0,0],
        scaleX: window.scaleFactor,
        scaleY: window.scaleFactor
    });
    inZoomDiv.css("left", -newPosX + "px");

    $("#canvas_footer").css("bottom", "-60px");

    $("#artifact_wrapper").height(inZoomDiv.height()*window.scaleFactor);

    var numRowsAbove = row - rowAbove;
    var topCentering = numRowsAbove * (ARTIFACT_HEIGHT + MARGIN_WIDTH) * window.scaleFactor;
    topCentering -= 1.5*MARGIN_WIDTH * window.scaleFactor;
    $(window).scrollTop(topCentering);
    window.previousZoomTarget = artifact;

    window.zoomedIn = true;
}

/**
 * Undoes the zoom. Updates the globals and resets the zoom parameters
 */
function _doUnZoom() {

    // Need to add some from #below_zoom_div to #in_zoom_div before we zoom out
    var a_divLength = window.artifactDivList.length();
    for (var i = 0; i < a_divLength; i++) {
        var adiv = window.artifactDivList.getByIndex(i);
        if (adiv.divArea == "in_zoom_div" || adiv.divArea == "below_zoom_div") {
            if (adiv.row === undefined) {return;}
            window.artifactDivList.edit(adiv.id, "divArea", "above_zoom_div");
        }
    }

    $("#above_zoom_div").show();
    $("#below_zoom_div").show();

    $("#in_zoom_div").transform({
        scaleX: 1,
        scaleY: 1
    });
    $("#in_zoom_div").css("left", 0);
    $("#in_zoom_div").hide();

    $("#canvas_footer").css("bottom", "0px");
    $("#artifact_wrapper").height('auto');

    window.artifactDivList.render();
    $(window).scrollTop(window.lastScrollPos);
    
    window.enableLive = true;
    window.zoomedIn = false;
}

/**
 * In the upload area, we need to resize the holding and staging
 * wrappers so the images tile properly and display correctly
 */
function _resizeHoldingWrappers() {
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
 * When we get an upload error we leave divs lying around.
 * This function cleans them up and is simply a copy and paste convenience
 */
function _clearUploadError(handler) {
    handler.removeNode(handler.uploadRow);
    $(handler.uploadRow).remove();
    window.uploadError = false;
    if (window.uploading == false) {
        $("#new_artifacts").hide('fast', function() {
            _calculateCrop();
            window.artifactDivList.render();
        });
    }
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
            files.uploadSequence[index] = null;
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
            if (index == 0) {
                window.uploading = true;
                files.uploadSequence = [];
                files.uploadSequence.start = function(index) {
                    var next = this[index];
                    if (next) {
                        next.apply(null, Array.prototype.slice.call(arguments, 1));
                        this[index] = null;
                    }
                }

                /* files.startCounter is set the after the first upload 
                 * If we get here that means we're looking at the first upload */
                $("#new_artifacts").show();
                $("#uploadArea_title_div #total").html(files.length);
                files.numError = 0;
                _calculateCrop();
                window.artifactDivList.render();
            } 

            _resizeHoldingWrappers();

            var regexp = /\.(bmp)|(png)|(jpg)|(jpeg)|(gif)$/i;
            // Using the filename extension for our test,
            // as legacy browsers don't report the mime type
            if (!regexp.test(files[index].name)) {
                $(handler.uploadRow).html("MUST BE IMAGE (BMP PNG JPG JPEG GIF)");
                $(handler.uploadRow).css("border-color","#e3372d")
                window.uploadError = true;
                files.numError += 1;
                $("#uploadArea_title_div #total").html(files.length - files.numError);
                setTimeout(function () {
                    _clearUploadError(handler);
                }, 5000);
                files.uploadSequence.push(callBack);
                if (index + 1 === files.length) {
                    files.uploadSequence.start(0);
                }
                return;
            }

            if (files[index].size === 0) {
                $(handler.uploadRow).html('FILE IS EMPTY!');
                $(handler.uploadRow).css("border-color","#e3372d")
                window.uploadError = true;
                files.numError += 1;
                $("#uploadArea_title_div #total").html(files.length - files.numError);
                setTimeout(function () {
                    _clearUploadError(handler);
                }, 5000);
                files.uploadSequence.push(callBack);
                if (index + 1 === files.length) {
                    files.uploadSequence.start(0);
                }
                return;
            }

            if (files[index].size > FILE_UPLOAD_LIMIT) {
                var maxSizeMB = FILE_UPLOAD_LIMIT / 1000000;
                $(handler.uploadRow).html('FILE TOO BIG! Max: '+maxSizeMB+"MB");
                $(handler.uploadRow).css("border-color","#e3372d")
                window.uploadError = true;
                files.numError += 1;
                $("#uploadArea_title_div #total").html(files.length - files.numError);
                setTimeout(function () {
                    _clearUploadError(handler);
                }, 5000);
                files.uploadSequence.push(callBack);
                if (index + 1 === files.length) {
                    files.uploadSequence.start(0);
                }
                return;
            }


            files.uploadSequence.push(callBack);
            if (index + 1 === files.length) {
                files.uploadSequence.start(0);
            }
        },
        onComplete: function (event, files, index, xhr, handler) {
            handler.onCompleteAll(files);
            files.uploadSequence.start(index + 1);
        },
        onCompleteAll: function (files) {

            if (!files.uploadCounter) {
                files.uploadCounter = 1;
            } else {
                files.uploadCounter += 1;
            }
            $("#uploadArea_title_div #current").html(files.uploadCounter);

            if (files.uploadCounter >= (files.length - files.numError)) {
                /* your code after all uploads have completed */
                /*
                 * Live updates can finish entirely before this point
                 * They can also (more likely) finish after this happens
                 */
                var numStaging = window.artifactDivList.numStaging();
                var numUnprocessed = window.artifactDivList.numUnprocessed();
                if (numStaging <= 0 &&
                    numUnprocessed <= 0 && 
                    window.uploadError == false &&
                    $("#new_artifacts:visible").length > 0) {
                    $("#new_artifacts").hide('fast', function() {
                        _calculateCrop();
                        window.artifactDivList.render();
                    });
                }
                window.uploading = false;

            }

        },
        buildUploadRow: function (files, index) {
            return $(
                '<div class="canvas_upload_div">'+files[index].name+'</div>'
            );
        },
        buildDownloadRow: function (file) {
            var artifactDiv = window.artifactDivList.get(file.id);
            if (artifactDiv === undefined) {
                var artifactDiv = new ArtifactDiv();
                artifactDiv['id'] = file.id;
                artifactDiv['noCrop'] = false; // Assuming it's always a cropable artifact
                artifactDiv['divArea'] = "staging";
                artifactDiv['display'] = true; // We want it to be displayed!
                artifactDiv['croppedWidth'] = undefined;
                artifactDiv['row'] = undefined;
                artifactDiv['posInRow'] = undefined;
                artifactDiv["height"] = ARTIFACT_HEIGHT; // 
                artifactDiv["width"] = file.width;
                artifactDiv["image_url"] = file.image_url;
                artifactDiv["thumb_url"] = file.thumb_url;
                artifactDiv["visible"] = file.visible;
                artifactDiv["doneProcessing"] = false;

                window.artifactDivList.addToTop(artifactDiv); // Puts in on the queue
                window.artifactDivList.render();
            } else {
                // Wow, the live update server added the file in before we got
                // here. That's one fast server! Check to see if the staging
                // area is empty and then close it if it is
                $("#staging_content #artifact_"+file._id).remove();
                _resizeHoldingWrappers();
                // Remove from the staging area
            }


            return $(
                // We need to return something silly otherwise, it won't continue
                '<div style="display:none"></div>'
            );
        }

    });
});





$(document).ready(function(){
    _loadArtifacts(0,LOAD_SIZE);


    iOS_running();

    var memoryID = $("#memory_id").html();
    setupSocket(memoryID);

    window.canvasTitle = $("#canvas_title .click").html();

    /* ************************************************* *
     * CANVAS - Controls the hide button on artifacts
     * **************************************************/
  if (is_iOS == false) {
    $("#artifact_wrapper").delegate(".hide_photo", "mouseenter", function(){
        if (window.zoomedIn == false) {
            $(this).parent(".artifact").addClass("opacity40");
            if ($(this).parent(".artifact").hasClass("artifact_hidden")) {
                // Don't do anything, keep it lit.
            } else {
                $(this).parent(".artifact").css("opacity", "0.5");
                $(this).parent(".artifact").css("-ms-filter", "alpha(opacity=.5)");
                $(this).parent(".artifact").css("filter", "alpha(opacity=.5)");
            }
        }
    });
    $("#artifact_wrapper").delegate(".hide_photo", "mouseleave", function(){
        if (window.zoomedIn == false) {
            $(this).parent(".artifact").removeClass("opacity40");
            if($(this).parent(".artifact").hasClass("artifact_hidden")) {
                // Do nothing
            } else {
                $(this).parent(".artifact").css("opacity", "1");
                $(this).parent(".artifact").css("-ms-filter", "alpha(opacity=1)");
                $(this).parent(".artifact").css("filter", "alpha(opacity=1)");
            }
        }
    });
  
    $("#artifact_wrapper").delegate(".hide_photo", "click", function(){
        if (window.zoomedIn == false) {
            var visible;
            window.lastScrollPos = $(window).scrollTop();

            // Note, IDs of artifacts are prefixed with 'artifact_'. We must strip this first
            id = parsePrefixToString($(this).parent().attr("id"),"_artifact");

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
                    window.artifactDivList.remove(id);
                    
                    _calculateCrop();
                    window.artifactDivList.render();
                }
            }

            $(window).scrollTop(window.lastScrollPos);
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
            _doUnZoom();
        }
    })

    $(".artifact").live("mouseenter", function() {
        if (window.zoomedIn == false && window.pendingRender == false) {
            $(this).children(".hide_photo").show();

            $(this).css("opacity", "1");
            $(this).css("-ms-filter", "alpha(opacity=1)");
            $(this).css("filter", "alpha(opacity=1)");

            _artifactExpand($(this));
        }
    }).live("mouseleave", function() {
        if (window.zoomedIn == false && window.pendingRender == false) {
            $(this).children(".hide_photo").hide();

            if($(this).hasClass("artifact_hidden")) {
                $(this).css("opacity", "0.5");
                $(this).css("-ms-filter", "alpha(opacity=.5)");
                $(this).css("filter", "alpha(opacity=.5)");
            }

            _artifactUnExpand($(this));
        }
    });

    $(".photo_container").live("click",function() {
        if ($(this).parents(".artifact").hasClass("no_crop")) {
            return;
        }
        _doZoom($(this).parent(".artifact"));
    });
  }

    /* ************************************************* *
     * Title renaming
     * **************************************************/
	$(".click").editable("/rename_memory", { 
        data : function(value, settings) {
            return window.canvasTitle;
        },
        indicator : " saving... ",
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
        if ($(window).scrollTop() + $(window).height() >= 
            DOCUMENT_HEIGHT - ARTIFACT_HEIGHT ) {

            // If we're near the bottom
            if (window.loadingMoreArtifacts == false) {
                _loadArtifacts(window.loadOffset, LOAD_SIZE);
            }

        } else {
            //loadViewportPhotos();
        }
    });

    /* ************************************************* *
     * Detect Arrow Keys
     * **************************************************/
    $(document).keydown(function(key) {

        if (key.keyCode == 37) {
            // LEFT
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = window.artifactDivList.get(parsePrefixToString(window.previousZoomTarget.attr("id"), "artifact_"));
                var leftArtifact = window.artifactDivList.getByRowPos(artifactDiv.row, artifactDiv.posInRow - 1);
                if (leftArtifact !== undefined) {
                    _doZoom($("#artifact_"+leftArtifact.id));
                } else {
                    // Look at the next row up on the other end
                    rowChange = window.artifactDivList.getByRowPos(artifactDiv.row - 1, window.artifactDivList.getRowLength(artifactDiv.row-1) - 1);
                    if (rowChange !== undefined) {
                        _doZoom($("#artifact_"+rowChange.id));
                    }
                }
            }
        } else if (key.keyCode == 38) {
            // UP
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = window.artifactDivList.get(parsePrefixToString(window.previousZoomTarget.attr("id"), "artifact_"));
                var aboveArtifact = window.artifactDivList.getByRowPos(artifactDiv.row -1, artifactDiv.posInRow);
                if (aboveArtifact !== undefined) {
                    _doZoom($("#artifact_"+aboveArtifact.id));
                } else {
                    // There's probably one, but we're too far out.
                    rowChange = window.artifactDivList.getByRowPos(artifactDiv.row - 1, window.artifactDivList.getRowLength(artifactDiv.row-1) - 1);
                    if (rowChange !== undefined) {
                        _doZoom($("#artifact_"+rowChange.id));
                    }
                }
            }
        } else if (key.keyCode == 39) {
            // RIGHT
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = window.artifactDivList.get(parsePrefixToString(window.previousZoomTarget.attr("id"), "artifact_"));
                var rightArtifact = window.artifactDivList.getByRowPos(artifactDiv.row, artifactDiv.posInRow + 1);
                if (rightArtifact !== undefined) {
                    _doZoom($("#artifact_"+rightArtifact.id));
                } else {
                    // Look at the next row down on the other end
                    rowChange = window.artifactDivList.getByRowPos(artifactDiv.row + 1, 0);
                    if (rowChange !== undefined) {
                        _doZoom($("#artifact_"+rowChange.id));
                    }
                }
            }
        } else if (key.keyCode == 40) {
            // DOWN
            if (window.zoomedIn == true) {
                key.preventDefault();
                var artifactDiv = window.artifactDivList.get(parsePrefixToString(window.previousZoomTarget.attr("id"), "artifact_"));
                var belowArtifact = window.artifactDivList.getByRowPos(artifactDiv.row + 1, artifactDiv.posInRow);
                if (belowArtifact !== undefined) {
                    _doZoom($("#artifact_"+belowArtifact.id));
                } else {
                    // There's probably one, but we're too far out.
                    rowChange = window.artifactDivList.getByRowPos(artifactDiv.row + 1, window.artifactDivList.getRowLength(artifactDiv.row+1) - 1);
                    if (rowChange !== undefined) {
                        _doZoom($("#artifact_"+rowChange.id));
                    }
                }
            }
        } else if (key.keyCode == 8) {
            // BACKSPACE
            if (window.zoomedIn == true) {
                key.preventDefault();
                _doUnZoom();
            }
        } else if (key.keyCode == 13) {
            // ENTER
            if (window.zoomedIn == true) {
                key.preventDefault();
                _doUnZoom();
            }
        } else if (key.keyCode == 27) {
            // ESCAPE
            if ($("#canvas_login_div:visible").length > 0) {
                $("#canvas_login_div").hide();
                $("#canvas_login_prompt").show();
            }
            if (window.zoomedIn == true) {
                key.preventDefault();
                _doUnZoom();
            }
        }
    });
    

    truncateTitle($(".canvas_center").width() - $("#canvas_header #login").width());
    _resizeCanvas();
    //loadViewportPhotos();
	// update ArtifactDivs() is run by _resizeCanvas

	$(window).resize(_resizeCanvas);

});

