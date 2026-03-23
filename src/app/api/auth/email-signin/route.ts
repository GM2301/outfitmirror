import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserIdForDb } from '@/lib/supabase/user-utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Ensure user exists in users table (for users who signed up before we added this check)
  if (data.user) {
    try {
      const adminClient = createAdminClient()
      const userId = getUserIdForDb(data.user.id, true)
      
      const { data: existingUser, error: checkError } = await adminClient
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user in signin:', checkError)
      }

      if (!existingUser) {
        console.log('User not found in users table during signin, creating...')
        const fullName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name || 
                        data.user.email?.split('@')[0] || 
                        'User'
        const username = data.user.email?.split('@')[0] || 
                        `user_${data.user.id.slice(0, 8)}`

        const { error: insertError } = await adminClient
          .from('users')
          .insert({
            id: userId,
            full_name: fullName,
            username: username,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            plan: 'free',
            onboarding_done: 'false',
          })

        if (insertError) {
          console.error('Error creating user record in signin:', insertError)
        } else {
          console.log('User record created successfully in signin')
        }
      }
    } catch (error) {
      console.error('Error in signin user creation check:', error)
      // Don't fail the signin if user creation fails
    }
  }

  return NextResponse.json({ user: data.user })
}
