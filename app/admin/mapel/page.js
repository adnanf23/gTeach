"use client";

import { useState, useRef, useEffect } from "react";
import pb from "@/lib/pocketbase";
import * as XLSX from "xlsx";

// --- KOMPONEN ICON ---
const Icon = ({ d, size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  search: "M7 2a5 5 0 100 10A5 5 0 007 2zM14 14l-3-3",
  plus: "M8 3v10M3 8h10",
  excel: "M3 13V3a1 1 0 011-1h6l3 3v8a1 1 0 01-1 1H4a1 1 0 01-1-1z M8 2v3h3",
  download: "M3 13h10M8 3v7m-3-3l3 3 3-3",
  chevronDown: "M4 6l4 4 4-4",
  edit: "M11 2l3 3L5 14H2v-3L11 2z",
  trash: "M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5",
  close: "M3 3l10 10M3 13L13 3",
  fileText: "M4 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z M4 6h8 M4 10h8 M4 14h4",
};

export default function AdminMapelPage() {
  const [mapel, setMapel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMapel, setEditingMapel] = useState(null);
  const [newMapel, setNewMapel] = useState({ nama: "", kode: "" });

  const fileInputRef = useRef(null);

  // --- FUNGSI PENCATAT LOG ---
  const createLog = async (action, recordId, detail) => {
    try {
      await pb.collection("system_log").create({
        user: pb.authStore.model?.id,
        action: action,
        collection_name: "mata_pelajaran",
        record_id: recordId || "",
        detail: detail,
        ip_address: "client-side"
      });
    } catch (err) {
      console.error("Gagal mencatat log:", err);
    }
  };

  const fetchMapel = async () => {
    try {
      const records = await pb.collection("mata_pelajaran").getFullList({ sort: "nama" });
      setMapel(records);
    } catch (err) {
      console.error("Gagal mengambil data mapel:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMapel(); }, []);

  const filteredMapel = mapel.filter((m) =>
    m.nama?.toLowerCase().includes(search.toLowerCase()) ||
    m.kode?.toLowerCase().includes(search.toLowerCase())
  );

  // --- HANDLER CRUD ---
  const handleAddMapel = async (e) => {
    e.preventDefault();
    try {
      const record = await pb.collection("mata_pelajaran").create(newMapel);
      await createLog("create", record.id, `Menambah mata pelajaran baru: ${newMapel.nama}`);
      alert("Mapel berhasil ditambahkan");
      setShowAddModal(false);
      setNewMapel({ nama: "", kode: "" });
      fetchMapel();
    } catch (err) { 
      alert("Gagal menambahkan: " + err.message); 
    }
  };

  const handleUpdateMapel = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("mata_pelajaran").update(editingMapel.id, {
        nama: editingMapel.nama,
        kode: editingMapel.kode
      });
      await createLog("update", editingMapel.id, `Mengubah data mapel menjadi: ${editingMapel.nama}`);
      alert("Data berhasil diperbarui");
      setEditingMapel(null);
      fetchMapel();
    } catch (err) { alert("Gagal memperbarui: " + err.message); }
  };

  const handleDelete = async (id, nama) => {
    if (confirm(`Hapus mata pelajaran ${nama}?`)) {
      try {
        await pb.collection("mata_pelajaran").delete(id);
        await createLog("delete", id, `Menghapus mata pelajaran: ${nama}`);
        fetchMapel();
      } catch (err) { alert("Gagal menghapus: " + err.message); }
    }
  };

  // --- FITUR EXCEL ---
  const downloadTemplate = () => {
    const template = [
      { "Nama": "Matematika", "Kode": "MTK" },
      { "Nama": "Bahasa Indonesia", "Kode": "BIND" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import");
    XLSX.writeFile(wb, "Template_Mata_Pelajaran.xlsx");
    
    createLog("create", "", "Mengunduh template Excel mata pelajaran");
    setShowExcelMenu(false);
  };

  const exportToExcel = () => {
    const data = filteredMapel.map(m => ({ "Nama Mata Pelajaran": m.nama, "Kode Mapel": m.kode }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mapel");
    XLSX.writeFile(wb, "Data_Mata_Pelajaran_Export.xlsx");
    
    createLog("create", "", "Mengekspor seluruh data mapel ke Excel");
    setShowExcelMenu(false);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let count = 0;
        for (const row of data) {
          await pb.collection("mata_pelajaran").create({
            nama: row.Nama || row.nama, 
            kode: row.Kode?.toString() || row.kode?.toString()
          });
          count++;
        }
        await createLog("create", "", `Berhasil mengimpor ${count} data mata pelajaran via Excel`);
        alert(`Berhasil mengimpor ${count} data.`);
        fetchMapel();
      } catch (err) { 
        alert("Gagal Impor! Pastikan format kolom sesuai (Nama, Kode) dan kode belum ada di sistem."); 
      } finally { 
        setIsImporting(false); 
        setShowExcelMenu(false); 
        e.target.value = null; // Reset input file
      }
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 text-[13px]">Menghubungkan ke database...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Tools */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64">
          <Icon d={icons.search} className="text-gray-400" />
          <input 
            className="bg-transparent outline-none text-[12px] w-full" 
            placeholder="Cari Kode atau Nama Mapel..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto relative">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
          
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setShowExcelMenu(!showExcelMenu)} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-[12px] font-medium hover:bg-emerald-600 transition-all"
            >
              <Icon d={icons.excel} /> {isImporting ? "Mengimpor..." : "Menu Excel"} <Icon d={icons.chevronDown} size={10} />
            </button>

            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button onClick={downloadTemplate} className="w-full text-left px-4 py-3 text-[11px] text-blue-600 font-bold hover:bg-blue-50 flex items-center gap-2 uppercase tracking-tight">
                  <Icon d={icons.fileText} size={14} /> 1. Download Template
                </button>
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-3 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50">
                  <Icon d={icons.plus} size={14} /> 2. Import Data Excel
                </button>
                <button onClick={exportToExcel} className="w-full text-left px-4 py-3 text-[12px] text-gray-700 hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2">
                  <Icon d={icons.download} size={14} /> 3. Export Data (Backup)
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowAddModal(true)} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700 transition-all shadow-sm"
          >
            <Icon d={icons.plus} /> Tambah Mapel
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4 w-40">Kode Mapel</th>
              <th className="p-4">Nama Mata Pelajaran</th>
              <th className="p-4 text-right">Opsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredMapel.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors text-[13px]">
                <td className="p-4 font-mono text-blue-600 font-bold">{m.kode || '-'}</td>
                <td className="p-4 font-medium text-gray-800">{m.nama}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingMapel(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Icon d={icons.edit} size={15} />
                    </button>
                    <button onClick={() => handleDelete(m.id, m.nama)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Icon d={icons.trash} size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMapel.length === 0 && (
              <tr>
                <td colSpan="3" className="p-12 text-center text-gray-400 text-[12px]">Mata pelajaran belum terdaftar atau tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Tambah & Edit */}
      {(showAddModal || editingMapel) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h3 className="text-[14px] font-bold text-gray-800">
                {editingMapel ? "Sunting Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingMapel(null); }} className="text-gray-400 hover:text-gray-600">
                <Icon d={icons.close} size={18} />
              </button>
            </div>
            <form onSubmit={editingMapel ? handleUpdateMapel : handleAddMapel} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nama Lengkap Mapel</label>
                <input 
                  required 
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  placeholder="Contoh: Pendidikan Kewarganegaraan"
                  value={editingMapel ? editingMapel.nama : newMapel.nama} 
                  onChange={e => editingMapel ? setEditingMapel({...editingMapel, nama: e.target.value}) : setNewMapel({...newMapel, nama: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kode Singkatan (Unik)</label>
                <input 
                  required 
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-mono outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  placeholder="Contoh: PKN"
                  value={editingMapel ? editingMapel.kode : newMapel.kode} 
                  onChange={e => editingMapel ? setEditingMapel({...editingMapel, kode: e.target.value}) : setNewMapel({...newMapel, kode: e.target.value})} 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setEditingMapel(null); }} 
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[12px] font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 transition-all shadow-lg"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 