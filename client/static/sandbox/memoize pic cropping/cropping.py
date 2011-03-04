
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
    


def constraintValidBasic(newPics, row, maxSize):
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

def checkPerfectCrop(rowToCheck, constraint, maxRowWidth):
    rowWidth = sum([pic for pic in rowToCheck])
    amtToCrop = rowWidth - maxRowWidth
    if amtToCrop > 0 and constraint*rowWidth > amtToCrop:
        return True
    else:
        return False
