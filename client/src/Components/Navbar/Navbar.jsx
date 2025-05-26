import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [menu, setMenu] = useState("home");
  return (
    <div className="navbar w-full">
      <header className="bg-white w-full sticky top-0 left-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center py-4">
          <p className="text-gray-500 italic uppercase text-lg font-bold">ARO</p>
          <ul className="flex items-center space-x-6">
            <li onClick={() => { setMenu("home") }}>
              <Link to='/' className="text-gray-700 hover:text-indigo-500 transition duration-300" style={{ textDecoration: 'none' }}>
                Home
              </Link>
              {menu === "home" && <hr className="w-3/5 mt-1 h-1 bg-indigo-500 rounded-full" />}
            </li>
            <li onClick={() => { setMenu("aboutus") }}>
              {menu === "aboutus" && <hr className="w-3/5 mt-1 h-1 bg-indigo-500 rounded-full" />}
            </li>
           
            <li onClick={() => { setMenu("info") }}>
              <Link to='/Info' className="text-gray-700 hover:text-indigo-500 transition duration-300" style={{ textDecoration: 'none' }}>
                Info
              </Link>
              {menu === "info" && <hr className="w-3/5 mt-1 h-1 bg-indigo-500 rounded-full" />}
            </li>
            <li onClick={() => { setMenu("info") }}>
              <Link to='/News' className="text-gray-700 hover:text-indigo-500 transition duration-300" style={{ textDecoration: 'none' }}>
                News
              </Link>
              {menu === "info" && <hr className="w-3/5 mt-1 h-1 bg-indigo-500 rounded-full" />}
            </li>
            <li className="ml-4">
              <Link to='welcome' className="bg-indigo-500 text-white py-2 px-4 rounded-full hover:bg-indigo-600 transition duration-300 text-sm sm:text-base whitespace-nowrap" style={{ textDecoration: 'none' }}>
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default Navbar;