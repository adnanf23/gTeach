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
};

export default function AdminSiswaPage() {
  const { siswa, kelas, loading } = useAdminData();
  const [search, setSearch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  
  // State Modal
  const [editingSiswa, setEditingSiswa] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiswa, setNewSiswa] = useState({
    nama: "", nis: "", nisn: "", jenis_kelamin: "laki-laki", kelas_id: "", aktif: true
  });

  const fileInputRef = useRef(null);

  const filteredSiswa = siswa.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.nama?.toLowerCase().includes(term) ||
      s.nis?.toLowerCase().includes(term) ||
      s.expand?.kelas_id?.nama?.toLowerCase().includes(term)
    );
  });

  // --- FUNGSI TAMBAH MANUAL ---
  const handleAddSiswa = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("siswa").create(newSiswa);
      alert("Siswa berhasil ditambahkan");
      setShowAddModal(false);
      setNewSiswa({ nama: "", nis: "", nisn: "", jenis_kelamin: "laki-laki", kelas_id: "", aktif: true });
      window.location.reload();
    } catch (err) {
      alert("Gagal menambahkan: " + err.message);
    }
  };

  const handleDelete = async (id, nama) => {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa ${nama}?`)) {
      try {
        await pb.collection("siswa").delete(id);
        alert("Siswa berhasil dihapus");
        window.location.reload();
      } catch (err) { alert("Gagal menghapus: " + err.message); }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("siswa").update(editingSiswa.id, editingSiswa);
      alert("Data berhasil diperbarui");
      setEditingSiswa(null);
      window.location.reload();
    } catch (err) { alert("Gagal memperbarui: " + err.message); }
  };

  const downloadTemplate = () => {
    const template = [{ Nama: "Nama Lengkap Siswa", NIS: "12345", NISN: "00123456", Kelas: "X MIPA 1", "L/P": "L" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Siswa.xlsx");
  };

  const exportToExcel = () => {
    const dataToExport = filteredSiswa.map(s => ({
      Nama: s.nama, NIS: s.nis, NISN: s.nisn,
      Kelas: s.expand?.kelas_id?.nama || "Tanpa Kelas",
      "L/P": s.jenis_kelamin === "laki-laki" ? "L" : "P"
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "Data_Siswa_Export.xlsx");
    setShowExcelMenu(false);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setShowExcelMenu(false);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        for (const row of data) {
          const targetKelas = kelas.find(k => k.nama?.toLowerCase() === row.Kelas?.toString().toLowerCase());
          await pb.collection("siswa").create({
            nama: row.Nama,
            nis: row.NIS?.toString(),
            nisn: row.NISN?.toString(),
            jenis_kelamin: row["L/P"] === "L" ? "laki-laki" : "perempuan",
            kelas_id: targetKelas ? targetKelas.id : null,
            aktif: true,
          });
        }
        alert("Berhasil!");
        window.location.reload();
      } catch (err) { alert("Gagal Impor!"); }
      finally { setIsImporting(false); }
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Memuat data siswa...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-[11px] font-medium transition-colors whitespace-nowrap">
            <Icon d={icons.download} size={12} /> Download Template Excel
          </button>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64">
            <Icon d={icons.search} className="text-gray-400" />
            <input className="bg-transparent outline-none text-[12px] w-full" placeholder="Cari Siswa..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto relative">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
          <div className="relative flex-1 sm:flex-none">
            <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-[12px] font-medium hover:bg-emerald-600 transition-all">
              <Icon d={icons.excel} /> {isImporting ? "Proses..." : "Excel"} <Icon d={icons.chevronDown} size={10} />
            </button>
            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Icon d={icons.plus} size={12} /> Import Siswa
                </button>
                <button onClick={exportToExcel} className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2">
                  <Icon d={icons.download} size={12} /> Export Siswa
                </button>
              </div>
            )}
          </div>
          
          {/* Tombol Tambah Manual Aktif */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 transition-all"
          >
            <Icon d={icons.plus} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Tabel Siswa */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-[11px] font-semibold text-gray-500 uppercase">Nama Siswa</th>
              <th className="p-4 text-[11px] font-semibold text-gray-500 uppercase">NIS / NISN</th>
              <th className="p-4 text-[11px] font-semibold text-gray-500 uppercase">Kelas</th>
              <th className="p-4 text-[11px] font-semibold text-gray-500 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSiswa.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors text-[13px]">
                <td className="p-4 font-medium text-gray-800">{s.nama}</td>
                <td className="p-4 text-gray-500">{s.nis || '-'} / {s.nisn || '-'}</td>
                <td className="p-4"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{s.expand?.kelas_id?.nama || "N/A"}</span></td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingSiswa(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Icon d={icons.edit} size={14} /></button>
                    <button onClick={() => handleDelete(s.id, s.nama)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Icon d={icons.trash} size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h3 className="text-[14px] font-bold text-gray-800">Tambah Siswa Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><Icon d={icons.close} size={16} /></button>
            </div>
            <form onSubmit={handleAddSiswa} className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Nama Lengkap</label>
                <input required className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] outline-none focus:border-blue-500" placeholder="Masukkan nama..." value={newSiswa.nama} onChange={e => setNewSiswa({...newSiswa, nama: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">NIS</label>
                  <input className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] outline-none focus:border-blue-500" value={newSiswa.nis} onChange={e => setNewSiswa({...newSiswa, nis: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">NISN</label>
                  <input className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] outline-none focus:border-blue-500" value={newSiswa.nisn} onChange={e => setNewSiswa({...newSiswa, nisn: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Jenis Kelamin</label>
                  <select className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] outline-none focus:border-blue-500" value={newSiswa.jenis_kelamin} onChange={e => setNewSiswa({...newSiswa, jenis_kelamin: e.target.value})}>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Kelas</label>
                  <select required className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] outline-none focus:border-blue-500" value={newSiswa.kelas_id} onChange={e => setNewSiswa({...newSiswa, kelas_id: e.target.value})}>
                    <option value="">Pilih Kelas</option>
                    {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-bold">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-bold hover:bg-blue-600 transition-all">Simpan Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT SISWA (SAMA SEPERTI SEBELUMNYA) */}
      {editingSiswa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h3 className="text-[14px] font-bold text-gray-800">Edit Data Siswa</h3>
              <button onClick={() => setEditingSiswa(null)} className="text-gray-400 hover:text-gray-600"><Icon d={icons.close} size={16} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Nama Lengkap</label>
                <input required className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] outline-none focus:border-blue-500" value={editingSiswa.nama} onChange={e => setEditingSiswa({...editingSiswa, nama: e.target.value})} />
              </div>
              {/* ... sisanya sama dengan modal tambah ... */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingSiswa(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-bold">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-bold hover:bg-blue-600 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}