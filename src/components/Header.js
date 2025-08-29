import React from 'react';
import { Menu } from 'lucide-react';
 

const Header = ({ toggleSidebar }) => {
  console.log('Header rendering with toggleSidebar:', !!toggleSidebar);
  console.log('Header component rendering successfully');
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
      <div className="flex justify-between items-center h-full px-4">
        {/* Left: Hamburger menu */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        {/* Center: Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="/logo192.png"
            alt="Partner Portal Logo"
            className="h-8 w-8"
          />
          <span className="font-bold text-lg text-gray-800">PARTNER PORTAL</span>
        </div>

        {/* Right: Empty for now */}
        <div className="w-10"></div>
      </div>
    </header>
  );
};

export default Header;
