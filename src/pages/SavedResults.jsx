import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ReadingAssistant from '../components/ReadingAssistant';
import SigninRequest from '../components/SigninRequest';
import './SavedResults.css';

function SavedResults() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('original');
  const navigate = useNavigate();

  const PAGE_SIZE = 10;
  const unsubscribeSnapshotRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);

      // Tear down any previous listener before creating a new one
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }

      if (currentUser) {
        setLoading(true);
        // Real-time listener for the first page of analyses
        const q = query(
          collection(db, 'analyses'),
          where('uid', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );

        const unsub = onSnapshot(q, (snapshot) => {
          const liveAnalyses = snapshot.docs.map(d => {
            const docData = d.data();
            return {
              id: d.id,
              ...docData,
              result: typeof docData.result === 'string' ? JSON.parse(docData.result) : docData.result
            };
          });
          setAnalyses(liveAnalyses);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? null);
          setHasMore(snapshot.docs.length === PAGE_SIZE);
          setLoading(false);
        }, (error) => {
          console.error('Realtime listener error:', error);
          setLoading(false);
        });

        unsubscribeSnapshotRef.current = unsub;
      } else {
        setAnalyses([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshotRef.current) unsubscribeSnapshotRef.current();
    };
  }, []);

  // Load More: fetches the next page with getDocs and appends (no realtime for subsequent pages)
  const loadMoreAnalyses = async () => {
    if (!user || loading || !hasMore || !lastVisible) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'analyses'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE),
        startAfter(lastVisible)
      );
      const snapshot = await getDocs(q);
      const more = snapshot.docs.map(d => {
        const docData = d.data();
        return {
          id: d.id,
          ...docData,
          result: typeof docData.result === 'string' ? JSON.parse(docData.result) : docData.result
        };
      });
      setAnalyses(prev => [...prev, ...more]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? null);
      if (snapshot.docs.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      console.error('Error loading more analyses:', error);
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
      const docRef = doc(db, 'analyses', item.id);
      const newIsPublic = !item.isPublic;
      await updateDoc(docRef, { isPublic: newIsPublic });
      setAnalyses(prev => prev.map(a => a.id === item.id ? { ...a, isPublic: newIsPublic } : a));

      if (newIsPublic) {
        const shareUrl = `${window.location.origin}/share/${item.id}`;
        await navigator.clipboard.writeText(shareUrl);
        alert('Analysis is now public! Share link copied to clipboard.');
      } else {
        alert('Analysis is now private. Shared link is disabled.');
      }
    } catch (error) {
      console.error("Error toggling share status: ", error);
      alert('Failed to update share status.');
    }
  };


  if (loadingUser) return <div className="saved-container">Loading...</div>;

  return (!user) ? (
    <SigninRequest />
  ) : (
    <div className="saved-container">
      <div className="saved-header">
        <h2>My Saved Analyses</h2>
        {selectedResult && (
          <button onClick={() => { setSelectedResult(null); setActiveDetailTab('original'); }} className="back-button">
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

          {selectedResult.translateResults && selectedResult.translateResults.length > 0 ? (
            <div className="analysis-tabs-wrapper">
              <div className="analysis-tabs-header">
                <button
                  type="button"
                  className={`tab-btn ${activeDetailTab === 'original' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('original')}
                >
                  Original (English)
                </button>
                {selectedResult.translateResults.map(trans => (
                  <button
                    key={trans.targetLang}
                    type="button"
                    className={`tab-btn ${activeDetailTab === `trans_${trans.targetLang}` ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab(`trans_${trans.targetLang}`)}
                  >
                    Translation ({trans.targetLang.toUpperCase()})
                  </button>
                ))}
                <button
                  type="button"
                  className={`tab-btn ${activeDetailTab === 'split' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('split')}
                >
                  Side-by-Side
                </button>
              </div>

              <div className="tab-content">
                {activeDetailTab === 'original' ? (
                  <ReadingAssistant
                    responseJSON={selectedResult.result}
                    showSaveButton={false}
                    showReAnalyzeButton={true}
                    onReAnalyze={(e) => handleReAnalyze(e, selectedResult.sentence)}
                  />
                ) : activeDetailTab.startsWith('trans_') ? (
                  <ReadingAssistant
                    responseJSON={selectedResult.translateResults.find(t => `trans_${t.targetLang}` === activeDetailTab)?.analysis}
                    showSaveButton={false}
                    showReAnalyzeButton={false}
                  />
                ) : (
                  <div className="split-view-container">
                    <div className="split-pane">
                      <h4 className="split-pane-title">Original (English)</h4>
                      <ReadingAssistant
                        responseJSON={selectedResult.result}
                        showSaveButton={false}
                        showReAnalyzeButton={true}
                        onReAnalyze={(e) => handleReAnalyze(e, selectedResult.sentence)}
                      />
                    </div>
                    <div className="split-pane">
                      <h4 className="split-pane-title">Translation ({selectedResult.translateResults[0].targetLang.toUpperCase()})</h4>
                      <ReadingAssistant
                        responseJSON={selectedResult.translateResults[0].analysis}
                        showSaveButton={false}
                        showReAnalyzeButton={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ReadingAssistant
              responseJSON={selectedResult.result}
              showSaveButton={false}
              showReAnalyzeButton={true}
              onReAnalyze={(e) => handleReAnalyze(e, selectedResult.sentence)}
            />
          )}
        </div>
      ) : (
        loading ? (
          <div className="dots-container">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
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
                      <div className="header-badges">
                        {item.translateResults && item.translateResults.length > 0 && (
                          <span className="translation-badge" title="Translated Languages">
                            🌐 {item.translateResults.map(t => t.targetLang.toUpperCase()).join(', ')}
                          </span>
                        )}
                        <span className="sentence-count">{item.result?.length || 0} sents</span>
                      </div>
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
                <button onClick={loadMoreAnalyses} disabled={loading} className="load-more-btn">
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>)
      )}
    </div>
  );
}

export default SavedResults;
