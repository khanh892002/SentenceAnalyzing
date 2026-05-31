import './PosLegend.css';

const legendItems = [
  { label: 'Noun (Danh từ)', className: 'NOUN' },
  { label: 'Verb (Động từ)', className: 'VERB' },
  { label: 'Adjective (Tính từ)', className: 'ADJ' },
  { label: 'Adverb (Trạng từ)', className: 'ADV' },
  { label: 'Subject (Chủ ngữ)', className: 'subject' },
  { label: 'Article (Mạo từ)', className: 'article' },
  { label: 'Other', className: 'part' },
];

function PosLegend() {
  return (
    <div className="pos-legend-container">
      <span className="legend-title">Chú giải màu sắc:</span>
      <div className="legend-items">
        {legendItems.map((item, idx) => (
          <div key={idx} className="legend-item">
            <span className={`legend-color-box ${item.className}`}></span>
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PosLegend;
