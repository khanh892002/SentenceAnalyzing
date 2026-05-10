import { useMemo } from 'react';

function SentenceStructure({ data }) {
  // Hàm đệ quy tính toán và gán thuộc tính height cho từng node
  const calculateHeights = (node) => {
    // Điều kiện dừng: Nếu node không có content (là từ lá)
    if (!node.content || node.content.length === 0) {
      node.height = 0;
      return 0;
    }
    const childHeights = node.content.map(child => calculateHeights(child));
    node.height = 1 + Math.max(...childHeights);
    return node.height;
  };

  const renderSentencePart = (node, index) => {
    // Trường hợp 1: Cụm từ có content (Phrase)
    if (node.content && node.content.length > 0) {
      return (
        <span 
          key={index} 
          className={`nested-part ${node.role || ''} ${node.error ? 'has-error' : ''}`}
          style={{ '--h': node.height }}
          title={node.error || ''}
        >
          {node.role && <span className="role-label">{node.role}</span>}
          {node.error && <span className="error-icon" title={node.error}>⚠️</span>}
          {node.content.map((child, i) => renderSentencePart(child, i))}
        </span>
      );
    }
    
    // Trường hợp 2: Node lá (word, punctuation, unknown)
    return (
      <span 
        key={index} 
        className={`part ${node.role || ''} ${node.type === 'unknown' ? 'unknown' : ''} ${node.type === 'punctuation' ? 'punctuation' : ''}`}
        style={{ '--h': node.height || 0 }}
        title={node.error || node.role || ''}
      >
        {node.role && node.type !== 'punctuation' && node.type !== 'unknown' && (
          <span className="role-label">{node.role}</span>
        )}
        <span className="word-text">{node.text}</span>
      </span>
    );
  };

  // Mutate data để tính height một lần khi data thay đổi
  const processedData = useMemo(() => {
    if (!data) return [];
    // Deep clone để không thay đổi trực tiếp prop data
    const clonedData = JSON.parse(JSON.stringify(data));
    clonedData.forEach(part => calculateHeights(part));
    return clonedData;
  }, [data]);

  return (
    <span className="sentence-structure">
      {processedData.map((part, index) => 
        renderSentencePart(part, index)
      )}
    </span>
  );
}

export default SentenceStructure;