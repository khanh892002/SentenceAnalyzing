const API_URL = 'http://localhost:3000';

export const analyzeSentence = async (sentence) => {
  const response = await fetch(`${API_URL}/analyze-sentence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sentence })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to analyze sentence: ${errorData.error}`);
  }

  return response.json();
}; 