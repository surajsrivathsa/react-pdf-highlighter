import React from "react";
import type { Highlight, IHighlight } from "./react-pdf-highlighter";

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  submitAnnotations: (annotations: Array<IHighlight>) => void;
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
}: Props) {

  // const handleAnnotationsSubmit = () => {
  //   const annotations: IHighlight[] = [...]; // Your array of IHighlight objects
  //   submitAnnotations(annotations); // Call the prop function with the annotations
  // };

  const [selectedHighlight, setSelectedHighlight] = React.useState<IHighlight | null>(null);
  const [editedComment, setEditedComment] = React.useState<string>("");
  

  const handleHighlightClick = (highlight: IHighlight) => {
    setSelectedHighlight(highlight);
    setEditedComment(highlight.comment.text);
  };

  const handleRemoveClick = () => {
    if (selectedHighlight) {
      const updatedHighlights = highlights.filter(
        (highlight) => highlight !== selectedHighlight
      );
      submitAnnotations(updatedHighlights);
      setSelectedHighlight(null);
    }
  };

  const handleUpdateClick = () => {
    if (selectedHighlight) {
      const updatedHighlight = {
        ...selectedHighlight,
        comment: { text: editedComment },
      };
      const updatedHighlights = highlights.map((highlight) =>
      highlight === selectedHighlight
    ? {
        ...highlight,
        comment: { text: editedComment, emoji: "" }, // Provide an empty emoji
      }
    : highlight
);
      submitAnnotations(updatedHighlights);
      setSelectedHighlight(null);
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
        {highlights.map((highlight, index) => (
          <li
            key={index}
            className="sidebar__highlight"
            onClick={() => {
              updateHash(highlight);
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
          </li>
        ))}
      </ul>


       {/* Add buttons for removing and updating */}
      {selectedHighlight && (
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
    </div>
  );
}
