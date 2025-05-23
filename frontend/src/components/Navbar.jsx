import React from 'react'

import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-purple-700 text-white  px-6 py-4 rounded-b-4xl shadow-md">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="text-2xl font-bold">
          StoryScript
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/script-viewer" className="hover:underline">
            View Script
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

