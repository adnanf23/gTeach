"use client";

import { useState, useRef, useMemo } from "react";
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
  filter: "M2 3h12l-5 6v5l-2 2V9L2 3z",
};

export default function AdminSiswaPage() {
  const { siswa, kelas, loading } = useAdminData();
  const [search, setSearch] = useState("");
  const [selectedTingkat, setSelectedTingkat] = useState("Semua"); // State Filter Tingkat
  const [isImporting, setIsImporting] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  
  const [editingSiswa, setEditingSiswa] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiswa, setNewSiswa] = useState({
    nama: "", nis: "", nisn: "", jenis_kelamin: "laki-laki", kelas_id: "", aktif: true
  });

  const fileInputRef = useRef(null);

  // --- LOGIKA FILTER & SORTING ---
  // Mendapatkan daftar tingkatan unik (Contoh: "1", "2" atau "X", "XI")
  const daftarTingkat = useMemo(() => {
    const tingkatans = kelas.map(k => k.nama?.split(/[\s-]+/)[0]); // Ambil kata pertama
    return ["Semua", ...new Set(tingkatans)].sort((a, b) => 
        a.localeCompare(b, undefined, { numeric: true })
    );
  }, [kelas]);

  const filteredSiswa = useMemo(() => {
    return siswa
      .filter((s) => {
        const term = search.toLowerCase();
        const namaKelas = s.expand?.kelas_id?.nama || "";
        const tingkatKelas = namaKelas.split(/[\s-]+/)[0];

        const matchSearch = (
          s.nama?.toLowerCase().includes(term) ||
          s.nis?.toLowerCase().includes(term) ||
          namaKelas.toLowerCase().includes(term)
        );

        const matchTingkat = selectedTingkat === "Semua" || tingkatKelas === selectedTingkat;

        return matchSearch && matchTingkat;
      })
      .sort((a, b) => {
        // Sortir berdasarkan Nama Kelas (1a, 1b, 1c...)
        const kelasA = a.expand?.kelas_id?.nama || "";
        const kelasB = b.expand?.kelas_id?.nama || "";
        return kelasA.localeCompare(kelasB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [siswa, search, selectedTingkat]);

  // --- FUNGSI CRUD ---
  const handleAddSiswa = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("siswa").create(newSiswa);
      alert("Siswa berhasil ditambahkan");
      setShowAddModal(false);
      setNewSiswa({ nama: "", nis: "", nisn: "", jenis_kelamin: "laki-laki", kelas_id: "", aktif: true });
      window.location.reload();
    } catch (err) { alert("Gagal: " + err.message); }
  };

  const handleDelete = async (id, nama) => {
    if (confirm(`Hapus siswa ${nama}?`)) {
      try {
        await pb.collection("siswa").delete(id);
        window.location.reload();
      } catch (err) { alert("Gagal hapus!"); }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("siswa").update(editingSiswa.id, editingSiswa);
      setEditingSiswa(null);
      window.location.reload();
    } catch (err) { alert("Gagal update!"); }
  };

  // --- EXCEL LOGIC ---
  const downloadTemplate = () => {
    const template = [{ Nama: "Budi Santoso", NIS: "12345", NISN: "0012345", Kelas: "1A", "L/P": "L" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Siswa.xlsx");
  };

  const exportToExcel = () => {
    const dataToExport = filteredSiswa.map(s => ({
      Nama: s.nama, NIS: s.nis, NISN: s.nisn,
      Kelas: s.expand?.kelas_id?.nama || "-",
      "L/P": s.jenis_kelamin === "laki-laki" ? "L" : "P"
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "Export_Siswa.xlsx");
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
        for (const row of data) {
          const targetKelas = kelas.find(k => k.nama?.toLowerCase() === row.Kelas?.toString().toLowerCase());
          await pb.collection("siswa").create({
            nama: row.Nama,
            nis: row.NIS?.toString(),
            nisn: row.NISN?.toString(),
            jenis_kelamin: row["L/P"] === "L" ? "laki-laki" : "perempuan",
            kelas_id: targetKelas?.id || null,
            aktif: true,
          });
        }
        alert("Impor Selesai!");
        window.location.reload();
      } catch (err) { alert("Kesalahan Impor!"); }
      finally { setIsImporting(false); }
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Memuat data siswa...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Filter Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Dropdown Tingkatan */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Icon d={icons.filter} className="text-gray-400" size={12} />
            <select 
              className="bg-transparent outline-none text-[12px] font-medium text-gray-700 min-w-[100px]"
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
            >
              {daftarTingkat.map(t => (
                <option key={t} value={t}>{t === "Semua" ? "Semua Tingkat" : `Tingkat ${t}`}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 sm:min-w-[250px]">
            <Icon d={icons.search} className="text-gray-400" />
            <input 
              className="bg-transparent outline-none text-[12px] w-full" 
              placeholder="Cari Nama, NIS, atau Kelas..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto relative">
          <button onClick={downloadTemplate} className="hidden sm:flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-[11px] font-medium px-2">
            <Icon d={icons.download} size={12} /> Template
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
          <div className="relative flex-1 sm:flex-none">
            <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-[12px] font-medium hover:bg-emerald-600">
              <Icon d={icons.excel} /> {isImporting ? "Proses..." : "Excel"} <Icon d={icons.chevronDown} size={10} />
            </button>
            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-gray-50 flex items-center gap-2">
                  <Icon d={icons.plus} size={12} /> Import Siswa
                </button>
                <button onClick={exportToExcel} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2">
                  <Icon d={icons.download} size={12} /> Export Siswa
                </button>
              </div>
            )}
          </div>
          
          <button onClick={() => setShowAddModal(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">
            <Icon d={icons.plus} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Tabel Siswa */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
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
              {filteredSiswa.length > 0 ? (
                filteredSiswa.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors text-[13px]">
                    <td className="p-4 font-medium text-gray-800">{s.nama}</td>
                    <td className="p-4 text-gray-500">{s.nis || '-'} / {s.nisn || '-'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                        {s.expand?.kelas_id?.nama || "Tanpa Kelas"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditingSiswa(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Icon d={icons.edit} size={14} /></button>
                        <button onClick={() => handleDelete(s.id, s.nama)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Icon d={icons.trash} size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-400 text-[13px]">Data siswa tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-[14px] font-bold">Tambah Siswa Baru</h3>
              <button onClick={() => setShowAddModal(false)}><Icon d={icons.close} size={16} /></button>
            </div>
            <form onSubmit={handleAddSiswa} className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase">Nama Lengkap</label>
                <input required className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-[13px]" value={newSiswa.nama} onChange={e => setNewSiswa({...newSiswa, nama: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">NIS</label>
                  <input className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-[13px]" value={newSiswa.nis} onChange={e => setNewSiswa({...newSiswa, nis: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">NISN</label>
                  <input className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-[13px]" value={newSiswa.nisn} onChange={e => setNewSiswa({...newSiswa, nisn: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">L/P</label>
                  <select className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-[13px]" value={newSiswa.jenis_kelamin} onChange={e => setNewSiswa({...newSiswa, jenis_kelamin: e.target.value})}>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Kelas</label>
                  <select required className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-[13px]" value={newSiswa.kelas_id} onChange={e => setNewSiswa({...newSiswa, kelas_id: e.target.value})}>
                    <option value="">Pilih Kelas</option>
                    {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-bold">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editingSiswa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-[14px] font-bold">Edit Data Siswa</h3>
              <button onClick={() => setEditingSiswa(null)}><Icon d={icons.close} size={16} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase">Nama Lengkap</label>
                <input required className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-lg text-[13px]" value={editingSiswa.nama} onChange={e => setEditingSiswa({...editingSiswa, nama: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">L/P</label>
                  <select className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-lg text-[13px]" value={editingSiswa.jenis_kelamin} onChange={e => setEditingSiswa({...editingSiswa, jenis_kelamin: e.target.value})}>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Kelas</label>
                  <select required className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-lg text-[13px]" value={editingSiswa.kelas_id} onChange={e => setEditingSiswa({...editingSiswa, kelas_id: e.target.value})}>
                    {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingSiswa(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-bold">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}