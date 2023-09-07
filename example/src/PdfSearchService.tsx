import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { PdfSearchIndividualPage, PdfSearchIndividualPagewithSearchText } from './PdfSearchIndividualPage';

// import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";

// Set the path to the worker:
GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js";

export const searchPDF = (url: string, searchText: string, contextString: string, windowSize: number): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    console.log("searchText: ", searchText, " contextString: ", contextString, " windowSize: ", windowSize);
    getDocument(url).promise.then(async doc => {

      if(!doc) {
        reject("Document object is undefined or null: ");
        return;
      }
      
      const numPages = doc.numPages;
      const allHighlights: any= [];
      
      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await doc.getPage(i);
          if (!page) {
            console.log(`Page ${i} is undefined or null.`);
            continue;
          }
          console.log("searching page: ", i);
          const highlights = await PdfSearchIndividualPage(page, searchText, contextString, windowSize);
          allHighlights.push(...highlights);

        } 
        catch(pageError) {
          console.error(`An error occurred while processing page ${i}: `, pageError);
        }
      }
      
      resolve(allHighlights);

    }).catch(err => {
      console.log("URL: ", url);
      reject(`Error while reading PDF from URL: ${err}`);
    });
  });
};


const processPages = async (pagesList: any[], pdfDocument: any): Promise<any[]> => {
  let foundHighlights: any[] = [];
  
  try {
    for (const pageData of pagesList) {
      const { pageNumber, substances } = pageData;

      // Fetch the page
      const page = await pdfDocument.getPage(pageNumber);

      for (const substance of substances) {
        const { token, tokenIdxOnPage, chebi_ids } = substance;
        console.log(token, chebi_ids, tokenIdxOnPage)

        // Assume that PdfSearchIndividualPagewithSearchText returns the highlight object
        try {
          const tmpHighlights = await PdfSearchIndividualPagewithSearchText(page, token);
          foundHighlights.push(...tmpHighlights);  // Assuming tmpHighlights is an array, spread and push into foundHighlights

        } catch (highlightError) {
          console.error(`Failed to search and highlight the keyword: ${highlightError}`);
        }
      }
    }
  } catch (generalError) {
    console.error(`Failed to process pages: ${generalError}`);
  }

  return foundHighlights; // Return an array in every case, could be empty if no highlights were found or an error occurred
};



export const searchPDFPage = (url: string, pagesList: any[]): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    let highlights: any[] = [];
    
    try {
      const doc = await getDocument(url).promise;

      if (!doc) {
        reject("Document object is undefined or null.");
        resolve(highlights); // Return empty array to fulfill Promise<any[]>
        return;
      }

      try {
        const tmpHighlights = await processPages(pagesList, doc); // Make sure processPages returns a Promise<any[]>
        highlights.push(...tmpHighlights);  // Assuming tmpHighlights is an array, spread and push into highlights
      } catch (processError) {
        console.error(`Error during processPages: ${processError}`);
      }

      resolve(highlights); // Return found highlights, or empty array if none
      
    } catch (err) {
      console.log("URL: ", url);
      reject(`Error while reading PDF from URL: ${err}`);
      resolve(highlights); // Return empty array to fulfill Promise<any[]>
    }
  });
};




// Example usage
// const url = "https://arxiv.org/pdf/1708.08021.pdf";
// const searchText = "constraint propagation";
// const contextString = "closed form";
// const windowSize = 50; // think of 50 words or subwords that are differentiated by space/newline
// const allHighlights = searchPDF(url, searchText, contextString, windowSize);
// console.log(allHighlights);  // Should log the highlights
