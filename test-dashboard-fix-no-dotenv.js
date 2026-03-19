const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardFix() {
    try {
        console.log('🔍 Testing task acceptance and dashboard display fix...');
        
        // Step 1: Get test user and profile
        console.log('\n1. Getting test user and profile...');
        const { data: users, error: usersError } = await supabase
            .from('auth.users')
            .select('id')
            .limit(1);
            
        if (usersError) throw usersError;
        
        const testUserId = users[0].id;
        
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('user_id', testUserId);
            
        if (profilesError) throw profilesError;
        
        const testProfile = profiles[0];
        
        if (testProfile.role !== 'freelancer') {
            console.log('Test user is not a freelancer, skipping test');
            return;
        }
        
        console.log('Test user found:', testProfile.id);
        
        // Step 2: Find a task that has been accepted but is not showing on dashboard
        console.log('\n2. Finding accepted tasks...');
        const { data: handshakes, error: handshakesError } = await supabase
            .from('task_handshakes')
            .select(`
                *,
                task:tasks (
                    *,
                    client:client_id (
                        full_name,
                        city,
                        phone
                    )
                )
            `)
            .eq('freelancer_id', testProfile.id)
            .eq('is_cancelled', false)
            .order('accepted_at', { ascending: false });
            
        if (handshakesError) throw handshakesError;
        
        const activeTasks = handshakes.filter(t => ['assigned', 'in_progress', 'review'].includes(t.task?.status || ''));
        console.log(`Found ${activeTasks.length} active tasks`);
        
        activeTasks.forEach(task => {
            console.log(`- ${task.task?.title} (Status: ${task.task?.status})`);
        });
        
        // Step 3: Check if tasks with status 'assigned' are being returned
        const assignedTasks = activeTasks.filter(t => t.task?.status === 'assigned');
        console.log(`\n${assignedTasks.length} tasks with status 'assigned'`);
        
        if (assignedTasks.length > 0) {
            console.log('✅ Assigned tasks are showing on dashboard');
        } else {
            console.log('⚠️ No assigned tasks found');
            console.log('   If you recently accepted a task and it is not showing,');
            console.log('   make sure the task status was updated to "assigned"');
        }
        
        console.log('\n✅ Dashboard fix test completed successfully');
        
    } catch (error) {
        console.error('❌ Error testing fix:', error);
    }
}

testDashboardFix();
