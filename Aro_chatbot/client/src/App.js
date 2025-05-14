import React from 'react';
import './App.css';
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Landing from './Pages/Landing.jsx';
import Chatpage from './Pages/Chatpage.jsx';
import LoginSignup from './Pages/LoginSignup.jsx';
import Info from './Pages/info.tsx'
import HealthAdvice from './Components/Sidebar/HealthAdvice.jsx';
import News from "./Components/News/News.tsx"
import AddressTable from './Pages/addressTable.jsx';


function App() {
  return (
    <BrowserRouter>
    <div >
    
     <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/Chat' element={<Chatpage/>}/>
      <Route path='/welcome' element={<LoginSignup/>}/>
      <Route path='/Info' element={<Info/>}/>
      <Route path='/News' element={<News/>}/>
      <Route path='/HealthAdvice' element={<HealthAdvice/>}/>
      <Route path='/address-table' element={<AddressTable/>}/>
     </Routes>
    </div>
    </BrowserRouter>
  );
}

export default App;
