"use client";

import Icon, { icons } from "./icon";

const Header = ({ onMenuClick, title, userRole, userName }) => {
  return (
    <header className="bg-white border-b border-gray-100 h-12 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0">
      <button className="lg:hidden text-gray-500 hover:text-gray-700 flex-shrink-0" onClick={onMenuClick}>
        <Icon d={icons.menu} size={16} />
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[12px] text-gray-400 hidden sm:block">Dasbor</span>
        <span className="text-gray-300 text-[11px] hidden sm:block">/</span>
        <span className="text-[12px] font-semibold text-gray-700 truncate">{title}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 w-32">
          <span className="text-gray-300"><Icon d={icons.search} size={11} /></span>
          <input className="flex-1 text-[11px] bg-transparent outline-none text-gray-700 placeholder-gray-300" placeholder="Cari..." />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {userName?.charAt(0) || "U"}
          </div>
          <span className="hidden sm:block text-[11px] text-gray-600">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;