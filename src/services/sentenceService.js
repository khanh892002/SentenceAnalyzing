const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const analyzeSentence = async (sentence) => {
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sentence })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to analyze sentence.');
  }

  return response.json();
}; 