import React, { useRef, useEffect } from 'react';
import { PDFPageProxy } from 'pdfjs-dist';

interface Props {
  page: PDFPageProxy;
}

const PdfPage: React.FC<Props> = ({ page }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvasContext = canvasRef.current.getContext('2d');
      if (canvasContext) {
        // Define the viewport to render the page at the desired size
        const viewport = page.getViewport({ scale: 1 }); // You can change the scale as needed

        // Set the canvas size to match the viewport
        canvasRef.current.width = viewport.width;
        canvasRef.current.height = viewport.height;

        // Render the page to the canvas
        page.render({ canvasContext, viewport }).promise.catch((error) => {
          console.error('Error rendering page:', error);
        });
      }
    }
  }, [page]);

  return <canvas ref={canvasRef} />;
};

export default PdfPage;
