import React, { Component } from "react";
import axios from 'axios';

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "./react-pdf-highlighter";

import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";

import { testHighlights as _testHighlights } from "./test-highlights";
import { Spinner } from "./Spinner";
import { Sidebar } from "./Sidebar";
import { searchPDF, searchPDFPage } from './PdfSearchService'; // Replace with your actual import
import { getKeywordsFromBackend } from "./BackendService";

// import  PDFUploader  from './PDFUploader';


import "./style/App.css";

const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

interface State {
  url: string;
  highlights: Array<IHighlight>;

  // adding below variables to state
  currentPage: number;
  pageSize: number;
  totalPageCount: number; // this should be set after loading the PDF

  // New state variable for keeping track of the current batch number
  currentBatch: number;

  searchText: string;
  contextString: string;
  windowSize: number;
}

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";

const searchParams = new URLSearchParams(document.location.search);

const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;


class App extends Component<{}, State> {
  state = {
    url: initialUrl,
    highlights: testHighlights[initialUrl]
      ? [...testHighlights[initialUrl]]
      : [],

    // adding below to state

    currentPage: 1,
    pageSize: 20,
    totalPageCount: 0, // Initialize it after PDF load
    currentBatch: 1,
    searchText: "search text",
    contextString: "",
    windowSize: 1,

  };

  // new functions to move between batch of pages

  calculateBatchNumber = (pageNumber: number, batchSize: number = this.state.pageSize): number => {
    return Math.ceil(pageNumber / batchSize);
  };

  setPageBatch = (batchNumber: number, batchSize: number = this.state.pageSize) => {
    const newCurrentPage = ((batchNumber - 1) * batchSize) + 1;

    // console.log("newCurrentPage: ", newCurrentPage);
    this.setState({ 
      currentPage: newCurrentPage,
      currentBatch: batchNumber, // Update the current batch as well
    });
  };

  onNextPageBatch = () => {
    
    const newBatchNumber = this.state.currentBatch + 1;
    this.setState((prevState) => ({
      currentPage: Math.min(prevState.currentPage + prevState.pageSize, prevState.totalPageCount),
      currentBatch: newBatchNumber
    }));

  };

  onPrevPageBatch = () => {

    const newBatchNumber = Math.max(this.state.currentBatch - 1, 1);
    this.setState((prevState) => ({
      currentPage: Math.max(prevState.currentPage - prevState.pageSize, 1),
      currentBatch: newBatchNumber
    }));
  };

  handleFindMatch = async () => {
    try {
      const { highlights, url, searchText, contextString, windowSize } = this.state;
      const searchStringHighlights = await searchPDF(url, searchText, contextString, windowSize);
      
      console.log("searchStringHighlights: ", searchStringHighlights);


      this.setState({highlights: [...highlights, ...searchStringHighlights] });

    } catch (error) {
      console.error(`Error finding match: ${error}`);
    }
  };

  setSearchText = (text: string) => {
    this.setState({ searchText: text });
  };

  setContextString = (context: string) => {
    this.setState({ contextString: context });
  };

  setWindowSize = (size: number) => {
    this.setState({ windowSize: size });
  };


  resetHighlights = () => {
    this.setState({
      highlights: [],
    });
  };

  toggleDocument = () => {
    const newUrl =
      this.state.url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;

    this.setState({
      url: newUrl,
      highlights: testHighlights[newUrl] ? [...testHighlights[newUrl]] : [],
    });
  };

  handleSubmitAnnotations = (annotations: Array<IHighlight>) => {
  // Do something with the annotations, like submitting to a server or updating state
  this.setState({
      highlights: annotations,
    });
  console.log('Submitting annotations:', annotations);
  };

