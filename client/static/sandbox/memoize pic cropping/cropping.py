
###row is a list of sizes, ordered from newest to oldest
###newPics is a list of pics to add to that row
###maxSize is max row pixels
##def toCrop(newPics, row, maxSize):
def toCrop(pics, maxSize):
    ### returns true or false ---> whether to crop, and if so, by how much ###
##    newRow = newPics + row
##    newRowSize = sum([pic for pic in newRow])
    rowSize = sum([pic for pic in pics]) ###<--- new pics + old pics in row, size
    print "maxsize--->", maxSize
    print "rowsize--->", rowSize
    if rowSize > maxSize:
        cropAmt = rowSize - maxSize
        return (True, cropAmt)
    else:
        return (False,None)

def getSizeList(sizeDict):
    sortedSizeList = sizeDict.keys()
    sortedSizeList.sort()
    sortedSizeList.reverse()
    return sortedSizeList
    


def constraintValidBasic(newPics, row, maxSize, relaxed=False):
    constraint = 0.20 ###<--- max amt to reduce picture by ###
    newRow = newPics + row
    cropBool, cropTotal = toCrop(newRow, maxSize)
    if cropBool == False:
        return "No cropping needed!"
##    locSizeDict = {}
##    for i in range(len(newRow)):
##        locSizeDict[i] = newRow[i]

    ##sizeDict maps (original) picSize ---> location in row
    sizeDict = {}
    for i in range(len(newRow)):
        size = newRow[i]
        loc = i
        if size in sizeDict.keys():
            sizeDict[size].append(loc)
        else:
            sizeDict[size] = [loc]
    sizeList = getSizeList(sizeDict)

    ### now we want to greedily simulate cropping each entry in sizeList
    ###  from biggest to smallest

    ### maps new sizes to old sizes + keeps index of that pic
    newSizeDict = {}
    locNewSizeDict = {} ### <--- maps original location to new size

    cropAmt = cropTotal
    print "initial crop amount--->", cropAmt

    ### this loop isn't really optimized... ###
    for size in sizeList:
        for pic in sizeDict[size]:
            print "pic size--->",  size
            ### pic specifies picture's location ###
            if cropAmt <= constraint*size:
                newPicSize = size - cropAmt
                cropAmt = 0
                print "new crop amount--->", cropAmt

                locNewSizeDict[pic] = newPicSize

                if newPicSize in newSizeDict.keys():
                    ### newPicSize ---> (oldPicSize, picLocation) <== current
                    ### can also try: picLocation ---> (oldPicSize, newPicSize)
                    newSizeDict[newPicSize].append((size, pic))
                else:
                    newSizeDict[newPicSize] = [(size, pic)]
                return newSizeDict

            else:
                newPicSize = size - size*constraint
                cropAmt -= size*constraint
                print "new crop amount--->", cropAmt
                if newPicSize in newSizeDict.keys():
                    ### newPicSize ---> (oldPicSize, picLocation)
                    newSizeDict[newPicSize].append((size, pic))
                else:
                    newSizeDict[newPicSize] = [(size, pic)]

    if cropAmt > 0:
        ### cropAmt <--- amount left to crop
        ### need some way of determining which pics were violated ###

        ### call violatedPics function here ###
        
        return ("violated", cropAmt, newSizeDict)
    else:
        return newSizeDict

def violatedPics(currentRowState, cropped, cropTotal, maxWidth, origWidth,
                 locDict):
    ### currentRowState <--- newSizeDict
    ### cropTotal <--- total amount we needed to crop at beginning
    ### cropped <--- amount already cropped
    ### maxWidth <--- maximum allowed width for row
    ### origWidth <--- (effective) width of pics in row before any cropping
    ### locationDict <--- locNewSizeDict, maps location--->new size

    cropLeft = cropTotal - cropped ### <--- amount left to crop

    oldestPicSize = locationDict[max(locationDict.keys())]
    ### gives size of right-most pic

##    if cropLeft < cropped - oldPicSize:

### checkPerfectCrop always takes in **original** picture sizes
def checkPerfectCrop(rowToCheck, constraint, maxRowWidth, relaxed=False):
    rowWidth = sum([pic for pic in rowToCheck])
    amtToCrop = rowWidth - maxRowWidth
    if relaxed == True:
        ### somehow modify the constraint (make it looser)
        constraint *= relaxNumber
    if amtToCrop > 0 and constraint*rowWidth > amtToCrop:
        return (True,)
    else:
        if amtToCrop < 0:
            ### the row is too small, won't fill up entire row
            return 0
        elif constraint*rowWidth < amtToCrop:
            ### can't crop enough ---> will still be too big
            return 1
            
### this function sizes the current Row + returns pics to be moved from
##        current row to next row
def cropFunction(newPics, currentRow, maxWidth, constraint,relaxed=False):
    newRow = newPics + currentRow ###<--- append newly added pics to currentRow
    CropAmt = newRow - maxWidth ###<--- amount to ultimately crop from this row

    if relaxed == True:
        ### some modification to constraint ###
        ### means you don't need to mod constraint in other functions ###
        constraint = relax*constraint 

    isPerfect = checkPerfectCrop(newRow, constraint, maxWidth, relaxed)
    if isPerfect == True:
        ### greedily crop the pics in this row
        newSizes = constraintValidBasic(newPics, currentRow, maxSize,relaxed)
        return []###<--- no pics were moved from this row to the next
    else:
        ### move pic from row to next row

        ### check if current row has perfect crop after moving last pic in row


        ### skip this step if relaxed = True? if relaxed and reaches here,
##        it's already proven to be too big ---> skip to relax stage again
        isCurrPerfect = checkPerfectCrop(newRow[:-1], constraint, maxWidth)
        
        if isCurrPerfect == True:
            return newRow[-1] ##<--- moved pic acts as new pic for next row
        elif isCurrPerfect == 0:
            ### row is too small after move, need to relax before 
            movedPics = cropFunction(newPics, currentRow, maxWidth, constraint, relaxed=True)
            return movedPics###<--- return any pics moved from this row to next
        elif isCurrPerfect == 1:
            ### row is still too big, try moving another photo
            movedPics = cropFunction(newPics, currentRow[:-2], maxWidth, constraint)
            return movedPics + currentRow[-2]

### some sort of overall pic cropping function ###
### new pics = pics just uploaded
### for row in canvas:
##        new pics = cropFunction(newPics, row, constraint, maxWidth)

### actual cropping (divs, pics, etc) gets done inside
        
        
