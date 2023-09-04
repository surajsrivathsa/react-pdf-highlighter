import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { PdfSearchIndividualPage } from './PdfSearchIndividualPage';

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

// Example usage
// const url = "https://arxiv.org/pdf/1708.08021.pdf";
// const searchText = "constraint propagation";
// const contextString = "closed form";
// const windowSize = 50; // think of 50 words or subwords that are differentiated by space/newline
// const allHighlights = searchPDF(url, searchText, contextString, windowSize);
// console.log(allHighlights);  // Should log the highlights
