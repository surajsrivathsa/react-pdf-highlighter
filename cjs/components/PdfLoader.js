"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfLoader = void 0;
const react_1 = __importStar(require("react"));
const pdf_1 = require("pdfjs-dist/legacy/build/pdf");
const pdf_lib_1 = require("pdf-lib");
class PdfLoader extends react_1.Component {
    constructor() {
        super(...arguments);
        this.state = {
            pdfDocument: null,
            error: null,
        };
        this.documentRef = react_1.default.createRef();
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
            pdf_1.GlobalWorkerOptions.workerSrc = workerSrc;
        }
        Promise.resolve()
            .then(() => discardedDocument && discardedDocument.destroy())
            .then(() => __awaiter(this, void 0, void 0, function* () {
            if (!url) {
                return;
            }
            // Load existing PDF with pdf-lib
            const pdfBytes = yield fetch(url).then(res => res.arrayBuffer());
            const pdfDoc = yield pdf_lib_1.PDFDocument.load(pdfBytes);
            const totalNumPages = pdfDoc.getPageCount();
            const endPage = Math.min(this.props.currentPage + this.props.pageSize - 1, totalNumPages);
            // Extract only specified pages
            const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage - 1);
            // console.log("pageIndices: ", pageIndices, " startPage: ", startPage, " endPage: ", endPage);
            const newPdfDoc = yield pdf_lib_1.PDFDocument.create();
            const copiedPages = yield newPdfDoc.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => newPdfDoc.addPage(page));
            const newPdfBytes = yield newPdfDoc.save();
            // Load the new PDF with PDF.js
            const newPdfDocument = yield (0, pdf_1.getDocument)({
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
        const { children, beforeLoad, currentPage, pageSize } = this.props;
        const { pdfDocument, error } = this.state;
        const endPage = currentPage + pageSize - 1;
        // find last page
        // if (pdfDocument !== null){
        //   const endPage = Math.min(currentPage + pageSize - 1, pdfDocument.numPages);
        // }
        // else{
        //   const endPage = Math.min(currentPage + pageSize - 1, 1000000);
        // }
        console.log("currentPage: ", currentPage, " endPage: ", endPage, " pageSize: ", pageSize);
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("span", { ref: this.documentRef }),
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
            return react_1.default.cloneElement(errorMessage, { error: this.state.error });
        }
        return null;
    }
}
exports.PdfLoader = PdfLoader;
PdfLoader.defaultProps = {
    workerSrc: "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js",
};
exports.default = PdfLoader;
//# sourceMappingURL=PdfLoader.js.map