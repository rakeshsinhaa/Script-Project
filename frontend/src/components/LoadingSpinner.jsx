import React from 'react'

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-600 mx-auto"></div>
        <p className="mt-4 text-lg font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;


