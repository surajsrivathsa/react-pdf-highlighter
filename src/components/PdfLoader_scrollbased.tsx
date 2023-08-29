import React, { Component } from "react";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf";
import PDFPage from "./PDFPageComponent";
import ErrorBoundary from "./PdfPageErrorBoundary";
import { throttle } from 'lodash';

interface Props {
  workerSrc: string;
  url: string;
  beforeLoad: JSX.Element;
  errorMessage?: JSX.Element;
  children?: (pdfDocument: PDFDocumentProxy) => JSX.Element;
  onError?: (error: Error) => void;
  cMapUrl?: string;
  cMapPacked?: boolean;
}

interface State {
  pdfDocument: PDFDocumentProxy | null;
  error: Error | null;
  currentPage: number;
  windowSize: number;
  pageHeights: number[];
}

export class PdfLoader extends Component<Props, State> {
  state: State = {
    pdfDocument: null,
    error: null,
    currentPage: 1,
    windowSize: 5,
    pageHeights: Array(100).fill(2160), // Initialize with default values
  };

  static defaultProps = {
    workerSrc: "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js",
  };

  documentRef: React.RefObject<HTMLDivElement> = React.createRef();

  handlePageHeight = (pageNumber: number, height: number) => {
    const pageHeights = [...this.state.pageHeights];
    pageHeights[pageNumber - 1] = height;
    // console.log("pageHeights: ", pageHeights, " height: ", height);
    this.setState({ pageHeights });
  };

  componentDidMount() {
    this.load();
    if (this.documentRef.current) {
      this.documentRef.current.addEventListener('scroll', this.throttledHandleScroll);
    }
  }

  componentWillUnmount() {
    if (this.documentRef.current) {
      this.documentRef.current.removeEventListener('scroll', this.throttledHandleScroll);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.props.url !== prevProps.url) {
      console.log('URL changed, reloading PDF');
      this.load();
    }
    console.log('Component Updated, Current Page:', this.state.currentPage);
  }

  componentDidCatch(error: Error, info?: any) {
    const { onError } = this.props;

    if (onError) {
      onError(error);
    }

    this.setState({ pdfDocument: null, error });
  }

  handleScroll = () => {
    const scrollPosition = this.documentRef.current?.scrollTop || 0;
    let scrolledHeight = 0;
    let currentPage = this.state.currentPage;

    console.log('Scroll position:', scrollPosition, 'Current Page:', currentPage);

    this.state.pageHeights.forEach((height, index) => {
      if (scrollPosition >= scrolledHeight && scrollPosition < scrolledHeight + height - 300) {
        currentPage = index + 1;
        console.log("resetting index: ", currentPage, " scrollPosition ", scrollPosition, " scrolledHeight ", scrolledHeight);
      }
      scrolledHeight += height;
    });

    // Adding a buffer to prevent immediate page change
    if (Math.abs(this.state.currentPage - currentPage) > 1 || 
        (this.state.currentPage !== currentPage && Math.abs(scrollPosition - scrolledHeight) > this.state.pageHeights[this.state.currentPage - 1] * 0.1)) {
      console.log("setting to new page: ", currentPage);
      this.setState({ currentPage });
      }
  };

  throttledHandleScroll = throttle(this.handleScroll, 1000);

  load() {
    const { url, cMapUrl, cMapPacked, workerSrc } = this.props;
    if (this.state.pdfDocument) return;

    this.setState({ pdfDocument: null, error: null });
    if (typeof workerSrc === "string") {
      GlobalWorkerOptions.workerSrc = workerSrc;
    }

    getDocument({ url, cMapUrl, cMapPacked }).promise
    .then(async (pdfDocument) => {
      const pageHeights = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1 }); // Assuming a scale of 1 for now; adjust as needed
        pageHeights.push(viewport.height); // Add the actual height of the page
      }

      this.setState({
        pdfDocument,
        pageHeights, // Use the dynamically computed page heights
      });
    })
    .catch((e) => this.componentDidCatch(e));
  }

  render() {
    const { children, beforeLoad, errorMessage } = this.props;
    const { pdfDocument, error, currentPage, windowSize } = this.state;

    console.log('Rendering PdfLoader, Current Page:', this.state.currentPage);

    return (
      <div ref={this.documentRef} style={{ overflow: 'auto', height: '100vh' }}>
        {error ? (errorMessage ? React.cloneElement(errorMessage, { error }) : null) : 
         !pdfDocument ? beforeLoad :
         Array.from({ length: pdfDocument.numPages }, (_, index) => (
           <ErrorBoundary key={index}>
             <PDFPage pageNumber={index + 1} pdfDocument={pdfDocument} isVisible={Math.abs(currentPage - (index + 1)) <= windowSize} onPageHeight={this.handlePageHeight} />
             {/* Math.abs(currentPage - (index + 1)) <= windowSize */}
           </ErrorBoundary>
         ))}
      </div>
    );
  }
}

export default PdfLoader;
