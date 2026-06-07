import { useMemo, useState } from 'react';
import '../styles/SentenceStructure.css';

// Dependency roles considered "core" for Focus Mode (S-V-O backbone)
const CORE_ROLES = new Set([
  'ROOT', 'nsubj', 'nsubjpass', 'csubj', 'csubjpass',
  'dobj', 'pobj', 'iobj', 'attr', 'ccomp', 'xcomp', 'acomp',
  'agent', 'oprd'
]);

function SentencePhrase({ node, renderNode, isFocusMode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const isBlurred = isFocusMode && !CORE_ROLES.has(node.role);

  return (
    <span
      className={`part phrase ${node.pos} ${isCollapsed ? 'collapsed' : ''} ${isBlurred ? 'focus-blur' : ''}`}
      style={{ '--h': isCollapsed ? 0 : node.height }}
      title={`${node.role} (${node.pos})`}
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

function SentenceStructure({ data, isFlatMode = false, isFocusMode = false }) {
  // Recursively calculate nesting height for each node
  const calculateHeights = (node) => {
    if (!node.content || node.content.length === 0) {
      node.height = 0;
      return 0;
    }
    const childHeights = node.content.map(child => calculateHeights(child));
    node.height = 1 + Math.max(...childHeights);
    return node.height;
  };

  // Flatten a tree into an array of leaf nodes (words)
  const flattenTree = (node) => {
    if (!node) return [];
    if (!node.content || node.content.length === 0) {
      return [node];
    }
    return node.content.flatMap(child => flattenTree(child));
  };

  const renderSentencePart = (node, index) => {
    // Phrase node
    if (node.content && node.content.length > 0) {
      return <SentencePhrase key={index} node={node} renderNode={renderSentencePart} isFocusMode={isFocusMode} />;
    }

    // Leaf node
    const isBlurred = isFocusMode && !CORE_ROLES.has(node.role);
    return (
      <span
        key={index}
        className={`part leaf ${node.pos} ${isBlurred ? 'focus-blur' : ''}`}
        style={{ '--h': 0 }}
        title={`${node.role} (${node.pos})`}
      >
        {node.text}
      </span>
    );
  };

  const renderFlatLeaf = (node, index) => {
    const isBlurred = isFocusMode && !CORE_ROLES.has(node.role);
    return (
      <span
        key={index}
        className={`flat-leaf ${node.pos} ${isBlurred ? 'focus-blur' : ''}`}
        title={`${node.role} (${node.pos})`}
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

  // Flat Mode: extract all leaves and render inline
  if (isFlatMode) {
    return (
      <span className="sentence-structure flat-mode">
        {processedData.flatMap((part, pIdx) =>
          flattenTree(part).map((leaf, lIdx) => renderFlatLeaf(leaf, `${pIdx}-${lIdx}`))
        )}
      </span>
    );
  }

  // Tree Mode (default)
  return (
    <span className="sentence-structure">
      {processedData.map((part, index) => renderSentencePart(part, index))}
    </span>
  );
}

export default SentenceStructure;