import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

const Navbar = () => {
  const controls = useAnimation();
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && !isHidden.current && currentScrollY > 10) {
        // Scroll down → hide
        controls.start({ y: "-120%", transition: { duration: 0.3 } });
        isHidden.current = true;
      } else if (currentScrollY < lastScrollY.current && isHidden.current) {
        // Scroll up → show
        controls.start({ y: "1.5rem", transition: { duration: 0.3 } });
        isHidden.current = false;
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  return (
    <motion.nav
      animate={controls}
      initial={{ y: "1.5rem" }}
      className="fixed left-1/2 -translate-x-1/2 top-0 z-50 w-[95%] sm:w-[90%] max-w-3xl bg-slate-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-lg"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="./storybook.svg"
            alt="Logo"
            className="w-8 h-8 invert"
          />
          <span className="text-xl sm:text-2xl font-Doto font-bold">criptStory</span>
        </Link>

        {/* Nav Links */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-3">
          <Link
            to="/"
            className="px-3 py-2 text-sm sm:text-base font-Doto rounded-full font-bold hover:bg-white/20 transition"
          >
            Home
          </Link>
          <Link
            to="/ScriptViewer"
            className="px-3 py-2 text-sm sm:text-base font-Doto rounded-full font-bold hover:bg-white/30 transition"
          >
            View Script
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
