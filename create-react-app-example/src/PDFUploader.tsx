import React from 'react';

interface PDFUploaderProps {
  onFileUpload: (file: File) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileUpload }) => (
  <div>
    <input type="file" accept=".pdf" onChange={e => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    }} />
  </div>
);

export default PDFUploader;
