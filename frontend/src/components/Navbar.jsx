import React from 'react'

import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-purple-700 text-white mx-auto mt-2 max-w-2xl px-6 py-4 rounded-b-4xl rounded-t-4xl  shadow-md">
      <div className="flex  justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="text-2xl font-bold">
          StoryScript
        </Link>
        <div className="space-x-4">
          
          <Link to="/" className="w-4 h-4 p-2 rounded-3xl hover:bg-white/20">
            Home
          </Link>
          <Link to="/ScriptViewer" className="w-4 h-4 p-2 rounded-3xl hover:bg-white/30 ">
            View Script
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

