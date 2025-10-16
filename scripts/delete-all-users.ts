import { supabase } from '../services/supabase';

async function deleteAllUsers() {
  try {
    console.log('⚠️  WARNING: This will delete ALL users and their data!');
    console.log('Starting deletion process...\n');

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const apiUrl = `${supabaseUrl}/functions/v1/delete-all-users`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Success! All users have been deleted.\n');
      console.log('Deleted counts:');
      console.log('- Auth users:', result.deletedCounts?.authUsers || 0);
      console.log('- User profiles:', result.deletedCounts?.userProfiles || 0);
      console.log('- Health scores:', result.deletedCounts?.healthScores || 0);
      console.log('- Scans:', result.deletedCounts?.scans || 0);
      console.log('- Purchases:', result.deletedCounts?.purchases || 0);
      console.log('- OAuth connections:', result.deletedCounts?.oauthConnections || 0);
      console.log('- Notifications:', result.deletedCounts?.notifications || 0);
      console.log('- Avatar files:', result.deletedCounts?.avatarFiles || 0);
      console.log('- Scan files:', result.deletedCounts?.scanFiles || 0);
    } else {
      console.error('❌ Error:', result.error || result.message);
    }
  } catch (error) {
    console.error('❌ Failed to delete users:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

deleteAllUsers();