  // Function to handle uploaded PDF
  uploadPdf = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.setState({
        url: e.target?.result as string,
        highlights: [], // Reset highlights to an empty array
      });
    };
    reader.readAsDataURL(file);
  };

  // Add this function to handle JSON data and search
  handleJsonData = async (jsonData: any) => {
    try {
      console.log("jsonData: ", jsonData);
      const { highlights, url } = this.state;
      const searchStringHighlightsfromJSON = await searchPDFPage(url, jsonData.pages_list);
      // console.log("searchStringHighlightsfromJSON: ", searchStringHighlightsfromJSON);
      this.setState({ highlights: [...highlights, ...searchStringHighlightsfromJSON] });
    }
    catch (error) {
      console.error(`Error finding match: ${error}`);
    }
  };

  // Make the API call and handle the received data
  fetchAndSearchKeywords = async () => {
    const jsonData = await getKeywordsFromBackend();
    if (jsonData) {
      this.handleJsonData(jsonData);
    }
  };

  // Fetch keywords from backend
  fetchKeywords = async () => {
    try {
      const response = await axios.get('/backend/find_relevant_keywords');
      const jsonData = response.data; // Assuming data format is JSON
      this.handleJsonData(jsonData);
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };


  scrollViewerTo = (highlight: any) => {};

  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash());

    if (highlight) {
      this.scrollViewerTo(highlight);
    }
  };

  componentDidMount() {
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    );
  }

  getHighlightById(id: string) {
    const { highlights } = this.state;

    return highlights.find((highlight) => highlight.id === id);
  }

  addHighlight(highlight: NewHighlight) {
    const { highlights } = this.state;

    console.log("Saving highlight", highlight);

    this.setState({
      highlights: [{ ...highlight, id: getNextId() }, ...highlights],
    });
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content);

    this.setState({
      highlights: this.state.highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    });
  }

  // changed stuff to handle pagination

  render() {
    const { url, highlights, currentPage, pageSize, totalPageCount,  } = this.state;
    // // console.log("changed  url ", url, " pageSize: ", pageSize);

    return (
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        {/* <PDFUploader onFileUpload={this.handleFileUpload} /> */}
        <Sidebar
          highlights={highlights}
          resetHighlights={this.resetHighlights}
          toggleDocument={this.toggleDocument}
          submitAnnotations={this.handleSubmitAnnotations}
          uploadPdf={this.uploadPdf} 
          onNextPageBatch={this.onNextPageBatch}
          onPrevPageBatch={this.onPrevPageBatch}
          disableNext={currentPage + pageSize > totalPageCount}
          disablePrev={currentPage === 1}
          currentPage={currentPage}
          pageSize={pageSize}
          setPageBatch={this.setPageBatch}
          onFindMatch={this.handleFindMatch}
          setSearchText={this.setSearchText}
          setContextString={this.setContextString}
          setWindowSize={this.setWindowSize}
          handleJsonData={this.handleJsonData}
          />
        <div
          style={{
            height: "100vh",
            width: "75vw",
            position: "relative",
          }}
        >
          <PdfLoader url={url} beforeLoad={<Spinner />}  currentPage={currentPage}  
            pageSize={pageSize}
            onLoad={(totalPages) => this.setState({ totalPageCount: totalPages })}>
            {(pdfDocument) => {
              
              const currentHighlights = highlights.filter(
                    highlight => highlight.position.pageNumber >= currentPage && highlight.position.pageNumber <= currentPage + pageSize - 1
                    );
              // console.log("currentHighlights: ", currentHighlights);
              return (
              <PdfHighlighter
                totalPageCount={totalPageCount}
                pageSize={pageSize}
                currentPage={currentPage}
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollChange={resetHash}
                // pdfScaleValue="page-width"
                scrollRef={(scrollTo) => {
                  this.scrollViewerTo = scrollTo;
                  this.scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      this.addHighlight({ content, position, comment });

                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  // console.log("isTextHighlight: ", isTextHighlight, " highlight.position: ", highlight.position);

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        this.updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                    />
                  );

                  // console.log("highlightTransform-highlight: ", highlight, " isTextHighlight: ", isTextHighlight);

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={(popupContent) =>
                        setTip(highlight, (highlight) => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index}
                      children={component}
                    />
                  );
                }}
                highlights={currentHighlights}
              />
            )}}
          </PdfLoader>
        </div>
      </div>
    );
  }

 
}

export default App;
