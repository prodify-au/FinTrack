import React, { useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext.jsx';

export function Navbar() {
  const { isLoggedIn, handleLogin, handleLogout } = useContext(AuthContext);

  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl p-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="/logo.svg" className="h-8" alt="FinTrack Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">FinTrack</span>
        </div>
        <div className="flex items-center space-x-6 rtl:space-x-reverse">
          {!isLoggedIn ? (
            <button type="button" onClick={handleLogin} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center">Sign In</button>
          ) : (
            <button type="button" onClick={handleLogout} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center">Sign Out</button>
          )}
        </div>
      </div>
    </nav>
  );
}
