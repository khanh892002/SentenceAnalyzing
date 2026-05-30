import { useState } from 'react';
import './FeedbackWidget.css';

function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');

  const toggleWidget = () => setIsOpen(!isOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Feedback submitted:", { email, feedback });
    setFeedback('');
    setEmail('');
    setIsOpen(false);
    alert('Thank you for your feedback!');
  };

  return (
    <div className="feedback-widget">
      {isOpen ? (
        <div className="feedback-dialog">
          <div className="feedback-header">
            <h3>Feedback</h3>
            <button className="minimize-btn" onClick={toggleWidget}>-</button>
          </div>
          <form onSubmit={handleSubmit} className="feedback-form">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="feedback-email-input"
            />
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think..."
              required
            />
            <button type="submit" className="submit-feedback-btn">Submit</button>
          </form>
        </div>
      ) : (<button className="feedback-icon-btn" onClick={toggleWidget} title="Send Feedback">💬</button>)}
    </div>
  );
}

export default FeedbackWidget;
