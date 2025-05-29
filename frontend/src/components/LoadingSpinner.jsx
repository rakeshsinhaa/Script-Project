import React from 'react'

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex justify-center items-center h-screen ">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-white mx-auto"></div>
        <p className="mt-4 text-lg text-white font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;


