export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { password } = body
  const correctPassword = process.env.PRIVATE_PASSWORD
  const cookieToken = process.env.COOKIE_TOKEN

  if (!correctPassword || !cookieToken) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!password || password !== correctPassword) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const maxAge = 7 * 24 * 60 * 60 // 7 days

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `fynaptix-hub=${cookieToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`,
    },
  })
}
