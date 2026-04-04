// lib/pocketbase.js
import PocketBase from "pocketbase";

// Singleton agar tidak ada multiple instance
// Ganti dengan IP Publik AWS Anda
const pb = new PocketBase('https://wealth-locks-portraits-aluminium.trycloudflare.com');

export function setAuthCookie(authData) {
  const value = encodeURIComponent(
    JSON.stringify({
      token: authData.token,
      model: authData.record,
    })
  );
  // httpOnly tidak bisa di-set dari client, tapi cukup untuk middleware
  document.cookie = `pb_auth=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = "pb_auth=; path=/; max-age=0";
}

// Auto-refresh token saat hampir expired
pb.autoCancellation(false);

export default pb ;