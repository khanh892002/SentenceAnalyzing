import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ReadingAssistant from '../components/ReadingAssistant';

function SharedResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSharedAnalysis = async () => {
      try {
        const docRef = doc(db, 'analyses', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();
          if (docData.isPublic) {
            setData(docData);
          } else {
            setError('This analysis is not public.');
          }
        } else {
          setError('Analysis not found.');
        }
      } catch (err) {
        console.error("Error fetching shared document:", err);
        setError('Error loading shared analysis. You might not have permission.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedAnalysis();
  }, [id]);

  if (loading) return <div className="saved-container">Loading shared analysis...</div>;

  if (error) {
    return (
      <div className="saved-container empty-state">
        <div className="empty-content">
          <span className="empty-icon">🚫</span>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="login-button">Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-container">
      <div className="saved-header">
        <h2>Shared Analysis</h2>
        <button onClick={() => navigate('/')} className="back-button">
          Go to App
        </button>
      </div>

      <div className="detail-view">
        <div className="detail-meta">
          <h3>{data.sentence}</h3>
          <p>Shared Analysis • {data.createdAt?.toDate().toLocaleString()}</p>
        </div>
        <ReadingAssistant 
          responseJSON={data.result} 
          showSaveButton={false} 
          showReAnalyzeButton={false}
        />
      </div>
    </div>
  );
}

export default SharedResult;
