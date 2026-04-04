"use client"

import { useState, useMemo, useEffect } from "react";
import pb from "@/lib/pocketbase";
import * as XLSX from "xlsx";

export default function PageAgendaGuru() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pengajaranList, setPengajaranList] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRange, setExportRange] = useState("1");

  const [formData, setFormData] = useState({
    pengajaran_id: '',
    topik: '',
    deskripsi: '',
    jenis: 'materi',
    recordId: null
  });

  // Fetch Pengajaran (Relasi Mapel + Kelas)
// 1. Fetch Daftar Mata Pelajaran dari Master Data 'mapel'
useEffect(() => {
  async function fetchInitialData() {
    try {
      // Kita ambil langsung dari koleksi mapel agar pilihan selalu muncul 
      // meskipun agenda masih kosong
      const records = await pb.collection('mata_pelajaran').getFullList({
        sort: 'nama',
      });
      
      setPengajaranList(records); // records sekarang berisi daftar mapel [ {id, nama}, ... ]
    } catch (err) { 
      console.error("Gagal fetch data mapel:", err); 
    }
  }
  fetchInitialData();
}, []);

  // Fetch Agenda Harian
  useEffect(() => {
    async function fetchAgendas() {
      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const records = await pb.collection('agenda').getFullList({
          filter: `tanggal >= "${dateStr} 00:00:00" && tanggal <= "${dateStr} 23:59:59" && dicatat_oleh = "${pb.authStore.model?.id}"`,
          expand: 'pengajaran_id.mapel_id,pengajaran_id.kelas_id',
          sort: '-created'
        });
        setAgendas(records);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchAgendas();
  }, [selectedDate]);

  const handleDelete = async (id) => {
    if (!confirm("Hapus agenda ini?")) return;
    try {
      await pb.collection('agenda').delete(id);
      setAgendas(agendas.filter(item => item.id !== id));
    } catch (err) { alert("Gagal menghapus."); }
  };

  const handleExportExcel = async () => {
    try {
      const months = parseInt(exportRange);
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      
      const records = await pb.collection('agenda').getFullList({
        filter: `tanggal >= "${start.toISOString()}" && dicatat_oleh = "${pb.authStore.model?.id}"`,
        expand: 'pengajaran_id.mapel_id,pengajaran_id.kelas_id',
        sort: '-tanggal'
      });

      if (records.length === 0) return alert("Data kosong.");

      const data = records.map((item, i) => ({
        No: i + 1,
        Tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
        Kelas: item.expand?.pengajaran_id?.expand?.kelas_id?.nama || '-',
        Mapel: item.expand?.pengajaran_id?.expand?.mapel_id?.nama || '-',
        Jenis: item.jenis,
        Topik: item.topik,
        Deskripsi: item.deskripsi
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Agenda");
      XLSX.writeFile(wb, `Laporan_Agenda_${months}Bulan.xlsx`);
      setIsExportModalOpen(false);
    } catch (err) { alert("Gagal export."); }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData({ pengajaran_id: item.pengajaran_id, topik: item.topik, deskripsi: item.deskripsi, jenis: item.jenis, recordId: item.id });
    } else {
      setFormData({ pengajaran_id: '', topik: '', deskripsi: '', jenis: 'materi', recordId: null });
    }
    setIsModalOpen(true);
  };

const handleSave = async () => {
  // Validasi: pastikan mapel sudah dipilih
  if (!formData.mapel_id) return alert("Silakan pilih mata pelajaran terlebih dahulu.");

  try {
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const payload = {
      mapel_id: formData.mapel_id,    // Sesuai schema: relation ke pbc_3599506470
      topik: formData.topik,
      deskripsi: formData.deskripsi,
      jenis: formData.jenis,         // 'materi', 'ulangan', dll
      tanggal: `${dateStr} 12:00:00`,
      dicatat_oleh: pb.authStore.model?.id // User ID yang sedang login
    };

    if (formData.recordId) {
      await pb.collection('agenda').update(formData.recordId, payload);
    } else {
      await pb.collection('agenda').create(payload);
    }

    setIsModalOpen(false);
    // Refresh list harian
    setSelectedDate(new Date(selectedDate)); 
    alert("Agenda berhasil disimpan!");
    
    // Reset form
    setFormData({ mapel_id: '', topik: '', deskripsi: '', jenis: 'materi', recordId: null });
  } catch (err) { 
    console.error("Error Detail:", err.data); // Cek detail error dari PocketBase jika gagal
    alert("Gagal menyimpan: " + (err.message || "Terjadi kesalahan")); 
  }
};

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto p-4 min-h-screen bg-gray-50/50">
      
      {/* Header dengan Style Teks Sesuai Gambar */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-1 justify-between">
        <div className="flex bg-gray-50/50 rounded-xl p-1 w-full justify-between items-center">
            <div className="flex">
                <button className="bg-white shadow-sm px-6 py-2.5 rounded-lg text-[13px] font-bold text-blue-600 transition-all">
                    Agenda Harian
                </button>
                <button 
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-6 py-2.5 rounded-lg text-[13px] font-bold text-gray-500 hover:text-gray-700 transition-all">
                    Export Laporan
                </button>
            </div>
            <button onClick={() => handleOpenModal()} className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-[12px] font-bold mr-1">+ Agenda</button>
        </div>
      </div>

      {/* Kalender Mingguan */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between gap-2">
          {useMemo(() => {
            const days = [];
            for (let i = -3; i <= 3; i++) {
                const d = new Date(selectedDate);
                d.setDate(selectedDate.getDate() + i);
                days.push(d);
            }
            return days;
          }, [selectedDate]).map((date, i) => {
            const active = date.toDateString() === selectedDate.toDateString();
            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${active ? "bg-indigo-500 text-white shadow-md" : "bg-gray-50 text-gray-400"}`}>
                <span className="text-[9px] uppercase font-bold">{new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date)}</span>
                <span className="text-[16px] font-extrabold">{date.getDate()}</span>
              </button>
            );
          })}
      </div>

      {/* List Agenda */}
      <div className="flex flex-col gap-3">
        {loading ? ( <p className="text-center py-10 text-gray-400 text-sm italic">Memuat...</p> ) : agendas.length > 0 ? (
          agendas.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
              <div className="flex justify-between items-start mb-1 pr-16">
                <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-800">{item.expand?.pengajaran_id?.expand?.mapel_id?.nama}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{item.expand?.pengajaran_id?.expand?.kelas_id?.nama}</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md font-bold uppercase">{item.jenis}</span>
              </div>
              <p className="text-[12px] text-indigo-600 font-medium mb-1">{item.topik}</p>
              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{item.deskripsi}</p>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all">✎</button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">🗑</button>
              </div>
            </div>
          ))
        ) : ( <p className="text-center py-10 text-gray-400 text-[11px]">Tidak ada agenda hari ini.</p> )}
      </div>

      {/* MODAL EXPORT */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📊</div>
                <h2 className="font-extrabold text-gray-800 text-[16px] mb-1">Export Laporan Agenda</h2>
                <p className="text-[11px] text-gray-400 mb-6 px-4">Pilih rentang waktu data yang ingin Anda unduh dalam format Excel.</p>
                
                <div className="flex flex-col gap-2 mb-6">
                    {["1", "2", "3"].map((val) => (
                        <button 
                            key={val}
                            onClick={() => setExportRange(val)}
                            className={`py-3 rounded-2xl text-[12px] font-bold border transition-all ${exportRange === val ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-100 text-gray-500"}`}>
                            {val} Bulan Terakhir
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-3 text-[12px] font-bold text-gray-400">Batal</button>
                    <button onClick={handleExportExcel} className="flex-1 bg-indigo-500 text-white py-3 rounded-2xl text-[12px] font-bold shadow-lg shadow-indigo-100">Download Excel</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-extrabold text-gray-800 text-[14px]">Form Agenda</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 font-bold">×</button>
            </div>
            <div className="p-5 space-y-4">
<div className="flex flex-col gap-1">
  <label className="text-[10px] font-bold text-gray-400 uppercase">Mata Pelajaran</label>
  <select 
    value={formData.mapel_id} 
    onChange={(e) => setFormData({...formData, mapel_id: e.target.value})} 
    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-[12px] outline-none w-full"
  >
    <option value="">Pilih Mapel</option>
    {pengajaranList.map((m) => (
      <option key={m.id} value={m.id}>
        {m.nama}
      </option>
    ))}
  </select>
</div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Jenis</label>
                        <select value={formData.jenis} onChange={(e) => setFormData({...formData, jenis: e.target.value})} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-[12px] outline-none">
                            <option value="materi">Materi</option>
                            <option value="ulangan">Ulangan</option>
                            <option value="remedial">Remedial</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Topik</label>
                        <input type="text" value={formData.topik} onChange={(e) => setFormData({...formData, topik: e.target.value})} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-[12px] outline-none" placeholder="Judul..."/>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Deskripsi</label>
                    <textarea value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-[12px] h-24 outline-none resize-none" placeholder="Detail..."/>
                </div>
                <button onClick={handleSave} className="w-full bg-indigo-500 text-white py-3 rounded-2xl text-[12px] font-bold shadow-lg">Simpan Agenda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}