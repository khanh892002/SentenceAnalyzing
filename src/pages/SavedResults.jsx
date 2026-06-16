import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ReadingAssistant from '../components/ReadingAssistant';
import './SavedResults.css';

function SavedResults() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
      if (currentUser) {
        fetchAnalyses(currentUser, true);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAnalyses = async (currentUser, isInitial = false) => {
    if (!currentUser || loading || !hasMore) return;

    setLoading(true);
    try {
      const analysesRef = collection(db, 'analyses');
      let q = query(
        analysesRef,
        where('uid', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (!isInitial && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const documentSnapshots = await getDocs(q);

      const newAnalyses = [];
      documentSnapshots.forEach((doc) => {
        newAnalyses.push({ id: doc.id, ...doc.data() });
      });

      if (isInitial) {
        setAnalyses(newAnalyses);
      } else {
        setAnalyses(prev => [...prev, ...newAnalyses]);
      }

      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      if (documentSnapshots.docs.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching analyses: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteDoc(doc(db, 'analyses', id));
        setAnalyses(prev => prev.filter(a => a.id !== id));
        if (selectedResult && selectedResult.id === id) {
          setSelectedResult(null);
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleReAnalyze = (e, sentence) => {
    e.stopPropagation();
    navigate('/', { state: { textToAnalyze: sentence } });
  };

  const handleShare = async (e, item) => {
    e.stopPropagation();
    try {
      if (!item.isPublic) {
        const docRef = doc(db, 'analyses', item.id);
        await updateDoc(docRef, { isPublic: true });
        setAnalyses(prev => prev.map(a => a.id === item.id ? { ...a, isPublic: true } : a));
      }

      const shareUrl = `${window.location.origin}/share/${item.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error("Error sharing document: ", error);
      alert('Failed to generate share link.');
    }
  };

  if (loadingUser) return <div className="saved-container">Loading...</div>;

  if (!user) {
    return (
      <div className="saved-container empty-state">
        <div className="empty-content">
          <span className="empty-icon">🔒</span>
          <h2>Authentication Required</h2>
          <p>Please log in to view and manage your saved analyses.</p>
          <button onClick={() => navigate('/login')} className="login-button">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-container">
      <div className="saved-header">
        <h2>My Saved Analyses</h2>
        {selectedResult && (
          <button onClick={() => setSelectedResult(null)} className="back-button">
            &larr; Back to List
          </button>
        )}
      </div>

      {selectedResult ? (
        <div className="detail-view">
          <div className="detail-meta">
            <h3>{selectedResult.sentence}</h3>
            <p>Saved on: {selectedResult.createdAt?.toDate().toLocaleString()}</p>
          </div>
          <ReadingAssistant
            responseJSON={selectedResult.result}
            showSaveButton={false}
            showReAnalyzeButton={true}
            onReAnalyze={(e) => handleReAnalyze(e, selectedResult.sentence)}
          />
        </div>
      ) : (
        <>
          {analyses.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-content">
                <span className="empty-icon">📝</span>
                <h2>No saved analyses yet</h2>
                <p>Go to the Dashboard to analyze and save some sentences.</p>
                <button onClick={() => navigate('/')} className="login-button">Go to Dashboard</button>
              </div>
            </div>
          ) : (
            <div className="results-grid">
              {analyses.map(item => (
                <div key={item.id} className="result-card" onClick={() => setSelectedResult(item)}>
                  <div className="card-header">
                    <span className="date">{item.createdAt?.toDate().toLocaleDateString()}</span>
                    <span className="sentence-count">{item.result?.length || 0} sentences</span>
                  </div>
                  <p className="card-text">
                    {item.sentence.length > 120 ? item.sentence.substring(0, 120) + '...' : item.sentence}
                  </p>
                  <div className="card-actions">
                    <button className="card-btn share-btn" onClick={(e) => handleShare(e, item)} title="Copy Share Link">
                      {item.isPublic ? '🔗 Shared' : 'Share'}
                    </button>
                    <button className="card-btn reanalyze-btn" onClick={(e) => handleReAnalyze(e, item.sentence)}>
                      Re-analyze
                    </button>
                    <button className="card-btn delete-btn" onClick={(e) => handleDelete(e, item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && analyses.length > 0 && (
            <div className="load-more-container">
              <button onClick={() => fetchAnalyses(user)} disabled={loading} className="load-more-btn">
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SavedResults;
