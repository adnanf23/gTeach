'use client';
import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';

export default function PengaturanAjaranPage() {
  const [formData, setFormData] = useState({
    id: null,
    tahun_mulai: new Date().getFullYear(),
    semester_aktif: "1",
    tahap_penilaian: "harian",
    mulai: "", 
    selesai: "", 
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const record = await pb.collection('pengaturan_ajaran').getFirstListItem('', {
        sort: '-created',
      });
      
      if (record && record.tahun_ajaran) {
        // Pisahkan "2023/2024" menjadi 2023
        const yearPart = record.tahun_ajaran.split('/')[0];
        const parsedYear = parseInt(yearPart);

        setFormData({
          id: record.id,
          tahun_mulai: isNaN(parsedYear) ? new Date().getFullYear() : parsedYear,
          semester_aktif: record.semester_aktif || "1",
          tahap_penilaian: record.tahap_penilaian || "harian",
          // Ambil YYYY-MM-DD saja dari string tanggal PocketBase
          mulai: record.mulai ? record.mulai.split(' ')[0] : "", 
          selesai: record.selesai ? record.selesai.split(' ')[0] : "",
          is_active: record.is_active
        });
      }
    } catch (err) {
      console.log("Belum ada pengaturan, menggunakan nilai default.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi tambahan sebelum kirim
    if (isNaN(formData.tahun_mulai)) {
      alert("Tahun ajaran harus berupa angka!");
      return;
    }

    setIsSaving(true);
    const tahunAjaranStr = `${formData.tahun_mulai}/${formData.tahun_mulai + 1}`;
    
    const payload = {
      tahun_ajaran: tahunAjaranStr,
      semester_aktif: formData.semester_aktif,
      tahap_penilaian: formData.tahap_penilaian,
      mulai: `${formData.mulai} 00:00:00`,
      selesai: `${formData.selesai} 23:59:59`,
      is_active: formData.is_active,
      diatur_oleh: pb.authStore.model?.id,
    };

    try {
      if (formData.id) {
        await pb.collection('pengaturan_ajaran').update(formData.id, payload);
        alert("Konfigurasi Berhasil Diperbarui!");
      } else {
        await pb.collection('pengaturan_ajaran').create(payload);
        alert("Konfigurasi Baru Berhasil Dibuat!");
        fetchData();
      }
    } catch (err) {
      console.error("Detail Error:", err.data);
      alert("Gagal menyimpan: " + (err.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center text-gray-400">Sinkronisasi...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Ajaran</h1>
          <p className="text-sm text-gray-500">Tentukan periode aktif untuk penginputan nilai</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* TAHUN AJARAN */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Tahun Ajaran Aktif</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  // Proteksi NaN: Jika tahun_mulai adalah NaN, tampilkan string kosong
                  value={isNaN(formData.tahun_mulai) ? "" : formData.tahun_mulai}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, tahun_mulai: isNaN(val) ? "" : val});
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 2024"
                  required
                />
                <span className="text-xl font-bold text-gray-300">/</span>
                <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium">
                  {/* Tampilkan tahun depan hanya jika tahun_mulai valid */}
                  {!isNaN(formData.tahun_mulai) && formData.tahun_mulai !== "" ? formData.tahun_mulai + 1 : "-"}
                </div>
              </div>
            </div>

            {/* TANGGAL PERIODE */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Tanggal Mulai Input</label>
                <input 
                  type="date" 
                  required
                  value={formData.mulai}
                  onChange={(e) => setFormData({...formData, mulai: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Tanggal Akhir Input</label>
                <input 
                  type="date" 
                  required
                  value={formData.selesai}
                  onChange={(e) => setFormData({...formData, selesai: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* SEMESTER */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Semester</label>
                <select 
                  value={formData.semester_aktif}
                  onChange={(e) => setFormData({...formData, semester_aktif: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>

              {/* TAHAP PENILAIAN */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Tahap Penilaian</label>
                <select 
                  value={formData.tahap_penilaian}
                  onChange={(e) => setFormData({...formData, tahap_penilaian: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="harian">Formatif / Harian</option>
                  <option value="ahb">AHB (Asesmen Hari Belajar)</option>
                  <option value="akhir_semester">ASAS / ASAT (Akhir Semester)</option>
                </select>
              </div>
            </div>

            {/* STATUS SISTEM */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div>
                <p className="text-sm font-bold text-amber-800">Aktivasi Global</p>
                <p className="text-[11px] text-amber-600">Jika dinonaktifkan, guru tidak bisa mengubah nilai apapun.</p>
              </div>
              <input 
                type="checkbox" 
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-6 h-6 accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-10 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Memproses...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}