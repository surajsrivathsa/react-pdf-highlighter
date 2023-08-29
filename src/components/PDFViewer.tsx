import React, { useState } from 'react';
import PdfLoader from './PdfLoader';
import PdfPageComponent from './PdfPageComponent';

type PdfViewerProps = {
  url: string;
};

const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const [pdf, setPdf] = useState<any>(null); // Replace `any` with the appropriate type.
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handlePdfLoad = (loadedPdf: any) => {
    setPdf(loadedPdf);
  };

  return (
    <div>
      <PdfLoader url={url} onLoad={handlePdfLoad} />
      {pdf && (
        <div>
          <PdfPageComponent pdf={pdf} pageNumber={currentPage} />
          <button onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
          <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
