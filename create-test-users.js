// Script to create test users with sample data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnkokmaccibpwxenxynh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua29rbWFjY2licHd4ZW54eW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzc2NzksImV4cCI6MjA3MDk1MzY3OX0.mC30nHqAQ-U6gyE9RCVYCPcizd5Hp1GX2toMskWsREE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a fake user ID for testing purposes
function generateFakeUserId() {
    return 'test-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

async function createTestUsersDirectly() {
    console.log('🔧 Creating test users directly in database...\n');
    
    const testUsers = [
        {
            id: generateFakeUserId(),
            email: 'beginner@test.com',
            full_name: 'Ahmed Ben Beginner',
            preferred_dialect: 'lebanese',
            daily_goal: 5,
            streak_days: 3,
            total_study_time: 900,
            level: 'beginner'
        },
        {
            id: generateFakeUserId(),
            email: 'intermediate@test.com',
            full_name: 'Fatima El Intermediate',
            preferred_dialect: 'syrian',
            daily_goal: 10,
            streak_days: 12,
            total_study_time: 3600,
            level: 'intermediate'
        },
        {
            id: generateFakeUserId(),
            email: 'advanced@test.com',
            full_name: 'Mohammed Al Advanced',
            preferred_dialect: 'all',
            daily_goal: 20,
            streak_days: 45,
            total_study_time: 7200,
            level: 'advanced'
        }
    ];

    for (const userData of testUsers) {
        try {
            console.log(`👤 Creating ${userData.level} user: ${userData.full_name}`);
            
            // Insert user profile directly (bypassing auth for testing)
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    preferred_dialect: userData.preferred_dialect,
                    daily_goal: userData.daily_goal,
                    streak_days: userData.streak_days,
                    total_study_time: userData.total_study_time
                });

            if (profileError) {
                console.log(`❌ Profile creation failed: ${profileError.message}`);
                continue;
            }

            console.log(`✅ Profile created for ${userData.full_name}`);

            // Add phrase progress based on level
            const progressCount = userData.level === 'beginner' ? 8 : 
                                userData.level === 'intermediate' ? 20 : 35;
            
            console.log(`📚 Adding ${progressCount} phrase progress entries...`);
            
            for (let i = 0; i < progressCount; i++) {
                const masteryRate = userData.level === 'beginner' ? 0.3 : 
                                  userData.level === 'intermediate' ? 0.6 : 0.8;
                
                const { error: phraseError } = await supabase
                    .from('phrase_progress')
                    .insert({
                        user_id: userData.id,
                        phrase_id: `phrase_${String(i + 1).padStart(3, '0')}`,
                        status: Math.random() < masteryRate ? 'mastered' : 
                               Math.random() < 0.7 ? 'practicing' : 'learning',
                        correct_attempts: Math.floor(Math.random() * 10) + userData.level === 'beginner' ? 2 : 
                                        userData.level === 'intermediate' ? 5 : 8,
                        total_attempts: Math.floor(Math.random() * 15) + 5,
                        last_reviewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                        next_review: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                        ease_factor: 2.5 + (Math.random() - 0.5),
                        interval_days: Math.floor(Math.random() * 7) + 1
                    });

                if (phraseError && i === 0) {
                    console.log(`⚠️ Phrase progress error: ${phraseError.message}`);
                }
            }

            // Add quiz attempts based on level
            const quizCount = userData.level === 'beginner' ? 3 : 
                            userData.level === 'intermediate' ? 8 : 15;
            
            console.log(`🎯 Adding ${quizCount} quiz attempts...`);
            
            for (let i = 0; i < quizCount; i++) {
                const baseScore = userData.level === 'beginner' ? 5 : 
                                userData.level === 'intermediate' ? 7 : 8;
                
                const { error: quizError } = await supabase
                    .from('quiz_attempts')
                    .insert({
                        user_id: userData.id,
                        quiz_type: ['multiple-choice', 'word-order'][Math.floor(Math.random() * 2)],
                        score: baseScore + Math.floor(Math.random() * 3),
                        total_questions: 10,
                        difficulty: userData.level,
                        target_dialect: userData.preferred_dialect === 'all' ? 
                                      ['lebanese', 'syrian', 'emirati', 'saudi'][Math.floor(Math.random() * 4)] :
                                      userData.preferred_dialect,
                        time_spent: 120 + Math.floor(Math.random() * 180),
                        questions: Array.from({length: 3}, (_, idx) => ({
                            question: `Sample question ${idx + 1}`,
                            answer: `Sample answer ${idx + 1}`,
                            user_answer: `User answer ${idx + 1}`
                        })),
                        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    });

                if (quizError && i === 0) {
                    console.log(`⚠️ Quiz attempt error: ${quizError.message}`);
                }
            }

            console.log(`✅ ${userData.full_name} setup completed\n`);
            
        } catch (error) {
            console.log(`❌ Error creating ${userData.full_name}: ${error.message}\n`);
        }
    }

    // Verify the created data
    console.log('📊 Verifying created test data...\n');
    
    try {
        const { data: profiles, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                phrase_progress(count),
                quiz_attempts(count)
            `);
            
        if (error) {
            console.log('❌ Verification error:', error.message);
        } else {
            console.log(`✅ Created ${profiles.length} test users:`);
            profiles.forEach((profile, index) => {
                console.log(`  ${index + 1}. ${profile.full_name} (${profile.email})`);
                console.log(`     🎯 Level: ${profile.preferred_dialect} dialect`);
                console.log(`     📊 Streak: ${profile.streak_days} days | Study time: ${Math.floor(profile.total_study_time / 60)} min`);
                console.log(`     📚 Phrases: ${profile.phrase_progress?.[0]?.count || 0} | Quizzes: ${profile.quiz_attempts?.[0]?.count || 0}`);
                console.log('');
            });
        }
    } catch (error) {
        console.log('❌ Verification failed:', error.message);
    }
    
    console.log('🎉 Test user creation completed!');
}

createTestUsersDirectly().catch(console.error);