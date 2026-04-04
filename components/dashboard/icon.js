"use client";

const Icon = ({ d, size = 14, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.4" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

export const icons = {
  overview:  "M2 2h5v5H2V2zM9 2h5v5H9V2zM2 9h5v5H2V9zM9 9h5v5H9V9z",
  nilai:     "M2 12h2V8H2v4zM7 12h2V5H7v7zM12 12h2V2h-2v10z",
  absensi:   "M2 3h12v10H2V3zM2 7h12M6 3V1M10 3V1",
  agenda:    "M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zM5 6h6M5 9h4",
  catatan:   "M2 4h12M2 8h12M2 12h7",
  search:    "M7 2a5 5 0 100 10A5 5 0 007 2zM14 14l-3-3",
  plus:      "M8 3v10M3 8h10",
  menu:      "M2 4h12M2 8h12M2 12h12",
  close:     "M3 3l10 10M13 3L3 13",
  chevronR:  "M6 4l4 4-4 4",
  user:      "M8 2a3 3 0 100 6 3 3 0 000-6zM2 14c0-3 2.7-5 6-5s6 2 6 5",
  star:      "M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.2l-3.7 2.1.7-4.1-3-2.9 4.2-.7L8 2z",
  check:     "M2 8l4 4 8-8",
  alert:     "M8 2l6 12H2L8 2zM8 7v3M8 12h0",
  clock:     "M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 2",
  book:      "M2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H2V3zM10 3a2 2 0 012 2v8M6 7h2M6 10h2",
  settings:  "M8 5a3 3 0 100 6 3 3 0 000-6zM8 1v2M8 13v2M1 8h2M13 8h2",
  logout:    "M10 8H2M7 5l-3 3 3 3M12 2h2v12h-2",
  edit:      "M11 2l3 3-9 9H2v-3L11 2z",
  trash:     "M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9",
  lp:        "M4 2h8a1 1 0 011 1v2H3V3a1 1 0 011-1zM3 5h10v9H3V5zM6 8h4M6 11h2",
  input:     "M3 8h10M8 3l5 5-5 5",
  rekap:     "M2 2h12v12H2V2zM5 6h6M5 9h6M5 12h3",
  save:      "M3 2h8l3 3v9H3V2zM6 2v4h5M6 11a2 2 0 100-4 2 2 0 000 4",
};

export default Icon;