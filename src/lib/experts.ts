import { createClient } from '@supabase/supabase-js';

interface Expert {
  id: string;
  firstName: string;
  lastName: string;
  expertise: string;
  description?: string;
  ville?: string;
  profileUrl: string;
}

export async function findExperts({ expertise, ville }: { expertise: string; ville?: string }): Promise<Expert[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('experts')
      .select('*')
      .textSearch('expertise', expertise);

    if (ville) {
      query = query.textSearch('ville', ville);
    }

    const { data: experts, error } = await query;

    if (error) {
      console.error('Erreur lors de la recherche d\'experts:', error);
      return [];
    }

    return experts.map(expert => ({
      ...expert,
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/expert/${expert.id}`
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche d\'experts:', error);
    return [];
  }
} 