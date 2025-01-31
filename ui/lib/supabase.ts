import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from '@/lib/config';
import { Expert } from '@/lib/actions';

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour formater l'URL de l'expert
export const formatExpertUrl = (expert: any): Expert => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    ...expert,
    url: `${baseUrl}/expert/${expert.prenom.toLowerCase()}-${expert.nom.toLowerCase()}-${expert.id_expert}`.replace(/\s+/g, '-')
  };
};

// Fonction pour récupérer les experts avec l'URL formatée
export async function getExperts(query?: any) {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .match(query || {});

    if (error) throw error;

    // Formater les URLs pour chaque expert
    return data?.map(formatExpertUrl) || [];
  } catch (error) {
    console.error('Error fetching experts:', error);
    return [];
  }
}

// Fonction de test de connexion
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .limit(1);

    if (error) throw error;
    console.log('✅ Frontend Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Frontend Supabase connection error:', error);
    return false;
  }
}

export async function uploadExpertImage(file: File, expertId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expertId}-main.${fileExt}`;
    const filePath = `experts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('expert-images')  // Créez ce bucket dans Supabase
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('expert-images')
      .getPublicUrl(filePath);

    // Mettre à jour l'expert avec l'URL de l'image
    const { error: updateError } = await supabase
      .from('experts')
      .update({ image_url: publicUrl })
      .eq('id_expert', expertId);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Fonction pour récupérer un expert par son ID
export async function getExpertById(expertId: string) {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .eq('id_expert', expertId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Formater l'URL de l'expert
    return formatExpertUrl(data);
  } catch (error) {
    console.error('Error fetching expert:', error);
    return null;
  }
}
