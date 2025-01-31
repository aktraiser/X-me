'use client';

import { Expert } from '@/lib/actions';
import { useEffect, useState } from 'react';
import { User, MapPin, Clock, Briefcase, Mail, Phone } from 'lucide-react';
import { getExpertById } from '@/lib/supabase';

export default function ExpertPage({ params }: { params: { id: string } }) {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        // L'URL est au format: prenom-nom-uuid
        // On extrait l'UUID qui est composé des 5 dernières parties
        const urlParts = params.id.split('-');
        if (urlParts.length < 5) throw new Error('ID expert invalide');
        
        // Récupérer les 5 dernières parties pour former l'UUID complet
        const uuidParts = urlParts.slice(-5);
        const expertId = uuidParts.join('-');
        
        console.log('Fetching expert with ID:', expertId);
        const expertData = await getExpertById(expertId);
        
        if (!expertData) {
          throw new Error('Expert non trouvé');
        }
        setExpert(expertData);
      } catch (err) {
        console.error('Error fetching expert:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchExpert();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-64 bg-light-secondary dark:bg-dark-secondary rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-8 bg-light-secondary dark:bg-dark-secondary rounded w-1/3" />
              <div className="h-4 bg-light-secondary dark:bg-dark-secondary rounded w-1/4" />
              <div className="h-4 bg-light-secondary dark:bg-dark-secondary rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            {error || 'Expert non trouvé'}
          </h1>
          <p className="text-black/70 dark:text-white/70">
            Impossible de charger les informations de l&apos;expert.
          </p>
        </div>
      </div>
    );
  }

  // Extraire la première expertise comme spécialité principale
  const mainExpertise = expert.expertises.split(',')[0].trim();

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary p-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec photo et informations principales */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="w-full md:w-1/3">
            {expert.image_url ? (
              <img
                src={expert.image_url}
                alt={`${expert.prenom} ${expert.nom}`}
                className="w-full aspect-square object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-square bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-lg flex items-center justify-center">
                <User className="w-1/3 h-1/3 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
              {expert.prenom} {expert.nom}
            </h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                <Briefcase className="w-5 h-5" />
                <span>{mainExpertise}</span>
              </div>
              <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                <MapPin className="w-5 h-5" />
                <span>{expert.ville}, {expert.pays}</span>
              </div>
              <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                <Clock className="w-5 h-5" />
                <span>{expert.tarif}€/heure</span>
              </div>
            </div>

            <button className="bg-[#24A0ED] text-white px-6 py-3 rounded-lg hover:bg-[#1a8cd8] transition-colors duration-200 shadow-lg">
              Contacter l&apos;expert
            </button>
          </div>
        </div>

        {/* Section Expertises */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Expertises
          </h2>
          <div className="flex flex-wrap gap-2">
            {expert.expertises.split(',').map((expertise, index) => (
              <span
                key={index}
                className="bg-light-secondary dark:bg-dark-secondary px-4 py-2 rounded-full text-sm text-black/70 dark:text-white/70"
              >
                {expertise.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Section Biographie */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            À propos
          </h2>
          <p className="text-black/70 dark:text-white/70 whitespace-pre-line">
            {expert.biographie}
          </p>
        </div>

        {/* Section Services */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Services proposés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(expert.services || {}).map(([service, details]: [string, any]) => (
              <div
                key={service}
                className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg"
              >
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  {service}
                </h3>
                <p className="text-sm text-black/70 dark:text-white/70">
                  {details.description || 'Aucune description disponible'}
                </p>
                {details.price && (
                  <p className="text-sm font-medium text-[#24A0ED] mt-2">
                    À partir de {details.price}€
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 