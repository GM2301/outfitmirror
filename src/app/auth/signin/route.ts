import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/app'

  // Build the redirect URL properly - force port 8000
  const baseUrl = process.env.APP_URL || 'http://localhost:8000'
  // Ensure we're using port 8000, not 3000
  const finalBaseUrl = baseUrl.includes('localhost:3000') 
    ? baseUrl.replace('localhost:3000', 'localhost:8000')
    : baseUrl
  const redirectTo = `${finalBaseUrl}/auth/callback?next=${encodeURIComponent(next)}`
  
  console.log('OAuth redirect URL:', redirectTo)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('OAuth error:', error)
    // Provide helpful error message if provider is not enabled
    if (error.message?.includes('not enabled') || error.message?.includes('Unsupported provider')) {
      return NextResponse.json(
        { 
          error: 'Google OAuth is not enabled. Please enable it in Supabase Dashboard → Authentication → Providers → Google' 
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
}
