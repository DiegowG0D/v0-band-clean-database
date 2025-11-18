import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = 
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/customer/auth/")

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !isPublicRoute
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role;
    const pathname = request.nextUrl.pathname;

    if (userRole === 'customer' && (pathname.startsWith('/admin') || pathname.startsWith('/cleaner'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/customer/dashboard';
      return NextResponse.redirect(url);
    }

    if (userRole === 'cleaner' && (pathname.startsWith('/admin') || pathname.startsWith('/customer'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/cleaner';
      return NextResponse.redirect(url);
    }

    if (userRole === 'admin' && (pathname.startsWith('/cleaner') || pathname.startsWith('/customer'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return supabaseResponse;
}
