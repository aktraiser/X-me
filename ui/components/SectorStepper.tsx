import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Sector {
  name: string;
  subsectors?: string[];
}

const sectors: Sector[] = [
  {
    name: "Commerce alimentaire",
    subsectors: [
      "Boulangerie",
      "Épicerie",
      "Caviste",
      "Commerce bio",
      "Épicerie fine",
      "Primeur",
      "Pâtisserie artisanale"
    ]
  },
  {
    name: "Commerce non alimentaire",
    subsectors: [
        "Boutique Deco",
        "Fleuriste",
        "Prêt à Porter",
        "Velo",
        "Bijou Fantaisie",
        "Cordonnerie",
        "Librairie"
    ]
  },
  {
    name: "Construction - Bâtiment",
    subsectors: [
        "Peinture",
        "Maconnerie",
        "Menuiserie",
        "Plomberie",
        "Eclectricité",
        "Jardinier Paysagiste"
    ]
  },
  {
    name: "Culture - Arts - Communication",
    subsectors: [
        "Agence Evenementiel",
        "Métier d'Art",
        "Loisir Créatifs"
    ]
  },
  {
    name: "Développement Durable",
    subsectors: [
        "Construction"
    ]
  },
  {
    name: "Hôtellerie - Café - Restauration",
    subsectors: [
        "Brasserie",
        "Restauration Rapide",
        "Restauration Traditionnelle",
        "Restauration Nomade",
        "Café Bistrot",
        "Coffee Shop"
    ]
  },
  {
    name: "Immobilier",
    subsectors: [
        "Diagnostiqueur Immobilier",
        "Agence Immobilière"
    ]
  },
  {
    name: "Industrie - Mode",
    subsectors: [
        "Créateur de marque"
    ]
  },
  {
    name: "Internet - Edition - Média",
    subsectors: [
        "Influenceur",
        "Marketing Digital"
    ]
  },
  {
    name: "Profession Libérales",
    subsectors: [
        "Design",
        "Coach Sportif",
        "Consultant",
        "Enseignant Independant",
        "Formation Pro",
        "Traducteur Interprete",
        "Coach",
        "Professeur de Yoga",
        "Soutien Scolaire"
    ]
  },
  {
    name: "Santé - Bien - Beauté",
    subsectors: [
        "Naturopathe",
        "Reflexo Shiatsu",
        "Sophrologie",
        "Coiffeur",
        "Esthétique",
        "Osthéochiro",
        "Psychologue"
    ]
  },
  {
    name: "Services aux Entreprises",
    subsectors: [
        "Architecture Intérieur",
        "Décorateur d'Intérieur",
        "Secretaire",
        "Nettoyage"
    ]
  },
  {
    name: "Services aux Particuliers",
    subsectors: [
        "Conciergerie Location",
        "Homme toute Main",
        "Salon de Tatouage",
        "Assistante Maternelle",
        "Créche Assistante",
        "Organisateur de Mariage",
        "Retouche Vêtements"
    ]
  },
  {
    name: "Tourisme - Nature - Monde rural",
    subsectors: [
        "Gite Chambre d'Hôte",
        "Agriculture Urbaine"
    ]
  },
  {
    name: "Transport - Automobile",
    subsectors: [
        "Taxi",
        "Chauffeur VTC",
        "Garage"
    ]
  },

];

interface StepperProps {
  onSectorSelect: (sector: string, subsector?: string) => void;
}

const SectorStepper = ({ onSectorSelect }: StepperProps) => {
  const [step, setStep] = useState<'main' | 'sub'>('main');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  const handleSectorClick = (sector: Sector) => {
    setSelectedSector(sector);
    if (!sector.subsectors?.length) {
      onSectorSelect(sector.name);
    } else {
      setStep('sub');
    }
  };

  const handleSubsectorClick = (subsector: string) => {
    if (selectedSector) {
      onSectorSelect(selectedSector.name, subsector);
    }
  };

  const handleBack = () => {
    setStep('main');
    setSelectedSector(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-light-secondary dark:bg-dark-secondary rounded-lg p-6">
      {step === 'main' ? (
        <div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            Sélectionnez votre secteur d&apos;activité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectors.map((sector) => (
              <button
                key={sector.name}
                onClick={() => handleSectorClick(sector)}
                className="flex items-center justify-between p-4 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors"
              >
                <span className="text-black dark:text-white">{sector.name}</span>
                <ChevronRight className="text-black/50 dark:text-white/50" size={20} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={handleBack}
            className="flex items-center text-black/70 dark:text-white/70 mb-4 hover:text-black dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Retour</span>
          </button>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            {selectedSector?.name} - Sélectionnez votre sous-secteur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedSector?.subsectors?.map((subsector) => (
              <button
                key={subsector}
                onClick={() => handleSubsectorClick(subsector)}
                className="flex items-center justify-between p-4 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors"
              >
                <span className="text-black dark:text-white">{subsector}</span>
                <ChevronRight className="text-black/50 dark:text-white/50" size={20} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectorStepper; 