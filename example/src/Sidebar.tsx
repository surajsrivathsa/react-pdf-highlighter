import React from "react";
import type { Highlight, IHighlight } from "./react-pdf-highlighter";

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  submitAnnotations: (annotations: Array<IHighlight>) => void;
  uploadPdf: (file: File) => void; // Adding this to handle file upload
}

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

declare const APP_VERSION: string;

export function Sidebar({
  highlights,
  toggleDocument,
  resetHighlights,
  submitAnnotations,
  uploadPdf, // Adding this to handle file upload
}: Props) {

  // const handleAnnotationsSubmit = () => {
  //   const annotations: IHighlight[] = [...]; // Your array of IHighlight objects
  //   submitAnnotations(annotations); // Call the prop function with the annotations
  // };

  // Handling file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPdf(file); // Call the function to upload the PDF
    }
  };

  const [selectedHighlight, setSelectedHighlight] = React.useState<IHighlight | null>(null);
  const [editedComment, setEditedComment] = React.useState<string>("");
  const [selectedHighlightIndex, setSelectedHighlightIndex] = React.useState<number | null>(null);
  

  const handleHighlightClick = (index: number) => {
    setSelectedHighlightIndex(index);
    setEditedComment(highlights[index].comment.text);
  };

  const handleRemoveClick = () => {
    if (selectedHighlightIndex !== null) {
      const updatedHighlights = highlights.filter(
        (_, index) => index !== selectedHighlightIndex
      );
      
      setSelectedHighlightIndex(null);
      submitAnnotations(updatedHighlights);
    }
  };

  const handleUpdateClick = () => {
    if (selectedHighlightIndex !== null) {
      const updatedHighlights = highlights.map((highlight, index) =>
        index === selectedHighlightIndex
          ? {
              ...highlight,
              comment: { text: editedComment, emoji: highlight.comment.emoji }, // Keep the existing emoji
            }
          : highlight
      );
      
      setSelectedHighlightIndex(null);
      submitAnnotations(updatedHighlights);
    }
  };


  return (
    <div className="sidebar" style={{ width: "25vw" }}>
      <div className="description" style={{ padding: "1rem" }}>


        <h2 style={{ marginBottom: "1rem" }}>
          react-pdf-highlighter {APP_VERSION}
        </h2>

        <p style={{ fontSize: "0.7rem" }}>
          <a href="https://github.com/agentcooper/react-pdf-highlighter">
            Open in GitHub
          </a>
        </p>

        <p>
          <small>
            To create area highlight hold ⌥ Option key (Alt), then click and
            drag.
          </small>
        </p>
      </div>

      <ul className="sidebar__highlights">
        {highlights.length === 0 ? (
          <div className="no-annotations" style={{ padding: "1rem" }}>
            No annotations for this document.
          </div>

          ) : (
            highlights.map((highlight, index) => (
            <li
              key={index}
              className="sidebar__highlight"
              onClick={() => {
                updateHash(highlight);
                handleHighlightClick(index);
              }}
            >
              <div>
                <strong>{highlight.comment.text}</strong>
                {highlight.content.text ? (
                  <blockquote style={{ marginTop: "0.5rem" }}>
                    {`${highlight.content.text.slice(0, 90).trim()}…`}
                  </blockquote>
                ) : null}
                {highlight.content.image ? (
                  <div
                    className="highlight__image"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img src={highlight.content.image} alt={"Screenshot"} />
                  </div>
                ) : null}
              </div>
              <div className="highlight__location">
                Page {highlight.position.pageNumber}
              </div>
              {selectedHighlightIndex === index && (
                <div style={{ padding: "1rem" }}>
                  <button onClick={handleRemoveClick}>Remove Annotation</button>
                  <input
                    type="text"
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                  />
                  <button onClick={handleUpdateClick}>Update Comment</button>
                </div>
              )}
            </li>
            )
          ))}
        </ul>

      <div style={{ padding: "1rem" }}>
        <button onClick={() => submitAnnotations(highlights)}>Submit Annotations</button>
      </div>
      <div style={{ padding: "1rem" }}>
        <button onClick={toggleDocument}>Toggle PDF document</button>
      </div>
      {highlights.length > 0 ? (
        <div style={{ padding: "1rem" }}>
          <button onClick={resetHighlights}>Reset highlights</button>
        </div>
      ) : null}
      

      {/* handle pdf */} 
      <div style={{ padding: "1rem" }}>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} />
      </div>
    </div>
  );
}
