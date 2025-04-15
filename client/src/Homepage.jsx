import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const backgroundRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!vantaEffectRef.current && window.VANTA && window.VANTA.WAVES && backgroundRef.current) {
      vantaEffectRef.current = window.VANTA.WAVES({
        el: backgroundRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x5a4ff,
        shininess: 60,
        waveHeight: 20,
        waveSpeed: 0.65,
        zoom: 0.9
      });
      
      // Set loaded state after a small delay for animation purposes
      setTimeout(() => {
        setLoaded(true);
      }, 300);
    }

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, []);

  const handleContinue = () => {
    navigate('/app');
  };

  return (
    <div ref={backgroundRef} className="homepage-container">
      <div className={`content-container ${loaded ? 'loaded' : ''}`}>
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L3 9L12 14L21 9L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 14L12 19L21 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="project-title">BlockVote</h1>
        </div>
        
        <h2 className="welcome-text">Welcome to the Future of Voting</h2>
        
        <p className="description">
          Secure, transparent, and immutable voting powered by blockchain technology.
          Your vote is your voice - we ensure it counts.
        </p>
        
        <div className="features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>Secure</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👁️</span>
            <span>Transparent</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Fast</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔗</span>
            <span>Decentralized</span>
          </div>
        </div>
        
        <button onClick={handleContinue} className="get-started-btn">
          <span>Get Started</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
        
        <div className="powered-by">
          Powered by Ethereum Blockchain
        </div>
      </div>
    </div>
  );
};

export default Homepage;
