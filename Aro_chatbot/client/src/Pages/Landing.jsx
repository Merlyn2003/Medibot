import React, { useEffect } from 'react';
import ScrollReveal from 'scrollreveal';
import main from '../Components/Assest/main-front.jpg';
import mainLeft from '../Components/Assest/topping1.jpg';
import Footer from '../Components/Footer/Footer';
import Navbar from '../Components/Navbar/Navbar';
import { Link } from 'react-router-dom';
import './Landing.css'; // Keep your existing Landing.css for Landing section


const Landing = () => {

  // Scroll reveal effect for the about section
  useEffect(() => {
    ScrollReveal().reveal('.reveal', { delay: 500, distance: '70px', origin: 'bottom' });
  }, []);

  return (
    <div className="min-h-screen w-full">
      <Navbar/>
      {/* Landing Section */}
      <div className="landing-page">
        <div className="content">
          <div className="container">
            <div className="info">
              <h1>Innovative care for a healthier you</h1>
              <p>
                <strong>
                  அன்புற்று அமர்ந்த வழக்கென்ப வையகத்து
                  <br />
                  இன்புற்றார் எய்தும் சிறப்பு.
                  <br />
                </strong>
                Sweetness on earth and rarest bliss above, These are the fruits of tranquil life of love
              </p>
              <button type="button" class="rounded-full text-gray-900 bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
              <Link to='Chat' className="text-white" style={{ textDecoration: 'none' }}>
               Try Now
              </Link>
                </button>
            </div>
            <div className="image reveal">
              <img src={main} alt="toppings" />
            </div>
          </div>
        </div>
        
      </div>

      {/* About Us Section */}
      <div id="about-us-section" className="reveal bg-white-100 py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">About Us</h1>
          <p className="text-gray-600 mb-4">
            Welcome to <span className="text-blue-600 font-semibold">Aro</span>, your reliable companion for personalized healthcare information and support.
          </p>
          <p className="text-gray-600 mb-4">
            At Aro, we are committed to improving your well-being through intelligent, compassionate, and accurate assistance.
          </p>
          <ul className="list-none space-y-2 text-gray-600 mb-6">
            <li><strong>24/7 Support:</strong> Access health information and support any time of the day.</li>
            <li><strong>Personalized Guidance:</strong> Get advice tailored to your unique health needs and concerns.</li>
            <li><strong>Reliable Information:</strong> Receive information based on the latest medical research and best practices.</li>
          </ul>
          <p className="text-gray-600">
            Our mission is to empower you with knowledge and support, helping you make informed decisions about your health. Thank you for choosing Aro. We are here to support you on your journey to better health!
          </p>
        </div>
        <img className="toppings-bg-left" src={mainLeft} alt="toppings" />
      </div>
      <Footer/>
    </div>
  );
};

export default Landing;
