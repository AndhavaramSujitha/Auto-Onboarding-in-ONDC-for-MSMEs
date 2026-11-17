
import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ onMenuClick, title }) => {
  return (
    <header className="sticky top-0 z-30 h-[76px] bg-white border-b-2 border-[#D8BC7A]/60 px-4 sm:px-6 lg:px-8 flex items-center gap-4">

      {/* Mobile Menu */}
      <button
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="p-2 rounded-lg text-[#444444] hover:bg-[#F5F2E9] transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#202020] tracking-tight">
          {title || 'ONDC Auto Onboarder'}
        </h1>
        <div className="w-10 h-[3px] bg-[#D8BC7A] rounded-full mt-1" />
      </div>

    </header>
  );
};

export default Header;
