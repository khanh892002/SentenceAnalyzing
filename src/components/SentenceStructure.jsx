import { useMemo, useState } from 'react';
import '../styles/SentenceStructure.css';

function SentencePhrase({ node, renderNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <span
      className={`part phrase ${node.pos} ${isCollapsed ? 'collapsed' : ''}`}
      style={{ '--h': isCollapsed ? 0 : node.height }}
      title={node.error || node.pos || 'Click to toggle collapse'}
      onClick={toggleCollapse}
    >
      <span className="collapse-toggle">
        {isCollapsed ? '[+]' : '[-]'}
      </span>
      {node.error && <span className="error-icon" title={node.error}>⚠️</span>}
      {isCollapsed ? (
        <span className="collapsed-text"> ... </span>
      ) : (
        node.content.map((child, i) => renderNode(child, i))
      )}
    </span>
  );
}

function SentenceStructure({ data }) {
  // Hàm đệ quy tính toán và gán thuộc tính height cho từng node
  const calculateHeights = (node) => {
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
      return <SentencePhrase key={index} node={node} renderNode={renderSentencePart} />;
    }

    // Trường hợp 2: Node lá
    return (
      <span
        key={index}
        className={`part leaf ${node.pos}`}
        style={{ '--h': 0 }}
        title={node.error || node.pos || ''}
      >
        {node.text}
      </span>
    );
  };

  const processedData = useMemo(() => {
    if (!data) return [];
    const clonedData = JSON.parse(JSON.stringify(data));
    clonedData.forEach(part => calculateHeights(part));
    return clonedData;
  }, [data]);

  return (
    <span className="sentence-structure">
      {processedData.map((part, index) => renderSentencePart(part, index))}
    </span>
  );
}

export default SentenceStructure;