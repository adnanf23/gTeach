// hooks/useAdminData.js
"use client";

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";

/**
 * Fetch semua data untuk Admin Dashboard
 */
export function useAdminData() {
  const [data, setData] = useState({
    kelas: [],
    siswa: [],
    pengajaran: [],
    absensi: [],
    nilai: [],
    guru: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        const now = new Date();
        const awalBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const akhirBulan = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

        const [kelas, siswa, pengajaran, absensi, nilai, guru] = await Promise.all([
          pb.collection("kelas").getFullList({
            expand: "walikelas_id",
            sort: "tingkat,nama",
          }),
          pb.collection("siswa").getFullList({
            filter: "aktif = true",
            expand: "kelas_id",
            sort: "nama",
          }),
          pb.collection("pengajaran").getFullList({
            filter: "aktif = true",
            expand: "guru_id,mapel_id,kelas_id",
          }),
          pb.collection("absensi").getFullList({
            filter: `tanggal >= "${awalBulan}" && tanggal < "${akhirBulan}"`,
            expand: "siswa_id,pengajaran_id.kelas_id",
          }),
          pb.collection("nilai").getFullList({
            expand: "siswa_id,pengajaran_id.kelas_id,pengajaran_id.mapel_id",
          }),
          pb.collection("users").getFullList({
            filter: 'role = "guru"',
            sort: "name",
          }),
        ]);

        setData({ kelas, siswa, pengajaran, absensi, nilai, guru, loading: false, error: null });
      } catch (err) {
        console.error("useAdminData error:", err);
        setData((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    }

    fetchAll();
  }, []);

  return data;
}

/**
 * HELPER: Fungsi ini WAJIB diekspor karena dibutuhkan oleh app/admin/page.js
 * Menghitung statistik per kelas dari data mentah
 */
export function hitungStatistikKelas(kelasId, { siswa, absensi, nilai, pengajaran }) {
  // 1. Filter Siswa di kelas ini
  const siswaKelas = siswa.filter((s) => {
    const sKelasId = typeof s.kelas_id === 'string' ? s.kelas_id : s.kelas_id?.id;
    return sKelasId === kelasId;
  });
  
  const jumlahSiswa = siswaKelas.length;
  const siswaIds = new Set(siswaKelas.map((s) => s.id));

  // 2. Absensi: Hitung presentase hadir
  const absensiKelas = absensi.filter((a) => {
    const aSiswaId = typeof a.siswa_id === 'string' ? a.siswa_id : a.siswa_id?.id;
    return siswaIds.has(aSiswaId);
  });
  
  const totalAbsensi = absensiKelas.length;
  const totalHadir = absensiKelas.filter((a) => a.status === "hadir").length;
  const pctHadir = totalAbsensi > 0 ? Math.round((totalHadir / totalAbsensi) * 100) : 0;

  // 3. Nilai rata-rata kelas (jenis LP/Laporan Pendidikan)
  const nilaiKelas = nilai.filter((n) => {
    const nSiswaId = typeof n.siswa_id === 'string' ? n.siswa_id : n.siswa_id?.id;
    return siswaIds.has(nSiswaId) && n.jenis === "lp";
  });
  
  const rataRata = nilaiKelas.length > 0
      ? Math.round(nilaiKelas.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiKelas.length)
      : 0;

  // 4. Jumlah guru yang mengajar di kelas ini
  const guruKelas = [...new Set(
    pengajaran
      .filter((p) => {
        const pKelasId = typeof p.kelas_id === 'string' ? p.kelas_id : p.kelas_id?.id;
        return pKelasId === kelasId;
      })
      .map((p) => (typeof p.guru_id === 'string' ? p.guru_id : p.guru_id?.id))
  )].filter(Boolean).length;

  return { jumlahSiswa, pctHadir, rataRata, guruKelas };
}