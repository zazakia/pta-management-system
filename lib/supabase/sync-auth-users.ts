#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAuthUsers() {
  console.log('🔄 Starting auth users sync to pta2.user_profiles...\n');

  try {
    // Get all auth users
    console.log('📋 Fetching all auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    console.log(`✅ Found ${authUsers.users.length} auth users`);

    // Get existing user profiles
    console.log('📋 Fetching existing user profiles...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id');

    if (profilesError && profilesError.code !== 'PGRST116') { // PGRST116 = relation does not exist (table not found)
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    console.log(`✅ Found ${existingProfileIds.size} existing profiles`);

    // Get default school (create one if none exists)
    console.log('🏫 Checking for default school...');
    let { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1);

    if (schoolError && schoolError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch schools: ${schoolError.message}`);
    }

    let defaultSchoolId = null;
    if (!schools || schools.length === 0) {
      console.log('📝 Creating default school...');
      const { data: newSchool, error: createSchoolError } = await supabase
        .from('schools')
        .insert({ 
          name: 'Demo Elementary School', 
          address: '123 Education St, City, State' 
        })
        .select('id')
        .single();

      if (createSchoolError) {
        throw new Error(`Failed to create default school: ${createSchoolError.message}`);
      }
      
      defaultSchoolId = newSchool.id;
      console.log(`✅ Created default school with ID: ${defaultSchoolId}`);
    } else {
      defaultSchoolId = schools[0].id;
      console.log(`✅ Using existing school: ${schools[0].name} (${defaultSchoolId})`);
    }

    // Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id));
    console.log(`🔍 Found ${usersWithoutProfiles.length} users without profiles`);

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All auth users already have profiles - sync complete!');
      return;
    }

    // Create profiles for users without them
    console.log('\n📝 Creating missing user profiles...');
    const profilesToCreate = usersWithoutProfiles.map(user => {
      // Extract name from email or metadata
      const email = user.email || '';
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const fullName = metaName || email.split('@')[0] || 'Unknown User';
      
      return {
        id: user.id,
        full_name: fullName,
        role: 'parent' as const, // Default role - users can change later
        school_id: defaultSchoolId,
        created_at: new Date().toISOString()
      };
    });

    // Insert profiles in batches of 10
    const batchSize = 10;
    let created = 0;
    
    for (let i = 0; i < profilesToCreate.length; i += batchSize) {
      const batch = profilesToCreate.slice(i, i + batchSize);
      console.log(`📝 Creating profiles batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(profilesToCreate.length/batchSize)}...`);
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Failed to create profiles for batch ${Math.floor(i/batchSize) + 1}:`, insertError.message);
        // Continue with next batch instead of failing completely
        continue;
      }
      
      created += batch.length;
      console.log(`✅ Created ${batch.length} profiles (${created}/${profilesToCreate.length} total)`);
    }

    console.log(`\n🎉 Sync completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total auth users: ${authUsers.users.length}`);
    console.log(`   • Existing profiles: ${existingProfileIds.size}`);
    console.log(`   • Profiles created: ${created}`);
    console.log(`   • Default school ID: ${defaultSchoolId}`);
    
    console.log(`\n📝 Next steps for users:`);
    console.log(`   • Users can update their role and school in profile settings`);
    console.log(`   • Default role is 'parent' - users should change if needed`);
    console.log(`   • All users are assigned to the default school initially`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  syncAuthUsers().catch(console.error);
}

export { syncAuthUsers };