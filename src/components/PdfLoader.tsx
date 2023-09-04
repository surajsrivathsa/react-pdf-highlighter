import React, { Component } from "react";

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument } from 'pdf-lib';

interface Props {
  /** See `GlobalWorkerOptionsType`. */
  workerSrc: string;

  url: string;
  beforeLoad: JSX.Element;
  errorMessage?: JSX.Element;
  //children: (pdfDocument: PDFDocumentProxy, pageNum: number) => JSX.Element; // changed it to suit our needs for paginations
  children: (pdfDocument: PDFDocumentProxy) => JSX.Element;
  onError?: (error: Error) => void;
  cMapUrl?: string;
  cMapPacked?: boolean;

  // added below as new props
  currentPage: number;
  pageSize: number;
  onLoad: (totalPages: number) => void;  // Modify this line
}

interface State {
  pdfDocument: PDFDocumentProxy | null;
  error: Error | null;
}

export class PdfLoader extends Component<Props, State> {
  state: State = {
    pdfDocument: null,
    error: null,
  };

  static defaultProps = {
    workerSrc: "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js",
  };

  documentRef = React.createRef<HTMLElement>();

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    const { pdfDocument: discardedDocument } = this.state;
    if (discardedDocument) {
      discardedDocument.destroy();
    }
  }

  async componentDidUpdate(prevProps: Props) {
    if (this.props.url !== prevProps.url) {
      this.load();
    }

    if (this.props.currentPage !== prevProps.currentPage || this.props.pageSize !== prevProps.pageSize) {
      await this.load();  // refetch pages
    }
  }

  componentDidCatch(error: Error, info?: any) {
    const { onError } = this.props;

    if (onError) {
      onError(error);
    }

    this.setState({ pdfDocument: null, error });
  }

  load() {
    const { ownerDocument = document } = this.documentRef.current || {};
    const { url, cMapUrl, cMapPacked, workerSrc } = this.props;
    const { pdfDocument: discardedDocument } = this.state;
    this.setState({ pdfDocument: null, error: null });

    const startPage = this.props.currentPage;
    

    if (typeof workerSrc === "string") {
      GlobalWorkerOptions.workerSrc = workerSrc;
    }

    Promise.resolve()
    .then(() => discardedDocument && discardedDocument.destroy())
    .then(async () => {
      if (!url) {
        return;
      }

      // Load existing PDF with pdf-lib
      const pdfBytes = await fetch(url).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalNumPages = pdfDoc.getPageCount();

      const endPage = Math.min(this.props.currentPage + this.props.pageSize - 1, totalNumPages);
      
      // Extract only specified pages
      const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage-1);

      // // console.log("pageIndices: ", pageIndices, " startPage: ", startPage, " endPage: ", endPage);
      const newPdfDoc = await PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => newPdfDoc.addPage(page));
      
      const newPdfBytes = await newPdfDoc.save();
      
      // Load the new PDF with PDF.js
      const newPdfDocument = await getDocument({
        data: newPdfBytes,
        ownerDocument,
        cMapUrl,
        cMapPacked,
      }).promise;
      
      this.setState({ pdfDocument: newPdfDocument });
      this.props.onLoad(totalNumPages);  // Here totalNumPages is from original document
    })
    .catch((e) => this.componentDidCatch(e));
  }

  render() {
    const { children, beforeLoad, } = this.props;
    const { pdfDocument, error } = this.state;

    //const endPage = currentPage + pageSize - 1;

    // find last page
    // if (pdfDocument !== null){
    //   const endPage = Math.min(currentPage + pageSize - 1, pdfDocument.numPages);
    // }
    // else{
    //   const endPage = Math.min(currentPage + pageSize - 1, 1000000);
    // }

    // console.log("currentPage: ", currentPage, " endPage: ", endPage, " pageSize: ", pageSize);
    

     return (
        <>
          <span ref={this.documentRef} />
          {error
            ? this.renderError()
            : !pdfDocument
            ? beforeLoad
            : children(pdfDocument)
            // : Array.from(new Array(endPage - currentPage + 1), (el, index) => currentPage + index).map((pageNum) => (
            //     <React.Fragment key={pageNum}>
            //       {this.props.children(pdfDocument, pageNum)}
            //     </React.Fragment>
            //   ))
          }
        </>
      );
  }

  renderError() {
    const { errorMessage } = this.props;
    if (errorMessage) {
      return React.cloneElement(errorMessage, { error: this.state.error });
    }

    return null;
  }
}

export default PdfLoader;
