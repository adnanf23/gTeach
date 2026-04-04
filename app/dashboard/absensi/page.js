"use client"

import { useState, useMemo, useEffect } from "react";
import pb from "@/lib/pocketbase";
import * as XLSX from "xlsx"; // Import library excel

export default function PageAbsensi() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const currentUser = pb.authStore.model;
  const userKelasId = currentUser?.kelas_id;

  // 1. Fetch Daftar Siswa
  useEffect(() => {
    async function fetchStudents() {
      try {
        const records = await pb.collection('siswa').getFullList({
          filter: `kelas_id = "${userKelasId}"`,
          sort: "nama"
        });
        setStudents(records);
      } catch (err) {
        console.error("Gagal fetch siswa:", err);
      }
    }
    if (userKelasId) fetchStudents();
  }, [userKelasId]);

  // 2. Fetch Data Absensi Harian
  useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const records = await pb.collection('absensi').getFullList({
          filter: `tanggal >= "${dateStr} 00:00:00" && tanggal <= "${dateStr} 23:59:59"`,
        });

        const mapping = {};
        records.forEach(rec => {
          mapping[rec.siswa_id] = { 
            status: rec.status, 
            recordId: rec.id, 
            keterangan: rec.keterangan || "" 
          };
        });
        setAttendance(mapping);
      } catch (err) {
        console.error("Gagal fetch absensi:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, [selectedDate]);

  // 3. Fungsi Export ke Excel
  const exportToExcel = async (rangeInMonths) => {
    setExporting(true);
    try {
      const end = new Date();
      const start = new Date();
      
      // Hitung tanggal mulai berdasarkan pilihan
      if (rangeInMonths === 'week') {
        start.setDate(end.getDate() - 7);
      } else {
        start.setMonth(end.getMonth() - rangeInMonths);
      }

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      // Ambil data absensi dalam rentang waktu tersebut
      const logs = await pb.collection('absensi').getFullList({
        filter: `tanggal >= "${startStr} 00:00:00" && tanggal <= "${endStr} 23:59:59" && kelas_id = "${userKelasId}"`,
        sort: "-tanggal",
        expand: "siswa_id"
      });

      // Format data untuk Excel
      const excelData = logs.map((log, index) => ({
        "No": index + 1,
        "Tanggal": log.tanggal.split(' ')[0],
        "Nama Siswa": log.expand?.siswa_id?.nama || "N/A",
        "NIS": log.expand?.siswa_id?.nis || "-",
        "Status": log.status.toUpperCase(),
        "Keterangan": log.keterangan || "-"
      }));

      // Proses pembuatan file
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
      
      // Download file
      const fileName = `Absensi_Kelas_${rangeInMonths}_bulan.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      alert("Gagal mengekspor data");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const promises = students.map(async (s) => {
        const data = attendance[s.id];
        if (!data?.status) return; 

        const payload = {
          siswa_id: s.id,
          tanggal: `${dateStr} 12:00:00`, 
          status: data.status,
          keterangan: data.keterangan || "",
          dicatat_oleh: pb.authStore.model.id,
          kelas_id: userKelasId
        };

        if (data.recordId) {
          return pb.collection('absensi').update(data.recordId, payload);
        } else {
          return pb.collection('absensi').create(payload);
        }
      });

      await Promise.all(promises);
      alert("Tersimpan!");
    } catch (err) {
      alert("Gagal simpan");
    }
  };

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto p-4">
      
      {/* Tombol Export */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
        <span className="text-[12px] font-bold text-gray-700">Laporan Absensi (Export Excel)</span>
        <div className="grid grid-cols-3 gap-2">
          <button disabled={exporting} onClick={() => exportToExcel('week')} className="py-2 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold rounded-xl text-gray-600 transition-all border border-gray-100">1 Minggu</button>
          <button disabled={exporting} onClick={() => exportToExcel(1)} className="py-2 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold rounded-xl text-gray-600 transition-all border border-gray-100">1 Bulan</button>
          <button disabled={exporting} onClick={() => exportToExcel(6)} className="py-2 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold rounded-xl text-gray-600 transition-all border border-gray-100">1 Semester</button>
        </div>  
      </div>

      {/* Kalender Navigasi */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between gap-2">
          {weekDays.map((date, i) => {
            const active = date.toDateString() === selectedDate.toDateString();
            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${active ? "bg-[#4d8bff] text-white shadow-md" : "bg-gray-50 text-gray-400"}`}>
                <span className="text-[10px] uppercase font-bold">{new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date)}</span>
                <span className="text-[16px] font-extrabold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Siswa */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? <div className="p-10 text-center text-gray-400 text-[12px]">Memuat data...</div> : (
          <div className="divide-y divide-gray-50">
            {students.map((s, idx) => (
              <div key={s.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-300 w-4">{idx + 1}</span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-gray-800">{s.nama}</span>
                      <span className="text-[10px] text-gray-400">NIS: {s.nis || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[{ v: "hadir", label: "H", c: "bg-emerald-500", t: "bg-emerald-50 text-emerald-600" },
                      { v: "sakit", label: "S", c: "bg-amber-500", t: "bg-amber-50 text-amber-600" },
                      { v: "izin",  label: "I", c: "bg-blue-500",  t: "bg-blue-50 text-blue-600" },
                      { v: "alpha", label: "A", c: "bg-red-500",   t: "bg-red-50 text-red-600" }
                    ].map((opt) => {
                      const isSelected = attendance[s.id]?.status === opt.v;
                      return (
                        <button key={opt.v}
                          onClick={() => setAttendance({ ...attendance, [s.id]: { ...attendance[s.id], status: opt.v } })}
                          className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${isSelected ? `${opt.c} text-white` : `${opt.t} opacity-60`}`}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input 
                  type="text"
                  placeholder="Keterangan..."
                  value={attendance[s.id]?.keterangan || ""}
                  onChange={(e) => setAttendance({...attendance, [s.id]: { ...attendance[s.id], keterangan: e.target.value }})}
                  className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-[11px] text-gray-600 placeholder:text-gray-300 focus:ring-1 focus:ring-blue-100 transition-all"
                />
              </div>
            ))}
          </div>
        )}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <button onClick={handleSave} className="w-full bg-[#4d8bff] text-white py-3 rounded-xl text-[13px] font-bold">
            Simpan Presensi Hari Ini
          </button>
        </div>
      </div>
    </div>
  );
}