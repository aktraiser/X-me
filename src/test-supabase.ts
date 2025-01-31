import { supabase } from './db/supabase';
import { getSupabaseUrl, getSupabaseKey } from './config';

async function testExpertSearch() {
  try {
    console.log('🔧 Configuration:');
    console.log('URL:', getSupabaseUrl());
    console.log('Key:', getSupabaseKey()?.slice(0, 10) + '...');
    
    console.log('\n🔍 Testing expert search...');
    
    // Test search by expertise
    const searchTerm = 'Comptabilité';
    console.log(`\n🔍 Searching for experts in: ${searchTerm}`);
    
    const { data: experts, error } = await supabase
      .from('experts')
      .select('*')
      .or(`expertises.ilike.%${searchTerm}%,biographie.ilike.%${searchTerm}%`);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Found experts:', experts?.length || 0);
    if (experts && experts.length > 0) {
      console.log('📝 First matching expert:', {
        nom: experts[0].nom,
        prenom: experts[0].prenom,
        expertises: experts[0].expertises,
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testExpertSearch(); 