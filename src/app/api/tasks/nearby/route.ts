import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the authorization header or cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value ||
                        cookieStore.get('supabase-auth-token')?.value
    
    // Get user from the access token in the request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || accessToken
    
    let user = null
    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseInt(searchParams.get('radius') || '5000')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 })
    }

    // Get user profile to check verification status
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status, role')
      .eq('user_id', user.id)
      .single()

    // Allow freelancers or users with no role set (for testing)
    // Clients are not allowed to view nearby tasks
    if (profile?.role === 'client') {
      return NextResponse.json({ error: 'Only freelancers can view nearby tasks' }, { status: 403 })
    }

    // Call the PostGIS function to find nearby tasks
    const { data: nearbyTasks, error: funcError } = await supabase
      .rpc('find_nearby_tasks', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radius
      })

    if (funcError) {
      console.error('PostGIS function error:', funcError)
      
      // Fallback: Manual distance calculation
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          budget,
          category,
          mode,
          geo_location,
          address_text,
          client:client_id (
            full_name,
            average_rating,
            verification_status
          )
        `)
        .eq('status', 'open')
        .eq('is_nearby', true)

      if (tasksError) {
        console.error('Tasks query error:', tasksError)
        return NextResponse.json({ error: tasksError.message }, { status: 500 })
      }

      // Filter by distance manually (approximate)
      const tasksWithDistance = (allTasks || [])
        .map((task: any) => {
          if (!task.geo_location) return null
          
          // Parse PostGIS point
          const match = task.geo_location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)
          if (!match) return null
          
          const taskLng = parseFloat(match[1])
          const taskLat = parseFloat(match[2])
          
          // Haversine distance calculation
          const R = 6371e3
          const φ1 = (lat * Math.PI) / 180
          const φ2 = (taskLat * Math.PI) / 180
          const Δφ = ((taskLat - lat) * Math.PI) / 180
          const Δλ = ((taskLng - lng) * Math.PI) / 180
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          const distance = R * c

          return {
            ...task,
            distance_meters: distance
          }
        })
        .filter((task: any) => task && task.distance_meters <= radius)
        .sort((a: any, b: any) => a.distance_meters - b.distance_meters)

      return NextResponse.json({ 
        tasks: tasksWithDistance,
        verification_status: profile?.verification_status || 'none'
      })
    }

    // Get full task details for the nearby tasks
    if (nearbyTasks && nearbyTasks.length > 0) {
      const taskIds = nearbyTasks.map((t: any) => t.id)
      
      const { data: taskDetails } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          budget,
          category,
          mode,
          geo_location,
          address_text,
          acceptance_deadline,
          client:client_id (
            full_name,
            average_rating,
            verification_status
          )
        `)
        .in('id', taskIds)

      // Merge distance data
      const mergedTasks = (taskDetails || []).map((task: any) => {
        const nearbyData = nearbyTasks.find((t: any) => t.id === task.id)
        return {
          ...task,
          distance_meters: nearbyData?.distance_meters || 0
        }
      }).sort((a: any, b: any) => a.distance_meters - b.distance_meters)

      return NextResponse.json({ 
        tasks: mergedTasks,
        verification_status: profile?.verification_status || 'none'
      })
    }

    return NextResponse.json({ 
      tasks: [],
      verification_status: profile?.verification_status || 'none'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
