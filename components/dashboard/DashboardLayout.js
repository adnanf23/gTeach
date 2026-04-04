"use client";

import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

const DashboardLayout = ({ children, currentSlug, setCurrentSlug, userRole, userClass, userName }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (slug) => { 
    setCurrentSlug(slug); 
    window.location.hash = slug; 
    setSidebarOpen(false); 
  };

  const getTitle = () => {
    const titles = {
      overview: "Overview",
      nilai: "Nilai Siswa",
      absensi: "Absensi Siswa",
      agenda: "Agenda Siswa",
      catatan: "Catatan Siswa",
    };
    return titles[currentSlug] || "Dashboard";
  };

  return (
    <div className="flex h-screen min-h-[600px] bg-gray-50 text-[13px] font-sans overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <Sidebar 
        currentSlug={currentSlug} 
        onNavigate={navigate} 
        onClose={() => setSidebarOpen(false)} 
        isOpen={sidebarOpen}
        userRole={userRole}
        userClass={userClass}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getTitle()}
          userRole={userRole}
          userName={userName}
        />
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-gray-900 mb-5">{getTitle()}</h1>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;