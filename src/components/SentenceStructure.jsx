import { useMemo } from 'react';

function SentenceStructure({ data }) {
  // data là 1 list các dictionary
  // Hàm tính độ sâu tối đa của cấu trúc và lưu kết quả
  const calculateDepths = (part) => {
    if (typeof part !== 'object' || part === null) return { depth: 0, children: {} };
    
    const entries = Object.entries(part);
    if (entries.length === 0) return { depth: 0, children: {} };

    const children = {};
    let maxDepth = 0;

    entries.forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const childResult = calculateDepths(value);
        children[key] = childResult;
        maxDepth = Math.max(maxDepth, 1 + childResult.depth);
      }
    });

    return { depth: maxDepth, children };
  };

  const renderSentencePart = (part, index, depth = 0, depthMap = null) => {
    if (typeof part === 'object' && part !== null) {
      const entries = Object.entries(part);
      const currentDepth = depthMap ? depthMap.depth : 0;
      
      return (
        <span 
          key={index} 
          className="sentence-part nested"
          style={{
            minHeight: `${(depth + currentDepth + 1) * 40}px`,
            padding: '5px 10px'
          }}
        >
          {entries.map(([key, value], i) => {
            if (typeof value === 'object' && value !== null) {
              const childDepthMap = depthMap ? depthMap.children[key] : null;
              return (
                <span key={i} className="nested-part">
                  {renderSentencePart(value, i, depth + 1, childDepthMap)}
                </span>
              );
            }
            return (
              <span key={i} className={`part ${key}`}>
                {value}
              </span>
            );
          })}
        </span>
      );
    }
    return (
      <span key={index} className="sentence-part">
        {part}
      </span>
    );
  };

  // Tính toán depthMap một lần duy nhất khi data thay đổi
  const depthMaps = useMemo(() => 
    data.map(part => calculateDepths(part)),
    [data]
  );

  return (
    <span className="sentence-structure" style={{
      padding: `${depthMaps.reduce((acc, val) => (acc < (val.depth + 1)) ? val.depth : acc, 0)}px`,
    }}>
      {data.map((part, index) => 
        renderSentencePart(part, index, 0, depthMaps[index])
      )}
    </span>
  );
}

export default SentenceStructure; 