import React from "react";
import type { IHighlight } from "./react-pdf-highlighter";
import axios from 'axios';

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  submitAnnotations: (annotations: Array<IHighlight>) => void;
  uploadPdf: (file: File) => void; // Adding this to handle file upload

  onNextPageBatch: () => void; // New prop to handle next page batch
  onPrevPageBatch: () => void; // New prop to handle previous page batch
  disableNext: boolean; // New prop to disable the "Next" button
  disablePrev: boolean; // New prop to disable the "Prev" button
  currentPage: number;
  pageSize: number;

  setPageBatch: (batchNumber: number) => void; // New prop to set the current batch number

  onFindMatch: () => void;
  setSearchText: (text: string) => void;
  setContextString: (text: string) => void;
  setWindowSize: (size: number) => void;
  handleJsonData: (jsonData: any) => void;
}

type Substance = {
  token: string;
  tokenIdxOnPage: number;
  chebi_ids: string[];
};

type PageList = {
  pageNumber: number;
  substances: Substance[];
};

type JSONData = {
  filepath: string;
  filehash: string;
  texthash: string;
  contenthash: string;
  pages_list: PageList[];
};



const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

// const APP_VERSION: string = "1.0.0";

export function Sidebar({
  highlights,
  toggleDocument,
  resetHighlights,
  submitAnnotations,
  uploadPdf, // Adding this to handle file upload

  onNextPageBatch,
  onPrevPageBatch,
  disableNext,
  disablePrev,

  currentPage,
  pageSize,

  setPageBatch,
  onFindMatch, setSearchText, setContextString, setWindowSize, handleJsonData
}: Props) {

  // const handleAnnotationsSubmit = () => {
  //   const annotations: IHighlight[] = [...]; // Your array of IHighlight objects
  //   submitAnnotations(annotations); // Call the prop function with the annotations
  // };

  // Handling file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPdf(file); // Call the function to upload the PDF
    }
  };

  type Substance = {
  token: string;
  tokenIdxOnPage: number;
  chebi_ids: string[];
};

type PageList = {
  pageNumber: number;
  substances: Substance[];
};

