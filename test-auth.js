// Simple Node.js test script for Supabase auth
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnkokmaccibpwxenxynh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua29rbWFjY2licHd4ZW54eW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzc2NzksImV4cCI6MjA3MDk1MzY3OX0.mC30nHqAQ-U6gyE9RCVYCPcizd5Hp1GX2toMskWsREE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log('🔍 Testing Supabase Auth System...\n');
    
    // Test 1: Database Connection
    try {
        console.log('1️⃣ Testing database connection...');
        const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        if (error) {
            console.log('❌ Database error:', error.message);
            console.log('📋 Error details:', error);
        } else {
            console.log('✅ Database connected successfully');
            console.log(`📊 Current user count: ${count || 0}\n`);
        }
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
    }

    // Test 2: Create Test User
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';
    
    try {
        console.log('2️⃣ Creating test user...');
        console.log(`📧 Email: ${testEmail}`);
        
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: { full_name: testName }
            }
        });

        if (error) {
            console.log('❌ User creation failed:', error.message);
        } else {
            console.log('✅ User created successfully');
            console.log(`👤 User ID: ${data.user.id}`);
            
            // Sign in as the user first to pass RLS policies
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPassword
            });
            
            if (loginError) {
                console.log('⚠️ Auto-login failed:', loginError.message);
            } else {
                console.log('✅ Auto-login successful');
            }
            
            // Create user profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: data.user.id,
                    email: data.user.email,
                    full_name: testName,
                    preferred_dialect: 'lebanese',
                    daily_goal: 10,
                    streak_days: 0,
                    total_study_time: 0
                });
                
            if (profileError) {
                console.log('⚠️ Profile creation error:', profileError.message);
            } else {
                console.log('✅ User profile created\n');
            }
            
            // Test 3: Add Sample Progress
            console.log('3️⃣ Adding sample progress...');
            
            // Add phrase progress
            for (let i = 1; i <= 5; i++) {
                const { error: phraseError } = await supabase
                    .from('phrase_progress')
                    .insert({
                        user_id: data.user.id,
                        phrase_id: `test_phrase_${i}`,
                        status: i <= 2 ? 'mastered' : 'practicing',
                        correct_attempts: Math.floor(Math.random() * 10),
                        total_attempts: Math.floor(Math.random() * 15) + 5,
                        last_reviewed: new Date().toISOString(),
                        next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        ease_factor: 2.5,
                        interval_days: 1
                    });
                    
                if (phraseError) {
                    console.log(`⚠️ Error adding phrase ${i}:`, phraseError.message);
                } else {
                    console.log(`✅ Added progress for phrase ${i}`);
                }
            }
            
            // Add quiz attempt
            const { error: quizError } = await supabase
                .from('quiz_attempts')
                .insert({
                    user_id: data.user.id,
                    quiz_type: 'multiple-choice',
                    score: 8,
                    total_questions: 10,
                    difficulty: 'intermediate',
                    target_dialect: 'lebanese',
                    time_spent: 180,
                    questions: [
                        { question: 'Test question 1', answer: 'Test answer 1' },
                        { question: 'Test question 2', answer: 'Test answer 2' }
                    ]
                });
                
            if (quizError) {
                console.log('⚠️ Quiz attempt error:', quizError.message);
            } else {
                console.log('✅ Quiz attempt recorded\n');
            }
            
            // Test 4: Verify Data Retrieval
            console.log('4️⃣ Verifying data retrieval...');
            
            const { data: profile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
                
            if (fetchError) {
                console.log('❌ Profile fetch error:', fetchError.message);
            } else {
                console.log('✅ Profile retrieved successfully');
                console.log(`📋 Profile data:`, JSON.stringify(profile, null, 2));
            }
            
            const { data: phrases, error: phrasesError } = await supabase
                .from('phrase_progress')
                .select('*')
                .eq('user_id', data.user.id);
                
            if (phrasesError) {
                console.log('❌ Phrases fetch error:', phrasesError.message);
            } else {
                console.log(`✅ Retrieved ${phrases.length} phrase progress records`);
            }
            
            const { data: quizzes, error: quizzesError } = await supabase
                .from('quiz_attempts')
                .select('*')
                .eq('user_id', data.user.id);
                
            if (quizzesError) {
                console.log('❌ Quizzes fetch error:', quizzesError.message);
            } else {
                console.log(`✅ Retrieved ${quizzes.length} quiz attempts\n`);
            }
        }
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    // Test 5: List All Users
    try {
        console.log('5️⃣ Listing all users in database...');
        const { data: users, error } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, streak_days, total_study_time, created_at');
            
        if (error) {
            console.log('❌ User list error:', error.message);
        } else {
            console.log(`✅ Found ${users.length} users:`);
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.full_name} (${user.email})`);
                console.log(`     📊 Streak: ${user.streak_days} days | Study time: ${user.total_study_time}s`);
                console.log(`     📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
            });
        }
    } catch (error) {
        console.log('❌ User listing failed:', error.message);
    }
    
    // Test 6: Sign out
    try {
        console.log('\n6️⃣ Testing sign out...');
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.log('❌ Sign out failed:', error.message);
        } else {
            console.log('✅ Sign out successful');
        }
    } catch (error) {
        console.log('❌ Sign out error:', error.message);
    }
    
    console.log('\n🎉 Auth system test completed!');
}

testAuth().catch(console.error);