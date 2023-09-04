type IndexPair = [number, number];

export const findMatchingIndices = (searchText: string, contextString: string, windowSize: number, fullPageContent: string, content: any): IndexPair[] => {
  // Convert all text into lower case
  const normalizedSearchText = searchText.toLowerCase();
  const normalizedContextString = contextString.toLowerCase();
  
  let resultPairs: IndexPair[] = [];
  let lastMatchIndex = -1;
  
  for (let idx = 0; idx < content.length; idx++) {
    let windowStart = Math.max(0, idx - windowSize);
    let windowEnd = Math.min(content.length, idx + windowSize);
    
    // Extract text from each content item within the window
    const windowContent = content.slice(windowStart, windowEnd).map((item: { str: string }) => item.str).join(' ').toLowerCase();
    
    const searchTextIndex = windowContent.indexOf(normalizedSearchText);
    const contextTextIndex = windowContent.indexOf(normalizedContextString);
    
    if (searchTextIndex !== -1 && contextTextIndex !== -1) {
      if (lastMatchIndex < contextTextIndex + windowStart) {
        // Relative to the original content list, we would have to find the actual indices of these positions
        resultPairs.push([windowStart, windowEnd]); 
        lastMatchIndex = contextTextIndex + windowStart;
        console.log(searchTextIndex, contextTextIndex);
      }
    }
  }

  return resultPairs;
};

// export const findMatchingIndices = (searchText: string, contextString: string, windowSize: number, fullPageContent: string, content: any): IndexPair[] => {
//   // Convert all text into lower case
//   const normalizedContent = fullPageContent.toLowerCase().split(/\s+/);

//   if (normalizedContent.length < windowSize) {
//     windowSize = Math.ceil(normalizedContent.length/4);
//     console.log("changed window size: ", windowSize);
//   }

//   const normalizedSearchText = searchText.toLowerCase().split(/\s+/);
//   const normalizedContextString = contextString.toLowerCase().split(/\s+/);

//   let resultPairs: IndexPair[] = [];
//   let lastMatchIndex = -1;

//   normalizedContent.forEach((word, idx) => {
//     let windowStart = Math.max(0, idx - windowSize);
//     let windowEnd = Math.min(normalizedContent.length, idx + windowSize);
//     const windowWords = normalizedContent.slice(windowStart, windowEnd);

//     if (windowWords.join(' ').includes(normalizedSearchText.join(' '))) {
//       if (windowWords.join(' ').includes(normalizedContextString.join(' '))) {
//         const searchStartIdx = windowWords.indexOf(normalizedSearchText[0]);
//         const contextStartIdx = windowWords.indexOf(normalizedContextString[0]);

//         if (searchStartIdx !== -1 && contextStartIdx !== -1 && lastMatchIndex < contextStartIdx + windowStart) {
//           resultPairs.push([searchStartIdx + windowStart, contextStartIdx + windowStart]);
//           lastMatchIndex = contextStartIdx + windowStart;
//         }
//       }
//     }
//   });



//   return resultPairs;
// };



// Example usage
// const fullPageContent = "The quick fox jumped over a lazy turtle and dog. Lazy Turtle was very slow compared to Quick FOX at race start.";
// const searchText = "Quick Fox";
// const contextString = "lazy Turtle";
// const windowSize = 50;
// const result = findMatchingIndices(searchText, contextString, windowSize, fullPageContent);
// console.log(result);  // Should log the unique index pairs based on words
