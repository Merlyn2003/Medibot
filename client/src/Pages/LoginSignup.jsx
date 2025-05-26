  import React ,{useState} from 'react';
  import axios from 'axios';
  import { useNavigate } from 'react-router-dom';  // Import useNavigate
  import './LoginSignup.css';
  import Navbar from '../Components/Navbar/Navbar';
  
  const LoginSignup = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
    });
    const navigate = useNavigate();  // Initialize useNavigate
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value,
      });
    };
  
    const handleSignUp = async (e) => {
      e.preventDefault();
      try {
        await axios.post('http://localhost:4000/signup', formData);
        setIsSignUp(false); // Switch to Sign In view
      } catch (error) {
        console.error('Sign Up failed:', error.response?.data || error.message);
        alert('Sign Up failed');
      }
    };
  
    const handleSignIn = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('http://localhost:4000/login', {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem('token', response.data.token);
        alert('Sign In successful');
        navigate('/Chat');  // Redirect to chat page
      } catch (error) {
        alert('Sign In failed');
      }
    };
    
  
    return (
      <div>
        <Navbar/>
        
        <div className={`container-login ${isSignUp ? 'right-panel-active' : ''}`} id="container">
          <div className="form-container sign-up-container">
            <form onSubmit={handleSignUp}>
              <h1>Create Account</h1>
              <div className="social-container">
                <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>
              <span>or use your email for registration</span>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button type="submit">Sign Up</button>
            </form>
          </div>
          <div className="form-container sign-in-container">
            <form onSubmit={handleSignIn}>
              <h1>Sign in</h1>
              <div className="social-container">
                <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>
              <span>or use your account</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <a href="#">Forgot your password?</a>
              <button type="submit">Sign In</button>
            </form>
          </div>
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>To keep connected with us please login with your personal info</p>
                <button className="ghost" onClick={() => setIsSignUp(false)}>Sign In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hello, Friend!</h1>
                <p>Enter your personal details and start your journey with us</p>
                <button className="ghost" onClick={() => setIsSignUp(true)}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default LoginSignup;


  
  
