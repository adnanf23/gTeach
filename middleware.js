  import { NextResponse } from "next/server";

  export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Ambil auth cookie PocketBase
    const pbCookie = request.cookies.get("pb_auth");

    // Parsing auth dari cookie
    let authData = null;
    if (pbCookie?.value) {
      try {
        authData = JSON.parse(decodeURIComponent(pbCookie.value));
      } catch {
        authData = null;
      }
    }

    const isLoggedIn = !!authData?.token;
    const userRole = authData?.model?.role;

    // Redirect ke /login jika belum login
    if (!isLoggedIn && pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Jika sudah login tapi buka /login, arahkan ke dashboard sesuai role
    if (isLoggedIn && pathname === "/login") {
      if (userRole === "admin" || userRole === "it") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Proteksi route /admin hanya untuk role admin & it
    if (pathname.startsWith("/admin")) {
      if (userRole !== "admin" && userRole !== "it") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  }

  export const config = {
    matcher: ["/login", "/dashboard/:path*", "/admin/:path*"],
  };