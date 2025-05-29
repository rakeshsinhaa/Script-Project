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
      className="fixed left-1/2 -translate-x-1/2 top-0 z-50 bg-slate-500 text-white px-6 py-4 rounded-3xl shadow-lg w-[90%] max-w-2xl"
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center ">
          <img
            src="./storybook.svg"
            alt="Logo"
            className="w-8 h-8 invert"
          />
          <span className="text-2xl font-Doto font-bold">toryScript</span>
        </Link>

        <div className="flex space-x-4">
          <Link to="/" className="px-4 py-2 font-Doto rounded-3xl font-bold hover:bg-white/20">
            Home
          </Link>
          <Link to="/ScriptViewer" className="px-4 py-2 font-Doto rounded-3xl font-bold hover:bg-white/30">
            View Script
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
