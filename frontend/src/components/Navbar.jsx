import React from 'react'

import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-purple-700 text-white mx-auto mt-2 max-w-2xl px-6 py-4 rounded-b-4xl rounded-t-4xl shadow-md">
      <div className="flex items-center justify-between">

        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="https://www.svgrepo.com/show/306805/storybook.svg"
              alt="Logo"
              className="w-8 h-8 invert"
            />
            <span className="text-2xl font-bold">toryScript</span>
          </Link>
        </div>

        <div className="flex ">
          <Link to="/" className="px-4 py-2 rounded-3xl font-bold hover:bg-white/20">
            Home
          </Link>
          <Link to="/ScriptViewer" className="px-4 py-2 rounded-3xl font-bold hover:bg-white/30">
            View Script
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

