// import { PDFPageProxy } from 'pdfjs-dist';

// ... (other imports and code)

// This function calculates the bounding boxes for startObj, endObj and the bounding box
// that includes all the text between startObj and endObj.
export const calculateBoundingBoxSlice = (startObj: any, endObj: any, pdfViewportObj: any) => {
  const startX = startObj.transform[4];
  const startY = startObj.transform[5];
  const endX = endObj.transform[4] + endObj.width + 1;
  const endY = endObj.transform[5] + endObj.height + 1;

  const viewportStartObj = pdfViewportObj.convertToViewportPoint(startX, startY);
  const viewportEndObj = pdfViewportObj.convertToViewportPoint(endX, endY);

  const startObjBoundingRect = {
    x1: viewportStartObj[0],
    y1: viewportStartObj[1],
    x2: viewportStartObj[0] + startObj.width + 50,
    y2: viewportStartObj[1] + Math.max(startObj.height , 10) ,
    width: pdfViewportObj.width,
    height: pdfViewportObj.height,
  };

  const endObjBoundingRect = {
    x1: viewportEndObj[0],
    y1: viewportEndObj[1],
    x2: viewportEndObj[0] + endObj.width + 50,
    y2: viewportEndObj[1] + Math.max(endObj.height , 10),
    width: pdfViewportObj.width,
    height: pdfViewportObj.height,
  };

  const boundingRectModified = {
    x1: Math.min(startObjBoundingRect.x1, endObjBoundingRect.x1),
    y1: Math.min(startObjBoundingRect.y1, endObjBoundingRect.y1),
    x2: Math.max(startObjBoundingRect.x2, endObjBoundingRect.x2),
    y2: Math.max(startObjBoundingRect.y2, endObjBoundingRect.y2),
    width: pdfViewportObj.width,
    height: pdfViewportObj.height,
  };

  return [startObjBoundingRect, endObjBoundingRect, boundingRectModified];
};


export const calculateBoundingBox = (startObj: any, endObj: any, pdfViewportObj: any, min_X: number, max_X: number) => {
  const startX = startObj.transform[4];
  const startY = startObj.transform[5];
  const endX = endObj.transform[4] + endObj.width + 1;
  const endY = endObj.transform[5] ;

  const viewportStartObj = pdfViewportObj.convertToViewportPoint(startX, startY);
  const viewportEndObj = pdfViewportObj.convertToViewportPoint(endX, endY);

  const startObjBoundingRect = {
    x1: viewportStartObj[0],
    y1: viewportStartObj[1],
    x2: viewportStartObj[0] + startObj.width + 10,
    y2: Math.max(viewportStartObj[1] , 5) ,
    width: pdfViewportObj.width,
    height: pdfViewportObj.height,
  };

  const endObjBoundingRect = {
    x1: viewportEndObj[0],
    y1: viewportEndObj[1],
    x2: viewportEndObj[0] + endObj.width + 10,
    y2: Math.max(viewportEndObj[1] , 5),
    width: pdfViewportObj.width,
    height: pdfViewportObj.height,
  };

  const boundingRectModified = {
    x1: min_X, //Math.min(startObjBoundingRect.x1, endObjBoundingRect.x1),
    y1: Math.min(startObjBoundingRect.y1, endObjBoundingRect.y1)-7,
    x2: max_X-50, //Math.max(startObjBoundingRect.x2, endObjBoundingRect.x2),
    y2: Math.max(startObjBoundingRect.y2, endObjBoundingRect.y2)+7,
    width: pdfViewportObj.width,
    height: pdfViewportObj.height,
  };

  return [startObjBoundingRect, endObjBoundingRect, boundingRectModified];
};

// ... (rest of your code)

