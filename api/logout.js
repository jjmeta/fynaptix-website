export const config = {
  runtime: 'edge',
}

export default function handler() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/private/login.html',
      'Set-Cookie': 'fynaptix-hub=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
  })
}
