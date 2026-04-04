    "use client";

    import H1 from "@/components/atoms/heading/heading";
    import Paragraph from "@/components/atoms/paragraph/paragraph";
    import Image from "next/image";
    import { useRouter } from "next/navigation";
    import  pb  from "@/lib/pocketbase";
    import { useState } from "react";



    export default function LoginPage() {
        const router = useRouter();
        const [showPassword, setShowPassword] = useState(false);
        const [form, setForm] = useState({ username: "", password: "" });
        const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        await pb.collection("users").authWithPassword(
        form.username.trim(),
        form.password
        );

        router.push("/dashboard"); // 🔥 satu pintu
        router.refresh();
    } catch (err) {
        setError("Username atau password salah");
        setLoading(false);
    }
    };

        return (
            <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 overflow-hidden relative">

                {/* Main card container */}
                <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center gap-8 md:gap-0 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">

                    {/* ── LEFT: Login Form ── */}
                    <div className="w-full md:w-1/2 px-8 py-12 md:px-12 flex flex-col justify-center">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 mb-10">
                            <span className="text-gray-800 font-semibold text-sm tracking-wide">gTeach Space</span>
                        </div>

                        <H1>Silahkan Masuk</H1>
                        <Paragraph>Masuk dengan username dan password yang telah disiapkan.</Paragraph><br />

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Username */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-gray-500 text-xs font-medium tracking-wider uppercase">Username</label>
                                <div className="relative group">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#4a90d9] transition-colors duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="your.username"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-[#4a90d9] text-gray-800 placeholder-[#929292] rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4a90d9]/20"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-gray-500 text-xs font-medium tracking-wider uppercase">Password</label>
                                <div className="relative group">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#4a90d9] transition-colors duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-[#4a90d9] text-gray-800 placeholder-[#929292] rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4a90d9]/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#4a90d9] transition-colors duration-150"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>


                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative  mt-1 w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 disabled:opacity-70 group"
                                style={{
                                    background: "linear-gradient(135deg, #1a5fa8 0%, #4a90d9 100%)",
                                    boxShadow: "0 4px 20px rgba(74,144,217,0.25)",
                                }}
                            >
                                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 group-active:bg-white/20 transition-colors duration-200 rounded-xl" />
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Signing in…
                                    </span>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        {/* Footer note */}
                        <p className="text-black text-xs text-center mt-8">
                            © {new Date().getFullYear()} EduSpace. All rights reserved.
                        </p>
                    </div>

                    {/* ── DIVIDER (desktop only) ── */}
                    <div className="hidden md:block w-px self-stretch bg-gradient-to-b from-transparent via-gray-100 to-transparent" />

                    {/* ── RIGHT: Teacher Illustration ── */}
                    <div className="w-full hidden md:block md:w-1/2 flex flex-col items-center justify-center px-8 py-12 relative min-h-[320px] md:min-h-0">
                        <Image
                            src="/vektor/image-login.png"
                            alt="Contoh"
                            width={400}
                            height={300}
                            priority
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>
        );
    }