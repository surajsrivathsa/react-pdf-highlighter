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
        let searchTextRealIdx = null;
        let contextStringRealIdx = null;
        for (let idx = windowStart; idx <= windowEnd; idx++){
          let pdf_snippet = content[idx].str;
          if (pdf_snippet.toLowerCase().indexOf(normalizedSearchText) !== -1 ){
            searchTextRealIdx = idx;
          }
          else if (pdf_snippet.toLowerCase().indexOf(normalizedContextString) !== -1){
            contextStringRealIdx = idx;
          }
          if ( searchTextRealIdx !== null && contextStringRealIdx !== null){
            break;
          }
        }
        if (searchTextRealIdx !== null && contextStringRealIdx !== null){
          resultPairs.push([Math.min(searchTextRealIdx, contextStringRealIdx), Math.max(searchTextRealIdx, contextStringRealIdx)]);
          console.log("real index array: ", [Math.min(searchTextRealIdx, contextStringRealIdx), Math.max(searchTextRealIdx, contextStringRealIdx)], searchTextIndex, contextTextIndex);
        }
        else{
          resultPairs.push([windowStart, windowEnd]); 
        }
        
        lastMatchIndex = contextTextIndex + windowStart;
        console.log(searchTextIndex, contextTextIndex, resultPairs);
      }
    }
  }

  return resultPairs;
};

export const findMatchingIndicesOnlySearchText = (searchText: string,  content: Array<any> ): Number[] => {
  // Convert all text into lower case
  let normalizedSearchText = searchText.toLowerCase();
  let normalizedContent = content.map((item: { str: string }) => item.str).join(' ').toLowerCase();
  
  let matchedIndexList: Number[] = [];

  const searchTextIndex = normalizedContent.indexOf(normalizedSearchText);
    
  if (searchTextIndex !== -1 ) {

    for (let i = 0; i < content.length; i++ )
    {
      if (content[i].str.toLowerCase().indexOf(normalizedSearchText) !== -1)
      {
        matchedIndexList.push(i)
      }
    }    
  }
  normalizedContent = '';

  return matchedIndexList;
};


// Example usage
// const fullPageContent = "The quick fox jumped over a lazy turtle and dog. Lazy Turtle was very slow compared to Quick FOX at race start.";
// const searchText = "Quick Fox";
// const contextString = "lazy Turtle";
// const windowSize = 50;
// const result = findMatchingIndices(searchText, contextString, windowSize, fullPageContent);
// console.log(result);  // Should log the unique index pairs based on words
