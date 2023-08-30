var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useRef } from 'react';
const PDFPage = ({ pageNumber, pdfDocument, isVisible, onPageHeight }) => {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    useEffect(() => {
        let mounted = true;
        const renderPage = () => __awaiter(void 0, void 0, void 0, function* () {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            if (mounted && canvasRef.current && isVisible) {
                const page = yield pdfDocument.getPage(pageNumber);
                // Get the available width of the container (e.g., the window width or parent div width)
                const availableWidth = window.innerWidth; // or another reference to the width
                // Calculate the scale based on the available width and page width
                const scale = availableWidth / page.getViewport({ scale: 1 }).width;
                // Get the viewport using the calculated scale
                const viewport = page.getViewport({ scale });
                const canvasContext = canvasRef.current.getContext('2d');
                console.log("viewport width: ", viewport.width, " viewport height: ", viewport.height);
                onPageHeight(pageNumber, viewport.height); // Report the actual page height
                if (canvasContext) {
                    canvasRef.current.width = viewport.width;
                    canvasRef.current.height = viewport.height;
                    renderTaskRef.current = page.render({ canvasContext, viewport });
                    try {
                        yield renderTaskRef.current.promise;
                    }
                    catch (error) {
                        if (error.name === 'RenderingCancelledException') {
                            console.log(`Rendering cancelled for page ${pageNumber}`);
                        }
                        else {
                            console.error('Error rendering page:', error);
                        }
                    }
                }
            }
        });
        renderPage();
        return () => {
            mounted = false;
            if (renderTaskRef.current) {
                console.log("Cancelling render");
                renderTaskRef.current.cancel();
            }
        };
    }, [pageNumber, pdfDocument, isVisible, onPageHeight]);
    return React.createElement("div", { style: { height: isVisible ? 'auto' : '0', overflow: 'hidden' } },
        React.createElement("canvas", { ref: canvasRef }));
};
export default React.memo(PDFPage);
//# sourceMappingURL=PDFPageComponent.js.map