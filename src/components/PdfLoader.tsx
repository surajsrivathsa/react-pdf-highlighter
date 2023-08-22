import React, { Component,  } from "react";

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import PdfPage  from "./PDFPageComponent"

// Add these imports at the top
import { throttle } from 'lodash';
import { url } from "inspector";

const PAGE_HEIGHT = 800; // Replace with the actual height of a page in your render

interface Props {
  /** See `GlobalWorkerOptionsType`. */
  workerSrc: string;

  url: string;
  beforeLoad: JSX.Element;
  errorMessage?: JSX.Element;
  children: (pdfDocument: PDFDocumentProxy) => JSX.Element;
  onError?: (error: Error) => void;
  cMapUrl?: string;
  cMapPacked?: boolean;
  currentPage: number;
  windowSize: number; // Number of pages to load before and after the current page
}

interface State {
  pdfDocument: PDFDocumentProxy | null;
  error: Error | null;
  pages: PDFPageProxy[] | null;
  currentPage: number;
  windowSize: number;
}

export class PdfLoader extends Component<Props, State> {
  state: State = {
    pdfDocument: null,
    error: null,
    pages: null,
    currentPage: 1,
    windowSize: 3
  };

  static defaultProps = {
    workerSrc: "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js",
  };

  documentRef = React.createRef<HTMLElement>();

  // Add scroll event listener in componentDidMount
  componentDidMount() {
    this.load(this.props.currentPage, this.props.windowSize);
    window.addEventListener('scroll', this.handleScroll);
  }

  // Remove scroll event listener in componentWillUnmount
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  // Update componentDidUpdate to check for changes in currentPage and windowSize
  componentDidUpdate(prevProps: Props) {
    if (this.props.url !== prevProps.url ||
        this.props.currentPage !== prevProps.currentPage ||
        this.props.windowSize !== prevProps.windowSize) {
      this.load(this.props.currentPage, this.props.windowSize);
    }
  }

  componentDidCatch(error: Error, info?: any) {
    const { onError } = this.props;

    if (onError) {
      onError(error);
    }

    this.setState({ pdfDocument: null, error });
  }

  load(currentPage: number, windowSize: number) {
    const { ownerDocument = document } = this.documentRef.current || {};
    const { url, cMapUrl, cMapPacked, workerSrc } = this.props;
    const { pdfDocument: discardedDocument } = this.state;
    this.setState({ pdfDocument: null, error: null });

    if (typeof workerSrc === "string") {
      GlobalWorkerOptions.workerSrc = workerSrc;
    }

    // for limited pdf rendering
    const startPage = Math.max(currentPage - windowSize, 1);
    const endPage = currentPage + windowSize;

    Promise.resolve()
      .then(() => discardedDocument && discardedDocument.destroy())
      .then(() => {
        if (!url) {
          return;
        }

        return getDocument({
          ...this.props,
          ownerDocument,
          cMapUrl,
          cMapPacked,
        }).promise.then((pdfDocument) => {
          this.setState({ pdfDocument });

          // Load the specific window of pages - below block added by suraj
          const startPage = Math.max(this.props.currentPage - this.props.windowSize, 1);
          const endPage = this.props.currentPage + this.props.windowSize;

          const pages = [];
          for (let i = startPage; i <= endPage; i++) {
            pages.push(pdfDocument.getPage(i));
          }

          Promise.all(pages).then((loadedPages) => {
            this.setState({ pages: loadedPages });
          });


        });
      })
      .catch((e) => this.componentDidCatch(e));
  }

  // Add a method to handle scroll
  handleScroll = throttle(() => {
    const scrollPosition = window.scrollY;
    const currentPage = Math.ceil(scrollPosition / PAGE_HEIGHT);

    if (this.state.currentPage !== currentPage) {
      this.setState({ currentPage }, () => {
        this.load(currentPage, this.props.windowSize);
      });
    }
  }, 300);

  renderPages() {
    const { pdfDocument, currentPage, windowSize, pages } = this.state;

    if (!pdfDocument) return null;

    if (!pages) return null;

    const totalPages = pdfDocument.numPages;
    const startPage = Math.max(currentPage - windowSize, 1);
    const endPage = Math.min(currentPage + windowSize, totalPages);

    console.log(totalPages, startPage, endPage);

    return pages.map((page, index) => (
      <PdfPage key={index} page={page} />
    ));
  }

  render() {
    const { children, beforeLoad } = this.props;
    const { pdfDocument, error, } = this.state;
    return (
      <>
        <span ref={this.documentRef} />
        {error
          ? this.renderError()
          : !pdfDocument || !children
          ? beforeLoad
          : this.renderPages()}
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
