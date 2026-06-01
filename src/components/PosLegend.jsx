import './PosLegend.css';

const legendGroups = [
  {
    category: 'Nouns / Pronouns',
    items: [
      { label: 'NOUN (Danh từ)', className: 'NOUN' },
      { label: 'PROPN (Danh từ riêng)', className: 'PROPN' },
      { label: 'PRON (Đại từ)', className: 'PRON' },
    ]
  },
  {
    category: 'Verbs / Auxiliary',
    items: [
      { label: 'VERB (Động từ)', className: 'VERB' },
      { label: 'AUX (Trợ động từ)', className: 'AUX' },
    ]
  },
  {
    category: 'Modifiers',
    items: [
      { label: 'ADJ (Tính từ)', className: 'ADJ' },
      { label: 'ADV (Trạng từ)', className: 'ADV' },
    ]
  },
  {
    category: 'Function Words',
    items: [
      { label: 'ADP (Giới từ)', className: 'ADP' },
      { label: 'DET (Hạn định từ)', className: 'DET' },
      { label: 'CCONJ (Liên từ kết hợp)', className: 'CCONJ' },
      { label: 'SCONJ (Liên từ phụ thuộc)', className: 'SCONJ' },
      { label: 'PART (Phụ từ)', className: 'PART' },
    ]
  },
  {
    category: 'Other',
    items: [
      { label: 'PUNCT (Dấu câu)', className: 'PUNCT' },
      { label: 'NUM (Số từ)', className: 'NUM' },
      { label: 'INTJ (Thán từ)', className: 'INTJ' },
      { label: 'SYM (Ký hiệu)', className: 'SYM' },
      { label: 'X (Khác)', className: 'X' },
    ]
  }
];

function PosLegend() {
  return (
    <div className="pos-legend-container">
      <div className="legend-header">Chú giải Từ loại (Universal POS Tags)</div>
      <div className="legend-grid">
        {legendGroups.map((group, gIdx) => (
          <div key={gIdx} className="legend-group">
            <div className="legend-category">{group.category}</div>
            <div className="legend-items">
              {group.items.map((item, idx) => (
                <div key={idx} className="legend-item">
                  <span className={`part leaf legend-color-box ${item.className}`}>Aa</span>
                  <span className="legend-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PosLegend;
