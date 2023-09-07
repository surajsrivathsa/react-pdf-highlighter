import axios from 'axios';

// Function to get keywords from backend
export const getKeywordsFromBackend = async () => {
  try {
    const response = await fetch("backend/find_relevant_keywords");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch keywords", error);
    return null;
  }
};



// Existing imports and code

// Upload PDF to backend
export const uploadPdfToBackend = async (file: File) => {
  const formData = new FormData();
  formData.append('pdf', file);
  
  try {
    const response = await axios.post('/backend/upload_pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Handle success
    console.log(response.data);
  } catch (error) {
    // Handle error
    console.error(error);
  }
};

// uploadPdf = (file: File) => {
//   // Existing logic
//   this.uploadPdfToBackend(file);
// };

// Existing code...

