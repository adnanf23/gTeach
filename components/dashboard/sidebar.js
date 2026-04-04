"use client";

import Icon, { icons } from "./icon";

const NAV_ITEMS = [
  { key: "overview",  label: "Overview",      slug: "overview",  icon: "overview" },
  { key: "nilai",     label: "Nilai Siswa",   slug: "nilai",     icon: "nilai" },
  { key: "absensi",   label: "Absensi Siswa", slug: "absensi",   icon: "absensi" },
  { key: "agenda",    label: "Agenda Siswa",  slug: "agenda",    icon: "agenda" },
  { key: "catatan",   label: "Catatan Siswa", slug: "catatan",   icon: "catatan" },
];

const Sidebar = ({ currentSlug, onNavigate, onClose, isOpen, userRole, userClass }) => {
  return (
    <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-[220px] min-w-[220px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">SD</div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-gray-800 leading-tight truncate">SMPN 1 Nusantara</p>
          <p className="text-[10.5px] text-gray-400">
            {userRole === "admin" ? "Administrator" : `Guru Kelas ${userClass}`}
          </p>
        </div>
        <button className="ml-auto lg:hidden text-gray-400 hover:text-gray-600" onClick={onClose}>
          <Icon d={icons.close} size={14} />
        </button>
      </div>
      <div className="pt-2 pb-2 flex-1">
        <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Menu Utama</p>
        {NAV_ITEMS.map(({ key, label, icon, slug }) => {
          const isActive = currentSlug === slug;
          return (
            <button key={key} onClick={() => onNavigate(slug)}
              className={`w-full flex items-center gap-2 px-3 py-[6px] rounded-lg text-left text-[12.5px] transition-colors mx-1 mb-0.5 ${isActive ? "bg-[#4d8bff] text-white font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
              style={{ width: "calc(100% - 8px)" }}>
              <span className={`flex-shrink-0 ${isActive ? "text-blue-200" : "opacity-50"}`}><Icon d={icons[icon]} /></span>
              <span className="flex-1">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-gray-100 p-3 flex flex-col gap-1">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-colors w-full">
          <span className="opacity-50"><Icon d={icons.settings} /></span>Pengaturan
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-colors w-full">
          <span className="opacity-50"><Icon d={icons.logout} /></span>Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;