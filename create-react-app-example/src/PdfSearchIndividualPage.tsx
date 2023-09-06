import { PDFPageProxy } from 'pdfjs-dist';
import { calculateBoundingBox, calculateBoundingBoxSlice } from './PdfSearchUtils';
import { findMatchingIndices } from "./findMatchingText";


export interface HighlightObject {
  content: {
    text: string;
  };
  position: {
    boundingRect: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    rects: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    }>;
    pageNumber: number;
  };
  comment: {
    text: string;
    emoji: string;
  };
  pageNumber: number;
  id: string;
}

export type SearchHighlights = Array<HighlightObject>;

const getNextId = () => String(Math.random()).slice(2);

// const getViewportFromPDFPage = async (pdfPage: PDFPageProxy, scale: number = 1, rotation: number = 0) => {
//   const viewport = pdfPage.getViewport({ scale, rotation });
//   return viewport;
// };


export const PdfSearchIndividualPage = async (page: PDFPageProxy, searchText: string, contextString: string, windowSize: number): Promise<SearchHighlights> => {
  const content: any = await page.getTextContent();
  const searchHighlights: SearchHighlights = [];

  const combinedText = content.items.map((item: { str: any; }) => item.str).join(' ');


  let matchingIndices = findMatchingIndices( searchText,  contextString, windowSize, combinedText, content.items);
  let startIndex = null;
  let endIndex = null;
  let startObj = null;
  let endObj = null;
  let boundingBoxList: any = [];

  console.log("matchingIndices: ", matchingIndices);
  // console.log(content.items.slice(0,100));

  const pdfViewportObj = page.getViewport({ scale: 1.0, rotation: 0 });
  let min_X = 720;
  let max_X = 0;

  for (let idx=0; idx < Math.min(100, content.items.length) ; idx++)
  {

    let tstartObj = content.items[idx];
    // let tendObj = content.items[idx+1];

    const tboundingRectArray = calculateBoundingBoxSlice(tstartObj, tstartObj, pdfViewportObj); 

    const tstartObjBoundingRect = tboundingRectArray[0];
    // const tendObjBoundingRect = tboundingRectArray[1];
    // const tboundingRectModified = tboundingRectArray[2];

    min_X = Math.min(tstartObjBoundingRect.x1, min_X);
    max_X = Math.max(tstartObjBoundingRect.x2, max_X);

  }
  //let pageWidth = max_X - min_X;

  for (let idx = 0; idx < matchingIndices.length; idx++) 
  {
    startIndex = Math.min(matchingIndices[idx][0], matchingIndices[idx][1]);
    endIndex = Math.max(matchingIndices[idx][0], matchingIndices[idx][1]);

    console.log("Start Index: ", startIndex, " End Index: ", endIndex);
    console.log("Content Item Length: ", content.items.length);

    startObj = content.items[startIndex];
    endObj = content.items[endIndex];
    console.log("startObj: ", startObj, " endObj: ", endObj);
    console.log("contents array withing 50 window: ", content.items.slice(Math.max(0, startIndex-50), Math.min(endIndex+50, content.items.length)));
    console.log("page viewport: ", pdfViewportObj, " page view: ", page.view);

    boundingBoxList.push([startObj, endObj]);

    const boundingRectArray = calculateBoundingBox(startObj, endObj, pdfViewportObj, min_X, max_X); 
    const startObjBoundingRect = boundingRectArray[0];
    const endObjBoundingRect = boundingRectArray[1];
    const boundingRectModified = boundingRectArray[2];

    console.log("boundingRectArray: ", boundingRectArray);
    
    console.log(startObjBoundingRect, endObjBoundingRect);

    const highlight: HighlightObject = {
            content: {text: searchText} ,
            position: {
                boundingRect: boundingRectModified,
                rects: [startObjBoundingRect, endObjBoundingRect], //[boundingRectModified], //
                pageNumber: page.pageNumber
            },
            comment: {
                text: `search - ${searchText} - ${contextString} - ${windowSize}`,
                emoji: ""
            },
            pageNumber: page.pageNumber,
            id: getNextId()
            };
    if (startObjBoundingRect !== null && endObjBoundingRect !== null && startObj !== null && endObj !== null){
      searchHighlights.push(highlight);
    }
    
  }

  return searchHighlights;
};
