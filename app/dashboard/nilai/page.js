"use client";

import { useState, useEffect, useMemo } from "react";
import pb from "@/lib/pocketbase";
import { useAdminData } from "@/hooks/useAdminData";
import * as XLSX from "xlsx";

// --- KOMPONEN ICON ---
const Icon = ({ d, size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  plus: "M8 3v10M3 8h10",
  trash: "M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5",
  lock: "M4 7V5a4 4 0 118 0v2M3 7h10a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
};

// --- SUBPAGE: INPUT NILAI ---
function SubPageInputNilai({ students, mapelRecords, lpRecords, existingNilai, onRefresh, config }) {
  const [mapelId, setMapelId] = useState("");
  const [semester, setSemester] = useState(config?.semester_aktif || "1");
  const [gridData, setGridData] = useState({});

  const isLocked = config?.is_active === false;
  const currentTahap = config?.tahap_penilaian?.toLowerCase().trim() || "harian";

  const canInputAHB = currentTahap === "ahb" || currentTahap.includes("akhir");
  const canInputASAS = currentTahap.includes("akhir");
  const asasLabel = semester === "1" ? "ASAS" : "ASAT";
  const asasJenis = semester === "1" ? "asas" : "asat";

  useEffect(() => {
    if (mapelRecords.length > 0 && !mapelId) setMapelId(mapelRecords[0].id);
  }, [mapelRecords, mapelId]);

  const currentLPs = useMemo(() =>
    lpRecords.filter(lp => lp.mapel_id === mapelId && lp.semester === semester),
    [lpRecords, mapelId, semester]);

  useEffect(() => {
    const newGrid = {};
    existingNilai.forEach(n => {
      const key = n.lp_id ? `${n.siswa_id}-${n.lp_id}` : `${n.siswa_id}-${n.jenis}`;
      newGrid[key] = { val: n.nilai, id: n.id };
    });
    setGridData(newGrid);
  }, [existingNilai]);

  const handleCellChange = async (siswaId, val, type, lpId = null) => {
    if (isLocked) return;
    const numVal = val === "" ? 0 : parseFloat(val);
    const key = lpId ? `${siswaId}-${lpId}` : `${siswaId}-${type}`;
    const existing = gridData[key];

    const payload = {
      siswa_id: siswaId,
      mapel_id: mapelId,
      semester: semester,
      jenis: type,
      nilai: numVal,
      lp_id: lpId,
      tahun_ajaran: config?.tahun_ajaran || "2024/2025",
      diinput_oleh: pb.authStore.model?.id
    };

    try {
      if (existing?.id) {
        await pb.collection("nilai").update(existing.id, payload);
      } else {
        await pb.collection("nilai").create(payload);
      }
      onRefresh();
    } catch (err) { console.error("Gagal simpan:", err); }
  };

  const calculateSiswaData = (siswaId) => {
    let total = 0;
    let filledCount = 0;
    let totalTasks = 0;

    currentLPs.forEach(lp => {
      const val = gridData[`${siswaId}-${lp.id}`]?.val || 0;
      totalTasks++;
      if (val > 0) { filledCount++; total += val; }
    });

    if (canInputAHB) {
      const ahbVal = gridData[`${siswaId}-ahb`]?.val || 0;
      totalTasks++;
      if (ahbVal > 0) { filledCount++; total += ahbVal; }
    }

    if (canInputASAS) {
      const asasVal = gridData[`${siswaId}-${asasJenis}`]?.val || 0;
      totalTasks++;
      if (asasVal > 0) { filledCount++; total += asasVal; }
    }

    const rataRata = totalTasks > 0 ? (total / totalTasks).toFixed(0) : 0;
    const progress = totalTasks > 0 ? Math.round((filledCount / totalTasks) * 100) : 0;

    return { rataRata, progress };
  };

  const handleExportExcel = () => {
    const mapelNama = mapelRecords.find(m => m.id === mapelId)?.nama || "Mapel";

    // Header baris 1 & 2
    const fileHeader = [
      [`REKAP NILAI: ${mapelNama.toUpperCase()}`],
      [`Semester: ${semester} | Tahun Ajaran: ${config?.tahun_ajaran || "-"}`],
      [] // Spasi
    ];

    // Header Tabel
    const tableHeader = ["No", "Nama Siswa", "Progres"];
    currentLPs.forEach(lp => tableHeader.push(`LP ${lp.urutan}`));
    tableHeader.push("AHB", asasLabel, "Rata-rata (NA)");

    // Data Siswa
    const tableBody = students.map((s, idx) => {
      const { rataRata, progress } = calculateSiswaData(s.id);
      const row = [idx + 1, s.nama, `${progress}%`];

      currentLPs.forEach(lp => row.push(gridData[`${s.id}-${lp.id}`]?.val || 0));
      row.push(gridData[`${s.id}-ahb`]?.val || 0);
      row.push(gridData[`${s.id}-${asasJenis}`]?.val || 0);
      row.push(rataRata);

      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([...fileHeader, tableHeader, ...tableBody]);

    // Atur Lebar Kolom
    const wscols = [
      { wch: 5 },  // No
      { wch: 35 }, // Nama
      { wch: 10 }, // Progres
      ...currentLPs.map(() => ({ wch: 8 })), // LP columns
      { wch: 8 },  // AHB
      { wch: 8 },  // ASAS/AT
      { wch: 15 }, // NA
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai");
    XLSX.writeFile(workbook, `Nilai_${mapelNama}_S${semester}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <select value={mapelId} onChange={e => setMapelId(e.target.value)}
            className="text-[12px] font-bold bg-gray-50 p-2.5 rounded-lg border border-gray-200 outline-none">
            {mapelRecords.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["1", "2"].map(s => (
              <button key={s} onClick={() => setSemester(s)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all
                  ${semester === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>
                Sem {s}
              </button>
            ))}
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-[11px] font-bold shadow-md hover:bg-green-700 transition-all">
            <Icon d={icons.download} /> Export Excel
          </button>
        </div>
        <div className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider
          ${canInputASAS ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
          Tahap: {currentTahap}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4 w-10 text-center">No</th>
              <th className="p-4 sticky left-0 bg-gray-50 z-10 border-r border-gray-100">Nama Siswa</th>
              <th className="p-4 text-center">Progres</th>
              {currentLPs.sort((a, b) => a.urutan - b.urutan).map(lp =>
                <th key={lp.id} className="p-4 text-center min-w-[80px]">LP {lp.urutan}</th>
              )}
              <th className={`p-4 text-center min-w-[80px] transition-colors
  ${canInputAHB ? "bg-blue-50/50 text-blue-600" : "bg-gray-50 text-gray-300"}`}>
                <div className="flex items-center justify-center gap-1">
                  AHB
                  {!canInputAHB && (
                    <svg width={11} height={11} viewBox="0 0 16 16" fill="none" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                      <path d="M4 7V5a4 4 0 118 0v2M3 7h10a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z" />
                    </svg>
                  )}
                </div>
              </th>
              <th className={`p-4 text-center min-w-[80px] transition-colors
  ${canInputASAS ? "bg-orange-50/50 text-orange-600" : "bg-gray-50 text-gray-300"}`}>
                <div className="flex items-center justify-center gap-1">
                  {asasLabel}
                  {!canInputASAS && (
                    <svg width={11} height={11} viewBox="0 0 16 16" fill="none" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                      <path d="M4 7V5a4 4 0 118 0v2M3 7h10a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="p-4 text-center min-w-[80px] bg-purple-50/50 text-purple-600">NA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s, index) => {
              const { rataRata, progress } = calculateSiswaData(s.id);
              return (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="p-4 text-[11px] text-center font-bold text-gray-300">{index + 1}</td>
                  <td className="p-4 text-[12px] font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-100">{s.nama}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${progress === 100 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{progress}%</span>
                      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </td>
                  {currentLPs.map(lp => (
                    <td key={lp.id} className="p-2 text-center">
                      <input type="number" defaultValue={gridData[`${s.id}-${lp.id}`]?.val || ""} disabled={isLocked}
                        onBlur={(e) => handleCellChange(s.id, e.target.value, "lp", lp.id)}
                        className="w-14 p-2 border border-gray-100 rounded-lg text-center text-[12px] focus:ring-2 focus:ring-blue-400 outline-none transition-all" />
                    </td>
                  ))}
                  <td className="p-2 bg-blue-50/10 text-center">
                    <input type="number" defaultValue={gridData[`${s.id}-ahb`]?.val || ""} disabled={isLocked || !canInputAHB}
                      onBlur={(e) => handleCellChange(s.id, e.target.value, "ahb")}
                      className={`w-14 p-2 border rounded-lg text-center text-[12px] font-bold text-blue-600 outline-none ${!canInputAHB ? 'bg-gray-100 opacity-30 cursor-not-allowed' : 'border-blue-100 focus:ring-2 focus:ring-blue-400'}`} />
                  </td>
                  <td className="p-2 bg-orange-50/10 text-center">
                    <input type="number" defaultValue={gridData[`${s.id}-${asasJenis}`]?.val || ""} disabled={isLocked || !canInputASAS}
                      onBlur={(e) => handleCellChange(s.id, e.target.value, asasJenis)}
                      className={`w-14 p-2 border rounded-lg text-center text-[12px] font-bold text-orange-600 outline-none ${!canInputASAS ? 'bg-gray-100 opacity-30 cursor-not-allowed' : 'border-orange-100 focus:ring-2 focus:ring-orange-400'}`} />
                  </td>
                  <td className="p-2 bg-purple-50/20 text-center font-black text-purple-700 text-[13px]">{rataRata}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUBPAGE: LINGKUP PELAJARAN (LP) ---
function SubPageLingkupPelajaran({ mapelRecords, lpRecords, onRefresh }) {
  const [selectedMapelId, setSelectedMapelId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLP, setNewLP] = useState({ nama: "", urutan: 1, semester: "1" });

  useEffect(() => {
    if (mapelRecords.length > 0 && !selectedMapelId) setSelectedMapelId(mapelRecords[0].id);
  }, [mapelRecords, selectedMapelId]);

  const filteredLP = useMemo(() => lpRecords.filter(lp => lp.mapel_id === selectedMapelId), [lpRecords, selectedMapelId]);

  const handleAddLP = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("lingkup_pelajaran").create({ ...newLP, mapel_id: selectedMapelId });
      setShowAddModal(false);
      onRefresh();
    } catch (err) { alert("Gagal"); }
  };

  const handleDeleteLP = async (id) => {
    if (confirm("Hapus materi ini?")) {
      try { await pb.collection("lingkup_pelajaran").delete(id); onRefresh(); } catch (err) { alert("Gagal"); }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
        <select value={selectedMapelId} onChange={e => setSelectedMapelId(e.target.value)}
          className="text-[12px] font-bold bg-gray-50 p-2.5 rounded-lg border border-gray-200 outline-none">
          {mapelRecords.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-bold shadow-md hover:bg-blue-700">
          <Icon d={icons.plus} /> Tambah Materi
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4 w-12 text-center">No</th>
              <th className="p-4 w-20">Urutan</th>
              <th className="p-4 w-24">Sem</th>
              <th className="p-4">Materi</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[13px]">
            {filteredLP.sort((a, b) => a.urutan - b.urutan).map((lp, idx) => (
              <tr key={lp.id} className="hover:bg-gray-50">
                <td className="p-4 text-center text-gray-400">{idx + 1}</td>
                <td className="p-4 font-bold text-gray-400 text-center">LP {lp.urutan}</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">Sem {lp.semester}</span></td>
                <td className="p-4 font-medium text-gray-700">{lp.nama}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteLP(lp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Icon d={icons.trash} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-[14px] font-bold mb-4">Tambah Materi</h3>
            <form onSubmit={handleAddLP} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400">URUTAN</label>
                  <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]" value={newLP.urutan} onChange={e => setNewLP({ ...newLP, urutan: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400">SEMESTER</label>
                  <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]" value={newLP.semester} onChange={e => setNewLP({ ...newLP, semester: e.target.value })}>
                    <option value="1">1 (Ganjil)</option>
                    <option value="2">2 (Genap)</option>
                  </select>
                </div>
              </div>
              <input required placeholder="Deskripsi Materi" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]" value={newLP.nama} onChange={e => setNewLP({ ...newLP, nama: e.target.value })} />
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-[12px]">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE ---
export default function AdminNilaiPage() {
  const { loading: dataLoading } = useAdminData();
  const [activeTab, setActiveTab] = useState("input");
  const [mapelRecords, setMapelRecords] = useState([]);
  const [lpRecords, setLpRecords] = useState([]);
  const [existingNilai, setExistingNilai] = useState([]);
  const [siswaFiltered, setSiswaFiltered] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  const currentUser = pb.authStore.model;
  const userKelasId = currentUser?.kelas_id;

  const fetchData = async () => {
    if (!userKelasId) { setLoading(false); return; }
    try {
      const configRecord = await pb.collection("pengaturan_ajaran").getFirstListItem('', { sort: '-created' })
        .catch(() => ({ is_active: true, tahap_penilaian: "harian" }));

      const [m, l, n, s] = await Promise.all([
        pb.collection("mata_pelajaran").getFullList({ sort: "nama" }),
        pb.collection("lingkup_pelajaran").getFullList({ sort: "urutan" }),
        pb.collection("nilai").getFullList({ filter: `diinput_oleh = "${currentUser.id}"` }),
        pb.collection("siswa").getFullList({ filter: `kelas_id = "${userKelasId}"`, sort: "nama" }),
      ]);

      setConfig(configRecord);
      setMapelRecords(m);
      setLpRecords(l);
      setExistingNilai(n);
      setSiswaFiltered(s);
    } catch (err) { console.error("Sync Error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setHasMounted(true); fetchData(); }, [userKelasId]);

  if (!hasMounted || loading || dataLoading) return <div className="p-20 text-center text-gray-400 animate-pulse text-[12px]">Singkronisasi Data...</div>;
  if (!userKelasId) return <div className="p-20 text-center text-red-400 text-[12px] font-bold">Wali Kelas belum ditentukan.</div>;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
      {config && config.is_active === false && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
          <div className="bg-red-100 p-2 rounded-lg"><Icon d={icons.lock} size={18} /></div>
          <div>
            <h4 className="text-[13px] font-bold">Input Nilai Dikunci</h4>
            <p className="text-[11px] opacity-80">Sistem sedang dinonaktifkan oleh Admin.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit shadow-inner">
        <button onClick={() => setActiveTab("input")} className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === "input" ? "bg-white shadow-md text-blue-600" : "text-gray-500"}`}>Penilaian</button>
        <button onClick={() => setActiveTab("lp")} className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === "lp" ? "bg-white shadow-md text-blue-600" : "text-gray-500"}`}>Materi Pelajaran</button>
      </div>

      {activeTab === "input" ? (
        <SubPageInputNilai
          config={config}
          students={siswaFiltered}
          mapelRecords={mapelRecords}
          lpRecords={lpRecords}
          existingNilai={existingNilai}
          onRefresh={fetchData}
        />
      ) : (
        <SubPageLingkupPelajaran
          mapelRecords={mapelRecords}
          lpRecords={lpRecords}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}