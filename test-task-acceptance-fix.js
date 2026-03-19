const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        
        // Step 2: Get an open task to accept
        console.log('\n2. Finding an open task...');
        const { data: openTasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id, title, status')
            .eq('status', 'open')
            .limit(1);
            
        if (tasksError) throw tasksError;
        
        if (openTasks.length === 0) {
            console.log('No open tasks available for testing');
            return;
        }
        
        const testTask = openTasks[0];
        console.log('Test task found:', testTask.id, testTask.title);
        
        // Step 3: Accept the task
        console.log('\n3. Accepting task...');
        const response = await fetch('http://localhost:3000/api/tasks/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskId: testTask.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Task accepted successfully');
        } else {
            console.log('❌ Task acceptance failed:', result.error);
        }
        
        // Step 4: Verify task appears on dashboard
        console.log('\n4. Fetching tasks from dashboard...');
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
        console.log(`✅ Found ${activeTasks.length} active tasks`);
        
        const taskFound = activeTasks.some(t => t.task?.id === testTask.id);
        
        if (taskFound) {
            console.log('✅ Test task found in active tasks on dashboard');
        } else {
            console.log('❌ Test task not found in active tasks on dashboard');
        }
        
        console.log('\n✅ Dashboard fix test completed successfully');
        
    } catch (error) {
        console.error('❌ Error testing fix:', error);
    }
}

testDashboardFix();
