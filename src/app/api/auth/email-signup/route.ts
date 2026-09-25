import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserIdForDb } from '@/lib/supabase/user-utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  
  // Sign up the user - disable email confirmation to avoid rate limits
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
      emailRedirectTo: `${process.env.APP_URL || 'http://localhost:8000'}/auth/callback`,
    },
  })

  if (authError) {
    console.error('Auth signup error:', authError)
    // For rate limit errors, suggest using Google auth instead
    if (authError.message.toLowerCase().includes('rate limit') || 
        authError.message.toLowerCase().includes('email rate limit')) {
      return NextResponse.json(
        { error: 'Please use Google sign up instead, or try again in a few minutes.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    )
  }

  // Create user record in the users table using admin client to bypass RLS.
  // users.id is a plain uuid matching auth.users.id (verified live against
  // the schema) - useBigInt=true was converting it into an unrelated
  // decimal string, which Postgres rejects for a uuid column, so this
  // insert failed on every single signup (a Postgres trigger on auth.users
  // was silently doing the real profile creation instead). upsert with
  // ignoreDuplicates so this stays a harmless no-op when that trigger (or
  // this same insert on a retried request) already created the row.
  try {
    const adminClient = createAdminClient()
    const userId = getUserIdForDb(authData.user.id, false)

    const { error: dbError } = await adminClient
      .from('users')
      .upsert({
        id: userId,
        full_name: fullName || '',
        username: email.split('@')[0], // Use email prefix as default username
        plan: 'free',
        onboarding_done: 'false',
      }, { onConflict: 'id', ignoreDuplicates: true })

    if (dbError) {
      console.error('Error creating user record:', dbError)
      // If user record creation fails, we should still return success
      // but log the error for debugging
      return NextResponse.json(
        { 
          user: authData.user,
          warning: 'User account created but profile setup failed. Please contact support.',
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Error creating admin client or user record:', error)
    return NextResponse.json(
      { 
        user: authData.user,
        warning: 'User account created but profile setup failed. Please contact support.',
      },
      { status: 201 }
    )
  }

  return NextResponse.json({ user: authData.user }, { status: 201 })
}
