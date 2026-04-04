import { pb } from "@/lib/pocketbase";

export async function createLog({
  aksi,
  koleksi,
  record_id,
  detail,
}) {
  try {
    const user = pb.authStore.model;

    await pb.collection("system_log").create({
      user_id: user?.id || null,
      aksi,
      koleksi,
      record_id,
      detail,
      ip_address: "-", // nanti bisa pakai API kalau mau real IP
    });
  } catch (err) {
    console.error("Gagal log:", err);
  }
}