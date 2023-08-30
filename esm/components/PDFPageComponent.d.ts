import React from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf';
interface PDFPageProps {
    pageNumber: number;
    pdfDocument: PDFDocumentProxy;
    isVisible: boolean;
    onPageHeight: (pageNumber: number, height: number) => void;
}
declare const _default: React.NamedExoticComponent<PDFPageProps>;
export default _default;
