var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { Component } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import { PDFDocument } from 'pdf-lib';
export class PdfLoader extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            pdfDocument: null,
            error: null,
        };
        this.documentRef = React.createRef();
    }
    componentDidMount() {
        this.load();
    }
    componentWillUnmount() {
        const { pdfDocument: discardedDocument } = this.state;
        if (discardedDocument) {
            discardedDocument.destroy();
        }
    }
    componentDidUpdate(prevProps) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.props.url !== prevProps.url) {
                this.load();
            }
            if (this.props.currentPage !== prevProps.currentPage || this.props.pageSize !== prevProps.pageSize) {
                yield this.load(); // refetch pages
            }
        });
    }
    componentDidCatch(error, info) {
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
            .then(() => __awaiter(this, void 0, void 0, function* () {
            if (!url) {
                return;
            }
            // Load existing PDF with pdf-lib
            const pdfBytes = yield fetch(url).then(res => res.arrayBuffer());
            const pdfDoc = yield PDFDocument.load(pdfBytes);
            const totalNumPages = pdfDoc.getPageCount();
            const endPage = Math.min(this.props.currentPage + this.props.pageSize - 1, totalNumPages);
            // Extract only specified pages
            const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage - 1);
            // // console.log("pageIndices: ", pageIndices, " startPage: ", startPage, " endPage: ", endPage);
            const newPdfDoc = yield PDFDocument.create();
            const copiedPages = yield newPdfDoc.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => newPdfDoc.addPage(page));
            const newPdfBytes = yield newPdfDoc.save();
            // Load the new PDF with PDF.js
            const newPdfDocument = yield getDocument({
                data: newPdfBytes,
                ownerDocument,
                cMapUrl,
                cMapPacked,
            }).promise;
            this.setState({ pdfDocument: newPdfDocument });
            this.props.onLoad(totalNumPages); // Here totalNumPages is from original document
        }))
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
        return (React.createElement(React.Fragment, null,
            React.createElement("span", { ref: this.documentRef }),
            error
                ? this.renderError()
                : !pdfDocument
                    ? beforeLoad
                    : children(pdfDocument)
        // : Array.from(new Array(endPage - currentPage + 1), (el, index) => currentPage + index).map((pageNum) => (
        //     <React.Fragment key={pageNum}>
        //       {this.props.children(pdfDocument, pageNum)}
        //     </React.Fragment>
        //   ))
        ));
    }
    renderError() {
        const { errorMessage } = this.props;
        if (errorMessage) {
            return React.cloneElement(errorMessage, { error: this.state.error });
        }
        return null;
    }
}
PdfLoader.defaultProps = {
    workerSrc: "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js",
};
export default PdfLoader;
//# sourceMappingURL=PdfLoader.js.map