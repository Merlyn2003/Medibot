import React, { useState } from 'react';
import { Heart, Brain, Pill, Calendar, Shield, ChevronDown, ExternalLink } from 'lucide-react';
import './info.css';
import Navbar from '../Components/Navbar/Navbar';

const Info = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="info-page">
      <Navbar/>
      <div className="info-hero">
        <div className="info-hero-content">
          <h1 className="info-title">Welcome to Aro!</h1>
          <p className="info-subtitle">Your Intelligent Health Companion</p>
        </div>
      </div>

      <div className="info-container">
        <section className="info-section what-is-aro">
          <h2>What is Aro?</h2>
          <p>
            Aro is your advanced healthcare companion, powered by sophisticated AI technology.
            We're dedicated to providing reliable health information, personalized guidance,
            and round-the-clock support for all your health-related needs.
          </p>
        </section>

        <section className="info-section features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <Heart className="feature-icon" />
              <h3>Disease Info</h3>
              <p>Verified and comprehensive overview on diseases, symptoms and their treatment</p>
            </div>
            <div className="feature-card">
              <Pill className="feature-icon" />
              <h3>Medication Info</h3>
              <p>Comprehensive details about medications and potential interactions</p>
            </div>
            <div className="feature-card">
              <Brain className="feature-icon" />
              <h3>Nearby hospital Finder</h3>
              <p>Support finding nearby hospital based on location</p>
            </div>
            <div className="feature-card">
              <Calendar className="feature-icon" />
              <h3>News</h3>
              <p>Latest news curated specifically for medical domain</p>
            </div>
          </div>
        </section>

        <section className="info-section how-it-works">
          <h2>How It Works</h2>
          <div className="steps-container">
            {['Ask', 'Analyze', 'Assist'].map((step, index) => (
              <div key={step} className="step-card">
                <div className="step-number">{index + 1}</div>
                <h3>{step}</h3>
                <p>
                  {index === 0 && "Share your health concerns or questions with Aro"}
                  {index === 1 && "Our AI processes your input using medical knowledge"}
                  {index === 2 && "Receive accurate, personalized health guidance"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section faq">
          <h2>Common Questions</h2>
          <div className="faq-container">
            {[
              {
                question: "Is my data secure?",
                answer: "Yes! We employ industry-leading encryption and strict privacy protocols to ensure your health information remains confidential."
              },
              {
                question: "When should I use Aro?",
                answer: "Aro is available 24/7 for general health queries, symptom checking, and wellness advice. However, always seek emergency care for urgent medical situations."
              },
              {
                question: "How accurate is the information?",
                answer: "Aro's responses are based on current medical research and guidelines, regularly updated by healthcare professionals. However, always consult with a doctor for personal medical advice."
              }
            ].map((item, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeSection === `faq-${index}` ? 'active' : ''}`}
                onClick={() => toggleSection(`faq-${index}`)}
              >
                <div className="faq-question">
                  <h3>{item.question}</h3>
                  <ChevronDown className={`faq-icon ${activeSection === `faq-${index}` ? 'rotated' : ''}`} />
                </div>
                <div className={`faq-answer ${activeSection === `faq-${index}` ? 'expanded' : ''}`}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section cta">
          <div className="cta-content">
            <Shield className="cta-icon" />
            <h2>Ready to Take Control of Your Health?</h2>
            <p>Start chatting with Aro now and discover personalized health insights.</p>
            <button className="cta-button">
              Get Started
              <ExternalLink size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Info;