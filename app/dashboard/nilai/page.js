"use client";

import { useState, useEffect, useMemo } from "react";
import pb from "@/lib/pocketbase";
import { useAdminData } from "@/hooks/useAdminData";

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
};

// --- SUBPAGE: LINGKUP PELAJARAN (LP) ---
function SubPageLingkupPelajaran({ mapelRecords, lpRecords, onRefresh }) {
  const [selectedMapelId, setSelectedMapelId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLP, setNewLP] = useState({ nama: "", urutan: 1, semester: "1" });

  useEffect(() => {
    if (mapelRecords.length > 0 && !selectedMapelId) setSelectedMapelId(mapelRecords[0].id);
  }, [mapelRecords, selectedMapelId]);

  const filteredLP = useMemo(() => 
    lpRecords.filter(lp => lp.mapel_id === selectedMapelId),
  [lpRecords, selectedMapelId]);

  const handleAddLP = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("lingkup_pelajaran").create({
        ...newLP,
        mapel_id: selectedMapelId,
      });
      setShowAddModal(false);
      setNewLP({ nama: "", urutan: lpRecords.length + 1, semester: "1" });
      onRefresh();
    } catch (err) { alert("Gagal menambah LP"); }
  };

  const handleDeleteLP = async (id) => {
    if (confirm("Hapus Lingkup Pelajaran ini?")) {
      try {
        await pb.collection("lingkup_pelajaran").delete(id);
        onRefresh();
      } catch (err) { alert("Gagal menghapus"); }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
        <select value={selectedMapelId} onChange={e => setSelectedMapelId(e.target.value)}
          className="text-[12px] font-bold bg-gray-50 p-2.5 rounded-lg border border-gray-200 outline-none">
          {mapelRecords.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition-all shadow-md">
          <Icon d={icons.plus} /> Tambah Lingkup Materi
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4 w-12 text-center">No</th>
              <th className="p-4 w-20">Urutan</th>
              <th className="p-4 w-24">Sem</th>
              <th className="p-4">Deskripsi Lingkup Materi</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[13px]">
            {filteredLP.sort((a,b) => a.urutan - b.urutan).map((lp, idx) => (
              <tr key={lp.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center text-gray-400 font-medium">{idx + 1}</td>
                <td className="p-4 font-bold text-gray-400 text-center">LP {lp.urutan}</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase">Smstr {lp.semester}</span></td>
                <td className="p-4 font-medium text-gray-700">{lp.nama}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteLP(lp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Icon d={icons.trash} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add LP tetap sama */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-[14px] font-bold mb-4 text-gray-800">Tambah Lingkup Materi</h3>
            <form onSubmit={handleAddLP} className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase">Nama Lingkup/Materi</label>
                <input required placeholder="Contoh: Operasi Hitung Campuran" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-500" 
                  value={newLP.nama} onChange={e => setNewLP({...newLP, nama: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Semester</label>
                  <select className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]" value={newLP.semester} onChange={e => setNewLP({...newLP, semester: e.target.value})}>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Urutan</label>
                  <input type="number" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]" value={newLP.urutan} onChange={e => setNewLP({...newLP, urutan: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg text-[12px] font-bold text-gray-600">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-[12px] font-bold shadow-md hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBPAGE: INPUT NILAI ---
function SubPageInputNilai({ students, mapelRecords, lpRecords, existingNilai, onRefresh }) {
  const [mapelId, setMapelId] = useState("");
  const [semester, setSemester] = useState("1");
  const [gridData, setGridData] = useState({});

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
    const numVal = parseFloat(val) || 0;
    const key = lpId ? `${siswaId}-${lpId}` : `${siswaId}-${type}`;
    const existing = gridData[key];
    
    const payload = {
      siswa_id: siswaId,
      semester: semester,
      jenis: type,
      nilai: numVal,
      lp_id: lpId,
      tahun_ajaran: "2024/2025",
      diinput_oleh: pb.authStore.model?.id
    };

    try {
      if (existing?.id) {
        await pb.collection("nilai").update(existing.id, payload);
      } else {
        await pb.collection("nilai").create(payload);
      }
      onRefresh();
    } catch (err) { console.error("Gagal simpan"); }
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
              <button key={s} onClick={() => setSemester(s)} className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${semester === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>Sem {s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4 w-10 text-center">No</th>
              <th className="p-4 sticky left-0 bg-gray-50 z-10 border-r border-gray-100">Nama Siswa</th>
              {currentLPs.sort((a,b) => a.urutan - b.urutan).map((lp) => <th key={lp.id} className="p-4 text-center min-w-[100px]">LP {lp.urutan}</th>)}
              <th className="p-4 text-center min-w-[80px]">AHB</th>
              <th className="p-4 text-center min-w-[80px]">{semester === "1" ? "ASAS" : "ASAT"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s, index) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="p-4 text-[11px] text-center font-bold text-gray-300">{index + 1}</td>
                <td className="p-4 text-[12px] font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-100">{s.nama}</td>
                {currentLPs.map(lp => (
                  <td key={lp.id} className="p-2 text-center">
                    <input type="number" defaultValue={gridData[`${s.id}-${lp.id}`]?.val || ""} 
                      onBlur={(e) => handleCellChange(s.id, e.target.value, "lp", lp.id)}
                      className="w-14 p-2 border border-gray-100 rounded-lg text-center text-[12px] focus:border-blue-400 outline-none transition-all" />
                  </td>
                ))}
                <td className="p-2">
                   <input type="number" defaultValue={gridData[`${s.id}-ahb`]?.val || ""} onBlur={(e) => handleCellChange(s.id, e.target.value, "ahb")}
                     className="w-14 mx-auto block p-2 border border-blue-100 bg-blue-50/30 rounded-lg text-center text-[12px] font-bold text-blue-600 outline-none" />
                </td>
                <td className="p-2">
                   <input type="number" defaultValue={gridData[`${s.id}-${semester === "1" ? "asas" : "asat"}`]?.val || ""} onBlur={(e) => handleCellChange(s.id, e.target.value, semester === "1" ? "asas" : "asat")}
                     className="w-14 mx-auto block p-2 border border-purple-100 bg-purple-50/30 rounded-lg text-center text-[12px] font-bold text-purple-600 outline-none" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function AdminNilaiPage() {
  const { loading: dataLoading } = useAdminData(); // Gunakan data loading saja
  const [activeTab, setActiveTab] = useState("input");
  const [mapelRecords, setMapelRecords] = useState([]);
  const [lpRecords, setLpRecords] = useState([]);
  const [existingNilai, setExistingNilai] = useState([]);
  const [siswaFiltered, setSiswaFiltered] = useState([]); // State untuk siswa di kelas guru
  const [loading, setLoading] = useState(true);

  // Ambil data user yang login
  const currentUser = pb.authStore.model;
  const userKelasId = currentUser?.kelas_id;

  const fetchData = async () => {
    if (!userKelasId) {
      setLoading(false);
      return;
    }

    try {
      // Filter data agar HANYA mengambil yang berkaitan dengan kelas guru ini
      const [m, l, n, s] = await Promise.all([
        pb.collection("mata_pelajaran").getFullList({ 
          sort: "nama" 
        }),
        pb.collection("lingkup_pelajaran").getFullList({ 
          sort: "urutan" 
        }),
        pb.collection("nilai").getFullList({ 
          // Filter nilai yang diinput oleh guru ini
          filter: `diinput_oleh = "${currentUser.id}"` 
        }),
        pb.collection("siswa").getFullList({
          // HANYA ambil siswa yang kelasnya sama dengan guru
          filter: `kelas_id = "${userKelasId}"`,
          sort: "nama"
        })
      ]);

      setMapelRecords(m);
      setLpRecords(l);
      setExistingNilai(n);
      setSiswaFiltered(s);
    } catch (err) { 
      console.error("Gagal sinkronisasi:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [userKelasId]);

  if (!userKelasId) return <div className="p-20 text-center text-red-400 text-[12px]">Anda belum ditetapkan sebagai Wali Kelas.</div>;
  if (loading || dataLoading) return <div className="p-20 text-center text-gray-400 animate-pulse text-[12px]">Sinkronisasi Database...</div>;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
      {/* Tab Selector tetap sama */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button onClick={() => setActiveTab("input")} className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === "input" ? "bg-white shadow-md text-blue-600" : "text-gray-500"}`}>Input Nilai</button>
        <button onClick={() => setActiveTab("lp")} className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === "lp" ? "bg-white shadow-md text-blue-600" : "text-gray-500"}`}>Lingkup Pelajaran</button>
      </div>

      {activeTab === "input" ? (
        <SubPageInputNilai 
            students={siswaFiltered} // Gunakan siswa yang sudah difilter
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