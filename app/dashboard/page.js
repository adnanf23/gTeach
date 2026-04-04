"use client"

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement, // Tambahkan ini
  LineElement,  // Tambahkan ini
  Title,
  Tooltip,
  Legend,
  Filler // Untuk efek area di bawah garis (opsional)
} from 'chart.js';
import { Line } from 'react-chartjs-2'; // Ubah dari Bar ke Line

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PageOverview() {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    rataRataKelas: 0,
    persenAbsensi: 0,
    agendaTercatat: 0
  });
  const [bestSiswa, setBestSiswa] = useState({ nilai: null, absensi: null });
  const [absensiData, setAbsensiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const user = pb.authStore.model;
        if (!user || !user.kelas_id) {
           setLoading(false);
           return;
        }

        const guruId = user.id;
        const kelasId = user.kelas_id;

        const [siswa, nilai, absensi, agenda] = await Promise.all([
          pb.collection('siswa').getFullList({ filter: `aktif = true && kelas_id = "${kelasId}"` }),
          pb.collection('nilai').getFullList({ filter: `diinput_oleh = "${guruId}"` }),
          pb.collection('absensi').getFullList({ filter: `dicatat_oleh = "${guruId}"`, expand: 'siswa_id' }),
          pb.collection('agenda').getFullList({ filter: `dicatat_oleh = "${guruId}"` })
        ]);

        // --- Perhitungan Logika (Tetap Sama) ---
        const mapNilai = {};
        nilai.forEach(n => {
          if (!mapNilai[n.siswa_id]) mapNilai[n.siswa_id] = { total: 0, count: 0 };
          mapNilai[n.siswa_id].total += n.nilai;
          mapNilai[n.siswa_id].count += 1;
        });

        let topSiswaNilai = { nama: "-", skor: 0 };
        siswa.forEach(s => {
          const data = mapNilai[s.id];
          const rata = data ? data.total / data.count : 0;
          if (rata > topSiswaNilai.skor) {
            topSiswaNilai = { nama: s.nama, skor: rata.toFixed(1) };
          }
        });

        const mapAbsen = {};
        absensi.forEach(a => {
          if (!mapAbsen[a.siswa_id]) mapAbsen[a.siswa_id] = { hadir: 0, total: 0 };
          mapAbsen[a.siswa_id].total += 1;
          if (a.status === 'hadir') mapAbsen[a.siswa_id].hadir += 1;
        });

        let topSiswaAbsen = { nama: "-", persen: 0 };
        siswa.forEach(s => {
          const data = mapAbsen[s.id];
          const persen = data ? (data.hadir / data.total) * 100 : 0;
          if (persen > topSiswaAbsen.persen) {
            topSiswaAbsen = { nama: s.nama, persen: persen.toFixed(0) };
          }
        });

        const rekapAbsensi = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
        absensi.forEach(a => { if (rekapAbsensi.hasOwnProperty(a.status)) rekapAbsensi[a.status]++; });

        setStats({
          totalSiswa: siswa.length,
          rataRataKelas: nilai.length > 0 ? (nilai.reduce((acc, c) => acc + c.nilai, 0) / nilai.length).toFixed(1) : 0,
          persenAbsensi: absensi.length > 0 ? ((rekapAbsensi.hadir / absensi.length) * 100).toFixed(1) : 0,
          agendaTercatat: agenda.length
        });

        setBestSiswa({ nilai: topSiswaNilai, absensi: topSiswaAbsen });

    // --- Konfigurasi Chart Garis: Garis Biru & Poin Berwarna ---
setAbsensiData({
  labels: ['Hadir', 'Sakit', 'Izin', 'Alpha'],
  datasets: [{
    label: 'Jumlah',
    data: [rekapAbsensi.hadir, rekapAbsensi.sakit, rekapAbsensi.izin, rekapAbsensi.alpha],
    
    // Konfigurasi Garis (Biru)
    fill: true,
    borderColor: '#3b82f6', // Biru cerah (Tailwind blue-500)
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Biru transparan untuk area bawah
    tension: 0.4, // Garis melengkung halus
    borderWidth: 3, // Sedikit lebih tebal agar tegas
    
    // Konfigurasi Poin (Warna-warni)
    pointBackgroundColor: [
      '#10b981', // Hijau (Hadir)
      '#f59e0b', // Kuning (Sakit)
      '#3b82f6', // Biru (Izin)
      '#ef4444'  // Merah (Alpha)
    ],
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 6,
    pointHoverRadius: 8,
  }]
});

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400 font-medium">Menyusun data kelas Anda...</div>;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Siswa di Kelas" value={stats.totalSiswa} unit="Orang" color="text-blue-600" />
        <StatCard title="Rata-rata Nilai" value={stats.rataRataKelas} unit="Poin" color="text-emerald-600" />
        <StatCard title="Kehadiran" value={`${stats.persenAbsensi}%`} unit="Rata-rata" color="text-amber-600" />
        <StatCard title="Agenda Saya" value={stats.agendaTercatat} unit="Kegiatan" color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-6 text-[11px] uppercase tracking-widest">Tren Presensi Kelas</h3>
            <div className="h-[250px]">
              {absensiData && (
                <Line 
                  data={absensiData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: '#f9fafb' },
                        ticks: { stepSize: 1 }
                      },
                      x: {
                        grid: { display: false }
                      }
                    }
                  }} 
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BestSiswaCard type="Nilai Tertinggi" name={bestSiswa.nilai?.nama} score={`${bestSiswa.nilai?.skor} Poin`} icon="🏆" color="bg-emerald-50 text-emerald-700" />
            <BestSiswaCard type="Absensi Terbaik" name={bestSiswa.absensi?.nama} score={`${bestSiswa.absensi?.persen}% Hadir`} icon="⭐" color="bg-amber-50 text-amber-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-700 mb-6 text-[11px] uppercase tracking-widest">Kelengkapan Data</h3>
          <div className="space-y-6 flex-1">
            <ProgressItem label="Input Nilai" progress={stats.rataRataKelas > 0 ? 100 : 0} color="bg-emerald-500" />
            <ProgressItem label="Jurnal Agenda" progress={stats.agendaTercatat > 0 ? 100 : 0} color="bg-indigo-500" />
            <ProgressItem label="Rekap Absensi" progress={stats.persenAbsensi > 0 ? 100 : 0} color="bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Card, StatCard, & ProgressItem (Sama seperti sebelumnya)
function BestSiswaCard({ type, name, score, icon, color }) {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 bg-white">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{type}</p>
        <p className="text-[13px] font-bold text-gray-800 leading-tight">{name}</p>
        <p className="text-[11px] font-medium text-gray-500 mt-0.5">{score}</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <span className={`text-2xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] text-gray-400 font-bold uppercase">{unit}</span>
      </div>
    </div>
  );
}

function ProgressItem({ label, progress, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">{progress}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}