import { useMemo, useState } from 'react';
import '../styles/SentenceStructure.css';

// Dependency roles considered "core" for Focus Mode (S-V-O backbone)
const CORE_ROLES = new Set([
  'ROOT', 'nsubj', 'nsubjpass', 'csubj', 'csubjpass',
  'dobj', 'pobj', 'iobj', 'attr', 'ccomp', 'xcomp', 'acomp',
  'agent', 'oprd'
]);

// Roles to keep when collapsing a phrase for semantic summary
const SEMANTIC_ROLES = new Set([
  'head', 'ROOT', 'compound', 'amod', 'prt', 'prep', 'pobj', 'dobj', 'nsubj'
]);

function SentencePhrase({ node, renderNode, isFocusMode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const isBlurred = isFocusMode && !CORE_ROLES.has(node.role);

  const getSemanticSummary = (n) => {
    let words = [];
    const traverse = (child) => {
      if (SEMANTIC_ROLES.has(child.role)) {
        if (child.type === 'word' || (!child.content && child.text)) {
          words.push(child.text);
        } else if (child.content) {
          child.content.forEach(traverse);
        }
      }
    };
    if (n.content) {
      n.content.forEach(traverse);
    }
    return words.join(' ') || '...';
  };

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
        <span className="collapsed-text"> {getSemanticSummary(node)} </span>
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

  // Extract all raw text from a node (for Flat Mode blocks)
  const extractRawText = (node) => {
    let words = [];
    const traverse = (n) => {
      if (n.type === 'word' || (!n.content && n.text)) words.push(n.text);
      if (n.content) n.content.forEach(traverse);
    };
    traverse(node);
    
    let text = words.join(' ');
    text = text.replace(/ ([.,?!;:'"”\])}])/g, '$1');
    text = text.replace(/([\'"“\[({]) /g, '$1');
    return text;
  };

  const renderSentencePart = (node, index) => {
    const isBlurred = isFocusMode && !CORE_ROLES.has(node.role);

    // Phrase node
    if (node.content && node.content.length > 0) {
      // Flat Mode: Compress phrase into a single block (height = 1)
      if (isFlatMode) {
        return (
          <span
            key={index}
            className={`flat-leaf phrase-block ${node.pos} ${isBlurred ? 'focus-blur' : ''}`}
            title={`${node.role} (${node.pos})`}
          >
            {extractRawText(node)}
          </span>
        );
      }
      return <SentencePhrase key={index} node={node} renderNode={renderSentencePart} isFocusMode={isFocusMode} />;
    }

    // Leaf node
    if (isFlatMode) {
      return (
        <span
          key={index}
          className={`flat-leaf ${node.pos} ${isBlurred ? 'focus-blur' : ''}`}
          title={`${node.role} (${node.pos})`}
        >
          {node.text}
        </span>
      );
    }

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

  const processedData = useMemo(() => {
    if (!data) return [];
    const clonedData = JSON.parse(JSON.stringify(data));
    clonedData.forEach(part => calculateHeights(part));
    return clonedData;
  }, [data]);

  return (
    <span className={`sentence-structure ${isFlatMode ? 'flat-mode' : ''}`}>
      {processedData.map((part, index) => renderSentencePart(part, index))}
    </span>
  );
}

export default SentenceStructure;