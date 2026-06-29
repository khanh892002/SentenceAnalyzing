import { useState, useRef } from 'react';
import SentenceStructure from './SentenceStructure';

function ExportModal({ data, isFlatMode, isFocusMode, onClose }) {
  const [exportWidth, setExportWidth] = useState(600);
  const exportRef = useRef(null);

  const handleDownloadImage = async () => {
    if (exportRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const bgColor = isDark ? '#2c2c2c' : '#ffffff';

        const canvas = await html2canvas(exportRef.current, {
          backgroundColor: bgColor,
          useCORS: true,
          scale: 2,               // 2x resolution for sharper output
          scrollX: 0,
          scrollY: 0,
          width: exportRef.current.scrollWidth,
          height: exportRef.current.scrollHeight,
          windowWidth: exportRef.current.scrollWidth,
        });

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = data.length > 1 ? 'document-analysis.png' : 'sentence-analysis.png';
        link.href = dataUrl;
        link.click();
        onClose();
      } catch (err) {
        console.error('Failed to export image:', err);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content export-config-modal">
        <h3>Configure Export Image</h3>
        <p className="modal-hint">Drag the container corner or use the slider to adjust the width before downloading.</p>

        <div className="slider-container">
          <label>Adjust Width: {exportWidth}px</label>
          <input
            type="range"
            min="300"
            max="1200"
            value={exportWidth}
            onChange={(e) => setExportWidth(Number(e.target.value))}
            className="width-slider"
          />
        </div>

        <div className="export-preview-wrapper">
          <div
            className="resizable-container"
            style={{ width: `${exportWidth}px` }}
            onMouseUp={(e) => setExportWidth(e.target.offsetWidth)}
          >
            <div ref={exportRef} className="export-capture-area vertical-export-list">
              {data.map((tree, idx) => (
                <div key={idx} className="export-sentence-block" style={{ marginBottom: idx < data.length - 1 ? '30px' : '0' }}>
                  {data.length > 1 && (
                    <div className="export-sentence-label" style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px', color: '#95a5a6' }}>Sentence {idx + 1}</div>
                  )}
                  <SentenceStructure
                    data={[tree]}
                    isFlatMode={isFlatMode}
                    isFocusMode={isFocusMode}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-button">Cancel</button>
          <button onClick={handleDownloadImage} className="download-button">Download Image</button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
