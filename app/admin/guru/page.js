"use client";

import { useState, useRef } from "react";
import pb from "@/lib/pocketbase";
import { useAdminData } from "@/hooks/useAdminData";
import * as XLSX from "xlsx";

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
  refresh: "M1 8a7 7 0 1014 0h-2a5 5 0 11-10 0h2L1 8z"
};

export default function AdminGuruPage() {
  const { guru, kelas, loading } = useAdminData();
  const [search, setSearch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [editingGuru, setEditingGuru] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const passwordDefault = "gTeach2026"; // Password default sistem

  const [newGuru, setNewGuru] = useState({
    name: "", username: "", email: "", kelas_id: ""
  });

  const fileInputRef = useRef(null);

  // --- HELPER: Sinkronisasi ke Tabel Kelas ---
  const updateWaliKelasDiTabelKelas = async (kelasId, userId) => {
    if (!kelasId) return;
    try {
      await pb.collection("kelas").update(kelasId, {
        walikelas_id: userId
      });
    } catch (err) {
      console.error("Gagal sinkronisasi Wali Kelas:", err);
    }
  };

  const filtered = guru.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.username?.toLowerCase().includes(search.toLowerCase())
  );

  // --- ACTIONS ---
  const handleAddManual = async (e) => {
    e.preventDefault();
    try {
      const createdUser = await pb.collection("users").create({
        ...newGuru,
        password: passwordDefault,
        passwordConfirm: passwordDefault,
        role: "guru",
        emailVisibility: true
      });

      await updateWaliKelasDiTabelKelas(newGuru.kelas_id, createdUser.id);

      setShowAddModal(false);
      setNewGuru({ name: "", username: "", email: "", kelas_id: "" });
      window.location.reload();
    } catch (err) { alert("Gagal tambah guru: " + err.message); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editingGuru.name,
        username: editingGuru.username,
        email: editingGuru.email,
        kelas_id: editingGuru.kelas_id,
      };

      if (editingGuru.newPassword) {
        updateData.password = editingGuru.newPassword;
        updateData.passwordConfirm = editingGuru.newPassword;
      }

      await pb.collection("users").update(editingGuru.id, updateData);
      await updateWaliKelasDiTabelKelas(editingGuru.kelas_id, editingGuru.id);

      setEditingGuru(null);
      window.location.reload();
    } catch (err) { alert("Gagal update: " + err.message); }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Hapus guru ${name}?`)) {
      try {
        await pb.collection("users").delete(id);
        window.location.reload();
      } catch (err) { alert("Gagal hapus"); }
    }
  };

  // --- EXCEL LOGIC ---
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setShowExcelMenu(false);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        for (const row of data) {
          let targetKelasId = row.ID_Kelas || "";
          
          if (!targetKelasId && row.Kelas) {
            const match = kelas.find(k => k.nama.toLowerCase() === row.Kelas.toString().toLowerCase());
            if (match) targetKelasId = match.id;
          }

          const createdUser = await pb.collection("users").create({
            name: row.Nama,
            username: row.Username,
            email: row.Email,
            password: passwordDefault,
            passwordConfirm: passwordDefault,
            role: "guru",
            kelas_id: targetKelasId,
            emailVisibility: true
          });

          if (targetKelasId) {
            await updateWaliKelasDiTabelKelas(targetKelasId, createdUser.id);
          }
        }
        alert("Import Berhasil!");
        window.location.reload();
      } catch (err) { 
        alert("Gagal Impor!"); 
      } finally { 
        setIsImporting(false); 
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [{ Nama: "Ahmad Guru", Username: "ahmad123", Email: "ahmad@sekolah.id", Kelas: "1A" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Guru.xlsx");
  };

  if (loading) return <div className="p-10 text-center text-gray-400 text-[12px]">Memuat data...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64">
          <Icon d={icons.search} className="text-gray-400" />
          <input className="bg-transparent outline-none text-[12px] w-full" placeholder="Cari guru..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-2 w-full sm:w-auto relative">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
          
          <div className="relative">
            <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-[12px] font-medium hover:bg-emerald-600 transition-all">
              <Icon d={icons.excel} /> {isImporting ? "Proses..." : "Excel"} <Icon d={icons.chevronDown} size={10} />
            </button>
            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={downloadTemplate} className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Icon d={icons.download} size={12} /> Unduh Template
                </button>
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2">
                  <Icon d={icons.plus} size={12} /> Unggah Excel
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 transition-all">
            <Icon d={icons.plus} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="p-4">Nama</th>
              <th className="p-4">Username</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Password</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((g) => (
              <tr key={g.id} className="text-[13px] hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-800">{g.name}</div>
                  <div className="text-[10px] text-gray-400">{g.email}</div>
                </td>
                <td className="p-4 font-medium text-gray-600">@{g.username}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${g.kelas_id ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {kelas.find(k => k.id === g.kelas_id)?.nama || "Tanpa Kelas"}
                  </span>
                </td>
                <td className="p-4">
                   <code className="bg-gray-100 px-2 py-1 rounded text-[11px] text-gray-600 font-mono">
                    {passwordDefault}
                   </code>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingGuru(g)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Icon d={icons.edit} /></button>
                    <button onClick={() => handleDelete(g.id, g.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icon d={icons.trash} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah & Edit tetap sama seperti sebelumnya */}
      {/* ... (Modal Tambah Manual) */}
      {/* ... (Modal Edit Guru) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-[15px]">Tambah Guru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400"><Icon d={icons.close} size={18} /></button>
            </div>
            <form onSubmit={handleAddManual} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
                <input required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]" 
                  value={newGuru.name} onChange={e => setNewGuru({...newGuru, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Username</label>
                  <input required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]" 
                    value={newGuru.username} onChange={e => setNewGuru({...newGuru, username: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Kelas Wali</label>
                  <select className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]"
                    value={newGuru.kelas_id} onChange={e => setNewGuru({...newGuru, kelas_id: e.target.value})}>
                    <option value="">Tidak ada</option>
                    {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                <input required type="email" className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]" 
                  value={newGuru.email} onChange={e => setNewGuru({...newGuru, email: e.target.value})} />
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  <strong>Info:</strong> Password otomatis diset ke <code className="font-bold">{passwordDefault}</code>
                </p>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-[12px] mt-4">Simpan Guru</button>
            </form>
          </div>
        </div>
      )}

      {editingGuru && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-[15px]">Edit Guru</h3>
              <button onClick={() => setEditingGuru(null)} className="text-gray-400"><Icon d={icons.close} size={18} /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
                <input required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]" 
                  value={editingGuru.name} onChange={e => setEditingGuru({...editingGuru, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Username</label>
                  <input required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]" 
                    value={editingGuru.username} onChange={e => setEditingGuru({...editingGuru, username: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Wali Kelas</label>
                  <select className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]"
                    value={editingGuru.kelas_id || ""} onChange={e => setEditingGuru({...editingGuru, kelas_id: e.target.value})}>
                    <option value="">Pilih Kelas</option>
                    {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                <input required type="email" className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]" 
                  value={editingGuru.email} onChange={e => setEditingGuru({...editingGuru, email: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-[12px] mt-4">Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}