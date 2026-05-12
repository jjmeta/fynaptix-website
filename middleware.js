export const config = {
  matcher: '/private/:path*',
}

export default function middleware(request) {
  const { pathname } = new URL(request.url)

  // Always allow the login page through
  if (pathname === '/private/login.html' || pathname === '/private/login') {
    return
  }

  // Parse cookies
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k.trim(), v.join('=')]
    })
  )

  const token = cookies['fynaptix-hub']
  const expected = process.env.COOKIE_TOKEN

  if (!token || !expected || token !== expected) {
    return Response.redirect(new URL('/private/login.html', request.url))
  }
}
