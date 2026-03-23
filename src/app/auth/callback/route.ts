import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserIdForDb } from '@/lib/supabase/user-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (errorParam) {
    console.error('OAuth callback error:', errorParam, errorDescription)
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent(error.message)}`)
    }
    
    if (data.user) {
      console.log('OAuth callback successful, user ID:', data.user.id)
      // Check if user record exists, if not create it using admin client
      const adminClient = createAdminClient()
      const userId = getUserIdForDb(data.user.id, true)
      console.log('Converted user ID for DB:', userId)
      
      // Check if user exists - handle both "not found" and actual errors
      let existingUser = null
      const { data: userData, error: checkError } = await adminClient
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (checkError) {
        // PGRST116 is "not found" which is fine, but log other errors
        if (checkError.code !== 'PGRST116') {
          console.error('Error checking existing user:', checkError)
        }
      } else {
        existingUser = userData
      }

      if (!existingUser) {
        console.log('User not found in users table, creating...')
        // Create user record using admin client to bypass RLS
        const fullName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name || 
                        data.user.email?.split('@')[0] || 
                        'User'
        const username = data.user.user_metadata?.preferred_username || 
                        data.user.email?.split('@')[0] || 
                        `user_${data.user.id.slice(0, 8)}`

        const { data: newUser, error: insertError } = await adminClient
          .from('users')
          .insert({
            id: userId,
            full_name: fullName,
            username: username,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            plan: 'free',
            onboarding_done: 'false',
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user record in callback:', insertError)
          // Don't fail the auth flow, but log the error
          // The user can still sign in, and we'll try to create the record on next login
        } else {
          console.log('User record created successfully in callback:', newUser)
        }
      } else {
        console.log('User already exists in users table')
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
