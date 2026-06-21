import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeSentence } from '../services/sentenceService';
import ExamplesList from '../components/ExamplesList';
import PosLegend from '../components/PosLegend';
import ReadingAssistant from '../components/ReadingAssistant';
import { auth, db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './Dashboard.css';

function Dashboard() {
  const location = useLocation();
  const [sentence, setSentence] = useState(location.state?.textToAnalyze || '');
  const [responseJSON, setResponseJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Clear the state so it doesn't auto-fill again on refresh
  useEffect(() => {
    if (location.state?.textToAnalyze) {
      navigate('/', { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Check for pending analysis to save after login
      if (currentUser) {
        const pending = sessionStorage.getItem('pendingAnalysis');
        if (pending) {
          try {
            const { sentence: pendingSentence, result: pendingResult } = JSON.parse(pending);
            addDoc(collection(db, 'analyses'), {
              uid: currentUser.uid,
              sentence: pendingSentence,
              result: pendingResult,
              createdAt: serverTimestamp(),
              isPublic: false,
              version: "1.0",
              lang: "en"
            }).then(() => {
              sessionStorage.removeItem('pendingAnalysis');
              setSentence(pendingSentence);
              setResponseJSON(pendingResult);
              alert('Bản phân tích của bạn đã được lưu lại thành công sau khi đăng nhập!');
            }).catch(err => {
              console.error('Failed to save pending analysis', err);
            });
          } catch (e) {
            console.error('Error parsing pending analysis', e);
            sessionStorage.removeItem('pendingAnalysis');
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    let finalSentence = sentence.trim();
    if (!finalSentence) return;

    if (!/[.?!…]$/.test(finalSentence)) {
      finalSentence += '.';
      setSentence(finalSentence);
    }

    try {
      setLoading(true);
      setError(null);
      const responseData = await analyzeSentence(finalSentence);
      setResponseJSON(responseData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred. Please try again later.');
    } finally { setLoading(false); }
  };

  const handleSelectExample = (exSentence, exResult) => {
    setSentence(exSentence);
    if (exResult === "loading") {
      setLoading(true);
      setError(null);
      setResponseJSON(null);
    } else {
      setLoading(false);
      if (exResult === null) {
        setError('Failed to analyze example sentence.');
        setResponseJSON(null);
      } else {
        setError(null);
        setResponseJSON(exResult);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && sentence.trim()) handleSubmit();
    }
  };

  const handleSaveAnalysis = async () => {
    if (!user) {
      if (window.confirm('You must be logged in to save analyses. Go to login page?')) {
        if (responseJSON && sentence) {
          sessionStorage.setItem('pendingAnalysis', JSON.stringify({ sentence, result: responseJSON }));
        }
        navigate('/login');
      }
      return;
    }

    if (responseJSON && sentence) {
      try {
        await addDoc(collection(db, 'analyses'), {
          uid: user.uid,
          sentence: sentence,
          result: responseJSON,
          createdAt: serverTimestamp(),
          isPublic: false,
          version: "1.0",
          lang: "en"
        });
        alert('Analysis saved successfully!');
      } catch (err) {
        console.error('Failed to save analysis', err);
        alert('Failed to save analysis. See console for details.');
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Sentence Structure Analyzer</h2>
      </div>

      <PosLegend />
      <ExamplesList onSelectExample={handleSelectExample} />

      <div className="analyzer-layout">
        <div className="left-panel">
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a sentence or paragraph here to analyze..."
            className="sentence-textarea"
          />
        </div>

        <div className="center-panel">
          <button onClick={handleSubmit} className="analyze-button" disabled={loading || !sentence.trim()}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div className="right-panel">
          {error && <div className="error">{error}</div>}
          {!responseJSON && !error && !loading && (
            <div className="placeholder-result">
              Analysis results will appear here.
            </div>
          )}
          {loading && (
            <div className="skeleton-container">
              <div className="skeleton-line short"></div>
              <div className="skeleton-box"></div>
              <div className="skeleton-line medium" style={{ marginLeft: '20px' }}></div>
              <div className="skeleton-box" style={{ marginLeft: '40px' }}></div>
              <div className="skeleton-line long" style={{ marginLeft: '20px' }}></div>
            </div>
          )}
          {!loading && responseJSON && (
            <ReadingAssistant 
              responseJSON={responseJSON} 
              onSave={handleSaveAnalysis} 
              showSaveButton={true} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
