import React from 'react'
import { Link } from "react-router-dom";
// import { motion } from "motion/react"
import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import { useScroll } from "framer-motion"



const Navbar = () => {

  const controls = useAnimation();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        // Scroll down: hide navbar
        controls.start({ y: "-100%", transition: { duration: 0.1 } });
      } else if (currentScrollY < lastScrollY.current) {
        // Scroll up: show navbar
        controls.start({ y: "0%", transition: { duration: 0.1 } });
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [controls]);

  return (
    <motion.nav 
      animate={controls}
      initial={{ y: "0%" }}
      className=" fixed left-1/2 transform -translate-x-1/2 top-6 z-50 bg-purple-700 text-white px-6 py-4 rounded-3xl shadow-lg w-[90%] max-w-2xl text-center">
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
    </motion.nav>
  );
};

export default Navbar;

