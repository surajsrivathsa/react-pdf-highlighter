import React, { useEffect, useRef } from 'react';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf';

interface PDFPageProps {
  pageNumber: number;
  pdfDocument: PDFDocumentProxy;
  isVisible: boolean;
  onPageHeight: (pageNumber: number, height: number) => void;
}

const PDFPage: React.FC<PDFPageProps> = ({ pageNumber, pdfDocument, isVisible, onPageHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const renderPage = async () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      if (mounted && canvasRef.current && isVisible) {
        const page: PDFPageProxy = await pdfDocument.getPage(pageNumber);
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
            await renderTaskRef.current.promise;
          } catch (error: any) {
            if (error.name === 'RenderingCancelledException') {
              console.log(`Rendering cancelled for page ${pageNumber}`);
            } else {
              console.error('Error rendering page:', error);
            }
          }
        }
      }
    };

    renderPage();

    return () => {
      mounted = false;
      if (renderTaskRef.current) {
        console.log("Cancelling render");
        renderTaskRef.current.cancel();
      }
    };
  }, [pageNumber, pdfDocument, isVisible, onPageHeight]);

  return <div style={{ height: isVisible ? 'auto' : '0', overflow: 'hidden' }}><canvas ref={canvasRef} /></div>;
};

export default React.memo(PDFPage);