type JSONData = {
  filepath: string;
  filehash: string;
  texthash: string;
  contenthash: string;
  pages_list: PageList[];
};

  const getUniqueKeywordsPerPage = (inputJson: JSONData): JSONData => {
    const { pages_list, ...otherKeys } = inputJson;

    const uniquePagesList: PageList[] = pages_list.reduce((acc: PageList[], currentPage: PageList) => {
      const existingPage = acc.find(page => page.pageNumber === currentPage.pageNumber);

      if (existingPage) {
        currentPage.substances.forEach(substance => {
          if (!existingPage.substances.some(existingSubstance => existingSubstance.token === substance.token)) {
            existingPage.substances.push(substance);
          }
        });
      } else {
        const uniqueSubstances = currentPage.substances.reduce((uniqueSubs: Substance[], currSub: Substance) => {
          if (!uniqueSubs.some(sub => sub.token === currSub.token)) {
            uniqueSubs.push(currSub);
          }
          return uniqueSubs;
        }, []);

        acc.push({ pageNumber: currentPage.pageNumber, substances: uniqueSubstances });
      }

      return acc;
    }, []);

    return {
      ...otherKeys,
      pages_list: uniquePagesList
    };
  };



  // handle manual json upload
  // Add this function to upload JSON
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const jsonData = JSON.parse(e.target?.result as string);

          const uniqueKeywordsJsonData = getUniqueKeywordsPerPage(jsonData);
          // console.log("uniqueKeywordsJsonData: ", uniqueKeywordsJsonData);
          handleJsonData(uniqueKeywordsJsonData); // Pass to App.tsx
          
          // Optionally, send JSON data to backend
          // try {
          //   const response = await axios.post('/backend/upload_keywords', jsonData);
          //   // Handle success
          //   console.log(response.data);
          // } catch (error) {
          //   // Handle error
          //   console.error(error);
          // }
        };
        reader.readAsText(file);
      }
    };

  const calculateBatchNumber = (pageNumber: number): number => {
    return Math.ceil(pageNumber / pageSize) ;
  };


  // const [selectedHighlight, setSelectedHighlight] = React.useState<IHighlight | null>(null);
  const [editedComment, setEditedComment] = React.useState<string>("");
  const [selectedHighlightIndex, setSelectedHighlightIndex] = React.useState<number | null>(null);
  

  const handleHighlightClick = (index: number) => {
    if (selectedHighlightIndex === index) {
      setSelectedHighlightIndex(null);
    } else {
      // console.log("handleHighlightClick-index: ", index, " handleHighlightClick: ", highlights[index]);
      setSelectedHighlightIndex(index);
      setEditedComment(highlights[index].comment.text);

      // Calculate which batch this page is in
      // This is pseudo-code; you'll need to replace it with your actual batch calculation
      const pageNumber = highlights[index].position.pageNumber;
      const batchNumber = calculateBatchNumber(pageNumber); 

        // Navigate to the correct batch
      setPageBatch(batchNumber);

      // Now update the hash to scroll to the highlight
      updateHash(highlights[index]);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedHighlightIndex !== null) {
      const updatedHighlights = highlights.filter(
        (_, index) => index !== selectedHighlightIndex
      );
      setSelectedHighlightIndex(null);
      submitAnnotations(updatedHighlights);
    }
  };

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedHighlightIndex !== null) {
      const updatedHighlights = highlights.map((highlight, index) =>
        index === selectedHighlightIndex
          ? {
              ...highlight,
              comment: { text: editedComment, emoji: highlight.comment.emoji },
            }
          : highlight
      );
      setSelectedHighlightIndex(null);
      submitAnnotations(updatedHighlights);
    }
  };
  

  // MAKESURE THAT TOGGLE DOESNT GET ATCIVATED WHEN UPDATING TEXT BOX
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Stop event propagation
    setEditedComment(e.target.value);
  };


  return (
    <div className="sidebar" style={{ width: "25vw" }}>
      <div className="description" style={{ padding: "1rem" }}>


        <h2 style={{ marginBottom: "1rem" }}>
          react-pdf-highlighter 1.0.0
        </h2>

        <p style={{ fontSize: "0.7rem" }}>
          <a href="https://github.com/agentcooper/react-pdf-highlighter">
            Open in GitHub
          </a>
        </p>

        <p>
          <small>
            To create area highlight hold ⌥ Option key (Alt), then click and
            drag.
          </small>
        </p>
      </div>

      <ul className="sidebar__highlights">
        {highlights.length === 0 ? (
          <div className="no-annotations" style={{ padding: "1rem" }}>
            No annotations for this document.
          </div>

          ) : (
            highlights.map((highlight, index) => (
            <li
              key={index}
              className="sidebar__highlight"
              onClick={(e) => {
                updateHash(highlight);
                handleHighlightClick(index);
                if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) {
                  return;
                }
              }}
            >
              <div>
                <strong>{highlight.comment.text}</strong>
                {highlight.content.text ? (
                  <blockquote style={{ marginTop: "0.5rem" }}>
                    {`${highlight.content.text.slice(0, 90).trim()}…`}
                  </blockquote>
                ) : null}
                {highlight.content.image ? (
                  <div
                    className="highlight__image"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img src={highlight.content.image} alt={"Screenshot"} />
                  </div>
                ) : null}
              </div>
              <div className="highlight__location">
                Page {highlight.position.pageNumber}
              </div>
              {selectedHighlightIndex === index && (
                <div style={{ padding: "1rem" }}>
                  <button onClick={(e) => handleRemoveClick(e)}>Remove Annotation</button>
                  <input
                    type="text"
                    value={editedComment}
                    onChange={handleInputChange }
                    onClick={(e) => e.stopPropagation()} // Stop the click event from bubbling up
                  />
                  <button onClick={(e) => handleUpdateClick(e)}>Update Comment</button>
                </div>
              )}
            </li>
            )
          ))}
        </ul>

      <div style={{ padding: "1rem" }}>
        <button onClick={() => submitAnnotations(highlights)}>Submit Annotations</button>
      </div>
      <div style={{ padding: "1rem" }}>
        <button onClick={toggleDocument}>Toggle PDF document</button>
      </div>
      {highlights.length > 0 ? (
        <div style={{ padding: "1rem" }}>
          <button onClick={resetHighlights}>Reset highlights</button>
        </div>

      ) : null}
      <div style={{ padding: "1rem" }}>
          <button onClick={onPrevPageBatch} disabled={disablePrev}>
            Back
          </button>
          <button onClick={onNextPageBatch} disabled={disableNext}>
            Forward
          </button>
      </div>

      <div className="search-form">
        <input type="text" placeholder="Search Text" onChange={(e) => setSearchText(e.target.value)} />
        <input type="text" placeholder="Context" onChange={(e) => setContextString(e.target.value || '')} />
        <input type="number" placeholder="Window Size" onChange={(e) => setWindowSize(Number(e.target.value) || 1)} />
        <button onClick={onFindMatch}>Find Match</button>
      </div>
      

      {/* handle pdf */} 

      <div style={{ padding: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Upload PDF:</label>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} />
        </div>
        
        <div>
          <label>Upload Keywords JSON:</label>
          <input type
          ="file" accept="application/JSON" onChange={handleJsonUpload} />
        </div>
      </div>



    </div>
  );
}
