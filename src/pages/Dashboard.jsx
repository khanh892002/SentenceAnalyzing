import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeSentence } from '../services/sentenceService';
import ExamplesList from '../components/ExamplesList';
import PosLegend from '../components/PosLegend';
import ReadingAssistant from '../components/ReadingAssistant';
import { auth, db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './Dashboard.css';

function Dashboard() {
  const location = useLocation();
  const [sentence, setSentence] = useState(location.state?.textToAnalyze || '');
  const [responseJSON, setResponseJSON] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('vi');
  const [translatedText, setTranslatedText] = useState('');
  const [translationResponseJSON, setTranslationResponseJSON] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState('original');
  const navigate = useNavigate();

  const handleCursorMove = (e) => {
    setCursorIndex(e.target.selectionStart || 0);
  };

  const handleTranslate = async () => {
    if (!sentence.trim()) return;
    try {
      setTranslating(true);
      setError(null);

      // Automatically run analysis on original text if not already done
      let finalSentence = sentence.trim();
      if (!/[.?!…]$/.test(finalSentence)) {
        finalSentence += '.';
        setSentence(finalSentence);
      }

      if (!responseJSON) {
        setLoading(true);
        const englishResult = await analyzeSentence(finalSentence, sourceLang);
        setResponseJSON(englishResult);
        setLoading(false);
      }

      // Mock translation lookup
      let mockTranslation = `Đây là bản dịch mô phỏng của câu: "${finalSentence}"`;
      const lowerSentence = finalSentence.toLowerCase().replace(/[.?!]$/, '');
      if (lowerSentence === "he said she is happy") {
        mockTranslation = "Anh ấy nói cô ấy đang hạnh phúc.";
      } else if (lowerSentence === "if you are going to the party, please let me know") {
        mockTranslation = "Nếu bạn định đi dự tiệc, xin vui lòng cho tôi biết.";
      }

      setTranslatedText(mockTranslation);

      // Create a mock syntax tree of the translation for compare tab rendering
      const mockTransTree = [
        {
          "role": "ROOT",
          "type": "phrase",
          "pos": "VERB",
          "content": [
            { "role": "nsubj", "type": "word", "text": "Bản dịch", "pos": "NOUN" },
            { "role": "head", "type": "word", "text": "đối chiếu", "pos": "VERB" },
            {
              "role": "dobj",
              "type": "bracket_group",
              "pos": "PUNCT",
              "content": [
                { "role": "punct", "type": "word", "text": "“", "pos": "PUNCT" },
                { "role": "dep", "type": "word", "text": mockTranslation, "pos": "NOUN" },
                { "role": "punct", "type": "word", "text": "”", "pos": "PUNCT" }
              ]
            }
          ]
        }
      ];
      setTranslationResponseJSON(mockTransTree);
      setActiveTab('split'); // Auto show split view when translated
    } catch (err) {
      console.error("Translation error", err);
      setError("Failed to translate or analyze original text.");
      setLoading(false);
    } finally {
      setTranslating(false);
    }
  };


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
            const parsedPending = JSON.parse(pending);
            const {
              sentence: pendingSentence,
              result: pendingResult,
              translatedText: pTransText,
              translationResponseJSON: pTransTree,
              targetLang: pTargetLang
            } = parsedPending;

            let pTranslateResults = [];
            if (pTransText && pTransTree) {
              pTranslateResults = [{
                targetLang: pTargetLang || 'vi',
                content: pTransText,
                analysis: pTransTree
              }];
            }

            addDoc(collection(db, 'analyses'), {
              uid: currentUser.uid,
              sentence: pendingSentence,
              result: JSON.stringify(pendingResult, null, 0),
              createdAt: serverTimestamp(),
              isPublic: false,
              version: "1.0",
              lang: "en",
              translateResults: pTranslateResults
            }).then(() => {
              sessionStorage.removeItem('pendingAnalysis');
              setSentence(pendingSentence);
              setResponseJSON(pendingResult);
              if (pTransText) {
                setTranslatedText(pTransText);
                setTranslationResponseJSON(pTransTree);
                if (pTargetLang) setTargetLang(pTargetLang);
                setActiveTab('split');
              }
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

    if ((finalSentence.match(/"/g) || []).length & 1) {
      setError("The number of double quotes is odd.");
      return;
    }

    // Biểu thức kiểm tra dấu ngoặc kép kẹp giữa 2 ký tự (chữ hoặc số)
    // \p{L} bao gồm tất cả các chữ cái trong Unicode (có tiếng Việt)
    // \p{N} bao gồm các chữ số
    const suspiciousQuoteRegex = /([\p{L}\p{N}])"([\p{L}\p{N}])/u;

    // dấu ngoặc bị cô lập (đứng giữa 2 khoảng trắng)
    const isolatedQuoteRegex = /\s["']\s/;

    if (suspiciousQuoteRegex.test(finalSentence)) {
      setError("There is a double quote surrounded with characters.");
      return;
    }
    if (isolatedQuoteRegex.test(finalSentence)) {
      setError("There is a double quote isolated with spaces.");
      return;
    }

    // Regex: Bắt đầu chuỗi, hoặc các khoảng trắng, ngoặc mở, dấu gạch ngang, dấu chấm
    finalSentence = finalSentence.replace(/(^|[\s\(\[{\[\-_\.])"/g, '$1“');
    finalSentence = finalSentence.replace(/"/g, '”');

    function validateBracketsAndQuotes(text) {
      const stack = [];

      // Từ điển ánh xạ dấu đóng với dấu mở tương ứng
      const bracketMap = { ')': '(', ']': '[', '}': '{', '”': '“' };

      const openBrackets = Object.values(bracketMap);
      const closeBrackets = Object.keys(bracketMap);

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (openBrackets.includes(char)) {
          stack.push({ char, index: i });
        }
        else if (closeBrackets.includes(char)) {
          if (stack.length === 0) {
            return { isValid: false, error: `Spare a closing mark '${char}' at index ${i}.` };
          }

          const lastOpen = stack.pop();
          if (bracketMap[char] !== lastOpen.char) {
            return { isValid: false, error: `Mismatch in nested structure: opened '${lastOpen.char}' but closed with '${char}' at index ${i}.` };
          }
        }
      }

      if (stack.length > 0) {
        const unclosed = stack.pop();
        return {
          isValid: false, error: `Miss a closing mark '${unclosed.char}' at index ${unclosed.index}.`
        };
      }

      return { isValid: true, error: null };
    }

    const validation = validateBracketsAndQuotes(finalSentence);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const responseData = await analyzeSentence(finalSentence, sourceLang);
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
          sessionStorage.setItem('pendingAnalysis', JSON.stringify({
            sentence,
            result: responseJSON,
            translatedText,
            translationResponseJSON,
            targetLang
          }));
        }
        navigate('/login');
      }
      return;
    }

    if (responseJSON && sentence) {
      try {
        const analysesRef = collection(db, 'analyses');
        const q = query(analysesRef, where('uid', '==', user.uid), where('sentence', '==', sentence.trim()));
        const querySnapshot = await getDocs(q);

        let currentTranslateResults = [];
        if (translatedText && translationResponseJSON) {
          currentTranslateResults = [{
            targetLang,
            content: translatedText,
            analysis: translationResponseJSON
          }];
        }

        if (!querySnapshot.empty) {
          // Document exists: update it
          const existingDoc = querySnapshot.docs[0];
          const existingData = existingDoc.data();
          const docRef = doc(db, 'analyses', existingDoc.id);

          let updatedTranslateResults = existingData.translateResults || [];

          if (translatedText && translationResponseJSON) {
            const index = updatedTranslateResults.findIndex(t => t.targetLang === targetLang);
            if (index !== -1) {
              updatedTranslateResults[index] = currentTranslateResults[0];
            } else {
              updatedTranslateResults.push(currentTranslateResults[0]);
            }
          }

          await updateDoc(docRef, {
            result: JSON.stringify(responseJSON, null, 0),
            translateResults: updatedTranslateResults,
            updatedAt: serverTimestamp()
          });
          alert('Analysis updated successfully!');
        } else {
          // Create new document
          await addDoc(analysesRef, {
            uid: user.uid,
            sentence: sentence.trim(),
            result: JSON.stringify(responseJSON, null, 0),
            createdAt: serverTimestamp(),
            isPublic: false,
            version: "1.0",
            lang: "en",
            translateResults: currentTranslateResults
          });
          alert('Analysis saved successfully!');
        }
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
          <div className="language-selector-bar">
            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="lang-select">
              <option value="en">English</option>
              <option value="vi" disabled>Vietnamese (Disabled)</option>
            </select>
            <span className="lang-arrow">➔</span>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="lang-select">
              <option value="vi">Vietnamese</option>
              <option value="en" disabled>English (Disabled)</option>
            </select>
          </div>

          <textarea
            value={sentence}
            onChange={(e) => {
              setSentence(e.target.value);
              handleCursorMove(e);
            }}
            onClick={handleCursorMove}
            onKeyUp={handleCursorMove}
            onFocus={handleCursorMove}
            onKeyDown={handleKeyDown}
            placeholder="Enter a sentence or paragraph here to analyze..."
            className="sentence-textarea"
          />
          <div className="cursor-index-indicator">
            <span>Cursor: {cursorIndex}</span>
            <span>Total: {sentence.length}</span>
          </div>

          {translatedText && (
            <div className="translation-result-container">
              <div className="translation-header">
                <span>Translation (Vietnamese):</span>
                <button
                  type="button"
                  onClick={() => {
                    setTranslatedText('');
                    setTranslationResponseJSON(null);
                    setActiveTab('original');
                  }}
                  className="clear-translation-btn"
                  title="Clear translation"
                >
                  &times;
                </button>
              </div>
              <div className="translation-result-text">
                {translatedText}
              </div>
            </div>
          )}
        </div>

        <div className="center-panel">
          <button onClick={handleSubmit} className="analyze-button" disabled={loading || !sentence.trim()}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            onClick={handleTranslate}
            className="translate-button"
            disabled={translating || !sentence.trim() || sourceLang !== 'en' || sourceLang === targetLang}
          >
            {translating ? 'Translating...' : 'Translate'}
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
            <div className="analysis-tabs-wrapper">
              {translationResponseJSON && (
                <div className="analysis-tabs-header">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                    onClick={() => setActiveTab('original')}
                  >
                    Original (English)
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'translation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('translation')}
                  >
                    Translation (Vietnamese)
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'split' ? 'active' : ''}`}
                    onClick={() => setActiveTab('split')}
                  >
                    Side-by-Side
                  </button>
                </div>
              )}

              <div className="tab-content">
                {activeTab === 'original' || !translationResponseJSON ? (
                  <ReadingAssistant
                    responseJSON={responseJSON}
                    onSave={handleSaveAnalysis}
                    showSaveButton={true}
                  />
                ) : activeTab === 'translation' ? (
                  <ReadingAssistant
                    responseJSON={translationResponseJSON}
                    showSaveButton={false}
                  />
                ) : (
                  <div className="split-view-container">
                    <div className="split-pane">
                      <h4 className="split-pane-title">Original (English)</h4>
                      <ReadingAssistant
                        responseJSON={responseJSON}
                        onSave={handleSaveAnalysis}
                        showSaveButton={true}
                      />
                    </div>
                    <div className="split-pane">
                      <h4 className="split-pane-title">Translation (Vietnamese)</h4>
                      <ReadingAssistant
                        responseJSON={translationResponseJSON}
                        showSaveButton={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
