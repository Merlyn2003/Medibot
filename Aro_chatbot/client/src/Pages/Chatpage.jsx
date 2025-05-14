import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import sendIcon from '../Components/Assest/sendIcon.png';
import { Link } from 'react-router-dom';
import mic from '../Components/Assest/mic.png';
import profileImg from "../Components/Assest/profile.png";
import "./Chatpage.css";
import readAloudIcon from "../Components/Assest/readaloud.png";
import sidebarClose from "../Components/Assest/sidebarClose.png";
import sidebarOpen from "../Components/Assest/sidebarOpen.png";
import copyIcon from "../Components/Assest/copy.png";
import { Send, Mic, Pill } from 'lucide-react';
import axios from 'axios';

function Chatpage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBoxRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [botResponse, setBotResponse] = useState(null); // State to hold the bot's answer
  const elementRef = useRef(null);
  const [placeholder, setPlaceholder] = useState('Type your message...');
  const [mode, setMode] = useState('chat');
  const [expandedSections, setExpandedSections] = useState({});

const toggleReadMore = (sectionId) => {
  setExpandedSections(prev => ({
    ...prev,
    [sectionId]: !prev[sectionId]
  }));
};
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
  if (botResponse) {
    const botMessage = {
      type: 'bot',
      text: botResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHTML: mode === 'drugs'
    };
    
    setMessages((prevMessages) => [...prevMessages, botMessage]);
    setLoading(false);
    setBotResponse(null);
    
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }
}, [botResponse, mode]);

  const readAloud = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };
  
  const DrugInfoMessage = ({ drugData, expandedSections, toggleReadMore }) => {
  return (
    <div className="drug-info">
      <div className="drug-header">
        <h3>{drugData.brandName || drugData.genericName}</h3>
        {drugData.brandName && drugData.genericName && 
          <p className="generic-name">({drugData.genericName})</p>}
      </div>
      
      <div className="drug-meta">
        <p><strong>Manufacturer:</strong> {drugData.manufacturer || 'Not specified'}</p>
        {drugData.dosageForm && 
          <p><strong>Dosage Form:</strong> {drugData.dosageForm}</p>}
      </div>
      
      <div className="drug-section">
        <h4>Indications:</h4>
        <p>{expandedSections[drugData.sectionIds.indicationsId] ? drugData.indications.full : drugData.indications.short}</p>
        {drugData.indications.isLong && (
          <button 
            onClick={() => toggleReadMore(drugData.sectionIds.indicationsId)}
            className="read-more-btn"
          >
            {expandedSections[drugData.sectionIds.indicationsId] ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>
      
      {drugData.warnings && (
        <div className="drug-section warning">
          <h4><strong>** Warnings:**</strong></h4>
          <p>{expandedSections[drugData.sectionIds.warningsId] ? drugData.warnings.full : drugData.warnings.short}</p>
          {drugData.warnings.isLong && (
            <button 
              onClick={() => toggleReadMore(drugData.sectionIds.warningsId)}
              className="read-more-btn"
            >
              {expandedSections[drugData.sectionIds.warningsId] ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
      )}
      
      {drugData.adverseReactions && (
        <div className="drug-section">
          <h4>Possible Side Effects:</h4>
          <p>{expandedSections[drugData.sectionIds.reactionsId] ? drugData.adverseReactions.full : drugData.adverseReactions.short}</p>
          {drugData.adverseReactions.isLong && (
            <button 
              onClick={() => toggleReadMore(drugData.sectionIds.reactionsId)}
              className="read-more-btn"
            >
              {expandedSections[drugData.sectionIds.reactionsId] ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
      )}
      
      <div className="drug-footer">
        <a href={drugData.fdaLabelLink} target="_blank" rel="noopener noreferrer">
          View Full FDA Label
        </a>
      </div>
    </div>
  );
};
  

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const startListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  };


 
const sendMessage = useCallback(async (text) => {
 if (text.trim()) {
    const newMessage = {
      type: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');
    setLoading(true);

    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }

      try {
      if (mode === 'drugs') {
        const response = await axios.get('http://localhost:4000/api/drugs/fda', {
          params: { drugName: text }
        });
        
       const drugData = response.data;
        const indications = formatDrugText(drugData.indications);
        const warnings = formatDrugText(drugData.warnings);
        const adverseReactions = formatDrugText(drugData.adverseReactions);
        
        // Generate unique IDs for each expandable section
        const indicationsId = `indications-${Date.now()}`;
        const warningsId = `warnings-${Date.now()}`;
        const reactionsId = `reactions-${Date.now()}`;

       // Store the raw data in the message
        const botMessage = {
          type: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDrugInfo: true,
          drugData: {
            brandName: drugData.brandName,
            genericName: drugData.genericName,
            manufacturer: drugData.manufacturer,
            dosageForm: drugData.dosageForm,
            fdaLabelLink: drugData.fdaLabelLink,
            indications,
            warnings,
            adverseReactions,
            sectionIds: {
              indicationsId,
              warningsId,
              reactionsId
            }
          }
        };

        setMessages((prevMessages) => [...prevMessages, botMessage]);
        setLoading(false);
      } else {
        // Handle normal chat request
        const messagePayload = { query: text };
        const response = await fetch('https://3f6b-171-79-59-118.ngrok-free.app/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messagePayload),
        });
        const data = await response.json();
        setBotResponse(data?.answer || "Sorry, I didn't get a clear response.");
      }
    } catch (error) {
      console.error('Error:', error);
      setBotResponse(mode === 'drugs' 
        ? "Sorry, I couldn't retrieve drug information. Please check the drug name and try again." 
        : "Sorry, there was an error communicating with the server.");
    }
  }
}, [mode, chatBoxRef]);

const formatDrugText = (text, maxLength = 200) => {
  if (!text) return { short: 'Information not available', full: 'Information not available', isLong: false };
  
  // Clean up the text
  const cleanedText = text
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (cleanedText.length <= maxLength) {
    return { short: cleanedText, full: cleanedText, isLong: false };
  }
  
  const shortText = cleanedText.substring(0, maxLength) + '...';
  const fullText = cleanedText;
  
  return {
    short: shortText,
    full: fullText,
    isLong: true
  };
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(input);
    }
  };

  const botAnswer = {
    "answer": "Hello! This is the ARO Chatbot. How can I assist you today?"
  };

  return (
    <div className="flex h-screen">
      {isSidebarOpen && <Sidebar />}

      <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-3/4' : 'w-full'} mx-auto max-w-5xl p-6`}>
        <header className="bg-white">
          <nav className="mx-auto flex items-center justify-between p-2 lg:px-5" aria-label="Global">
            <Link to='/' className="text-gray-500 italic uppercase text-lg font-bold">ARO</Link>
            <button
              className="bg-transparent p-3 rounded-full text-white hover:bg-blue-600"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (<img className="h-5 w-5" src={sidebarOpen} alt="sideBar open" />) : (<img className="h-5 w-5" src={sidebarClose} alt="sideBar open" />)}
            </button>
          </nav>
        </header>

        <main className="flex-grow bg-white bg-cover bg-center overflow-y-auto p-4" ref={chatBoxRef}>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              {message.type === 'bot' && (
  <div className="flex items-start gap-1.5">
    <img src={profileImg} alt="Bot Icon" className="h-8 w-8 rounded-full mr-2" />
    <div className="flex flex-col gap-1 w-full max-w-[480px]">
     <div className="flex items-center space-x-2">
        <span className="text-sm font-semibold text-gray-900">Aro Bot</span>
        <span className="text-sm font-normal text-gray-500">{message.time}</span>
      </div>
      <div className="flex flex-col p-4 rounded-e-xl rounded-es-xl ">
        {message.isDrugInfo ? (
          <DrugInfoMessage 
            drugData={message.drugData}
            expandedSections={expandedSections}
            toggleReadMore={toggleReadMore}
          />
        ) : (
          <p className="text-sm font-normal text-gray-900">{message.text}</p>
        )}
      </div>
      <div className='flex item-center'>
        <button className="bg-transparent p-2 rounded-full text-gray-500 hover:text-blue-600" onClick={() => readAloud(message.text)}>
          <img
            src={readAloudIcon}
            alt="Read Aloud"
            className="h-4 w-4 cursor-pointer"
          />
        </button>
        <button className="bg-transparent p-2 rounded-full text-gray-500 hover:text-blue-600" onClick={() => copyToClipboard(message.text)}>
          <img
            src={copyIcon}
            alt="Copy"
            className="h-4 w-4 cursor-pointer"
          />
        </button>
      </div>
    </div>
  </div>
)}

              {message.type === 'user' && (
                <div className="flex justify-end items-start gap-2.5" ref={elementRef}>
                  <div className="flex flex-col gap-1 w-full max-w-[320px]">
                    <div className="flex items-center space-x-2 justify-end">
                      <span className="text-sm font-semibold text-gray-900">You</span>
                      <span className="text-sm font-normal text-gray-500">{message.time}</span>
                    </div>
                    <div className="flex flex-col leading-1.5 p-3 border-gray-200 bg-blue-500 text-white rounded-s-xl rounded-se-xl"> {/* Changed background for user messages */}
                      <p className="text-sm font-normal">{message.text}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <img src={profileImg} alt="Bot Icon" className="h-8 w-8 rounded-full mr-2" />
              <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
            </div>
          )}
          {/* Display the static bot answer */}
          {!loading && messages.length === 0 && (
            <div className="flex justify-start mb-4">
              <img src={profileImg} alt="Bot Icon" className="h-8 w-8 rounded-full mr-2" />
              <div className="flex flex-col gap-1 w-full max-w-[420px]">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">Aro Bot</span>
                </div>
                <div className="flex flex-col p-4 rounded-e-xl rounded-es-xl bg-gray-100">
                  <p className="text-sm font-normal text-gray-900">{botAnswer.answer}</p>
                </div>
                <div className='flex item-center'>
                  <button className="bg-transparent p-2 rounded-full text-gray-500 hover:text-blue-600" onClick={() => readAloud(botAnswer.answer)}>
                    <img
                      src={readAloudIcon}
                      alt="Read Aloud"
                      className="h-4 w-4 cursor-pointer"
                    />
                  </button>
                  <button className="bg-transparent p-2 rounded-full text-gray-500 hover:text-blue-600" onClick={() => copyToClipboard(botAnswer.answer)}>
                    <img
                      src={copyIcon}
                      alt="Copy"
                      className="h-4 w-4 cursor-pointer"
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
<footer className="bg-white py-3 px-4 sm:px-6 transition-all duration-200 shadow-sm">
  <div className="max-w-4xl mx-auto">
    <div className="flex items-center gap-2">
      <div className="relative flex-grow">
        <input
          type="text"
          className="w-full border border-gray-200 rounded-full px-4 py-2.5 pr-10 
                     focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                     transition-all duration-200 bg-gray-50"
          placeholder={mode === 'drugs' ? "Please enter only drug names" : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
      
      {/* Send Button - Now properly shows gray when inactive */}
      <button 
        className={`p-2.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200
                   ${input ? 'text-blue-500 bg-blue-50' : 'text-gray-400 bg-transparent hover:bg-gray-50 hover:border-gray-300'}`}
        onClick={() => sendMessage(input)}
        aria-label="Send message"
        disabled={!input}
      >
        <Send className="h-5 w-5" />
      </button>
      
      {/* Mic Button - Always shows gray with hover state */}
<button 
  className="p-2.5 rounded-full bg-white text-gray-500 hover:text-gray-600 hover:bg-gray-50
             transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
  onClick={startListening}
  aria-label="Voice input"
>
  <Mic className="h-5 w-5" />
</button>
      {/* Drugs Button - Maintains existing good behavior */}
  
      <button
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 
                   bg-white border border-gray-200 rounded-full px-4 py-2
                   hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-gray-200"
        aria-label="Show drugs information"
        onClick={() => {
    setMode((prevMode) => prevMode === 'drugs' ? 'normal' : 'drugs');
    setBotResponse(''); // Optional: clear previous response
  }}
      >
        <Pill className="h-4 w-4 text-blue-500" />
        <span>{mode === 'drugs' ? 'Back to Chat' : 'Drugs'}</span>
      </button>
    </div>
  </div>
</footer>
      </div>
    </div>
  );
}

export default Chatpage;