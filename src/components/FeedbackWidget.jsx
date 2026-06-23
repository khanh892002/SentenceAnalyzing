import { useState } from 'react';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import './FeedbackWidget.css';

function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const charCountLimit = 1000;

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setErrorMsg('');
      setIsSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedback.length > charCountLimit) {
      setErrorMsg(`Feedback must be less than ${charCountLimit} characters.`);
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const feedbackRef = collection(db, 'feedbacks');
      await addDoc(feedbackRef, {
        email,
        feedback,
        createdAt: serverTimestamp()
      });
      setFeedback('');
      setEmail('');
      setIsSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
      }, 2000);

    } catch (err) {
      setErrorMsg('Failed to submit feedback. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-widget">
      {isOpen ? (
        <div className="feedback-dialog">
          <div className="feedback-header">
            <h3>Feedback</h3>
            <button className="minimize-btn" onClick={toggleWidget}>-</button>
          </div>
          {isSuccess ? (
            <div className="feedback-success-animation">
              <div className="checkmark-circle">
                <svg viewBox="0 0 60 60" style={{ width: '100%', height: '100%' }}>
                  <path className="checkmark-check" fill="none" stroke="#2ecc71" strokeWidth="4" d="M14 30 l10 10 l22 -22" />
                </svg>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="feedback-email-input"
              />
              <div className="feedback-textarea-container">
                <textarea
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    if (e.target.value.length <= charCountLimit) {
                      setErrorMsg('');
                    }
                  }}
                  placeholder="Tell us what you think..."
                  required
                  className="feedback-textarea"
                />
                <div className="feedback-text-counter">
                  {feedback.length} / {charCountLimit}
                </div>
              </div>

              {errorMsg && <div className="feedback-error-message">{errorMsg}</div>}

              <button type="submit" className="submit-feedback-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <button className="feedback-icon-btn" onClick={toggleWidget} title="Send Feedback">💬</button>
      )}
    </div>
  );
}

export default FeedbackWidget;
