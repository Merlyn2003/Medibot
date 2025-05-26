// src/HealthAdvice.js
import React, { useState } from 'react';

const HealthAdvice = () => {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/health-advice');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setAdvice(data.advice);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Random Health Advice</h1>
      <h2 style={{ 
        fontWeight: 'bold', 
        fontSize: '24px', 
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        color: '#333' // Optional: Add color if desired
      }}>
        {advice || 'Click the button to get advice'}
      </h2>
      <br />
      <button onClick={fetchAdvice} style={{ padding: '10px 20px' }}>
        Get Health Advice
      </button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default HealthAdvice;

