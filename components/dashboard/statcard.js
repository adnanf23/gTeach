"use client";

import Icon, { icons } from "./icon";

const StatCard = ({ label, value, sub, color, iconKey, trend }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
        <span style={{ color }}><Icon d={icons[iconKey]} size={13} /></span>
      </span>
    </div>
    <p className="text-[26px] font-semibold text-gray-900 leading-none">{value}</p>
    {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    {trend !== undefined && (
      <span className={`text-[10px] font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% dari bulan lalu
      </span>
    )}
  </div>
);

export default StatCard;