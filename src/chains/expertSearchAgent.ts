import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseMessage } from '@langchain/core/messages';
import { supabase } from '../db/supabase';
import formatChatHistoryAsString from '../utils/formatHistory';
import { Expert, ExpertSearchRequest, ExpertSearchResponse } from '../types/types';

type ExpertSearchChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

const ExpertSearchChainPrompt = `
Vous êtes un agent spécialisé dans l'analyse et la recherche d'experts professionnels. Votre rôle est d'interpréter les demandes des utilisateurs et d'extraire les informations essentielles pour trouver l'expert le plus pertinent.

OBJECTIF :
Analyser la requête pour identifier précisément :
1. Le domaine d'expertise recherché
2. La localisation souhaitée (si mentionnée)

RÈGLES D'EXTRACTION :
- Pour l'EXPERTISE :
  * Identifier le domaine principal (comptabilité, droit, marketing, etc.)
  * Reconnaître les spécialisations (droit des affaires, marketing digital, etc.)
  * Nettoyer les mots parasites (expert, spécialiste, professionnel, etc.)
  * Extraire les mots-clés pertinents pour la recherche
  * Prendre en compte les synonymes et variations

- Pour la VILLE :
  * Si mentionnée
  * Extraire la ville mentionnée
  * Ignorer si non spécifiée
  * Standardiser le format (tout en minuscules)

FORMAT DE RÉPONSE STRICT :
Répondre en deux lignes exactement :
expertise: [domaine d'expertise]
ville: [ville si mentionnée]

EXEMPLES D'ANALYSE :

1. "Je cherche un expert comptable sur Paris"
expertise: comptabilité
ville: paris

2. "Il me faudrait un avocat spécialisé en droit des affaires à Lyon"
expertise: droit des affaires
ville: lyon

3. "Qui peut m'aider avec le marketing digital ?"
expertise: marketing digital
ville: 

4. "Je cherche quelqu'un pour m'aider à créer mon entreprise"
expertise: création d'entreprise
ville: 

Conversation précédente :
{chat_history}

Requête actuelle : {query}

Principe de recherche d'expert :
- Pour toute recherche d'expert, extraire UNIQUEMENT :
  * L'expertise demandée (avec ses variations et synonymes)
  * La ville (si mentionnée)

- Mots déclencheurs à reconnaître :
  * "cherche un expert/spécialiste/consultant"
  * "besoin d'un professionnel"
  * "recherche quelqu'un pour"
  * "qui peut m'aider avec"
  * "conseil en"
  * "assistance pour"
  * "accompagnement dans"

- Domaines d'expertise à reconnaître :
  * Création d'entreprise (entrepreneuriat, lancement d'activité, etc.)
  * Comptabilité (gestion comptable, fiscalité, etc.)
  * Marketing (digital, traditionnel, stratégie, etc.)
  * Droit (des affaires, commercial, fiscal, etc.)
  * Finance (gestion financière, investissement, etc.)
  * Stratégie (développement, business plan, etc.)
  * RH (ressources humaines, recrutement, etc.)
  * Communication (relations publiques, médias, etc.)

<example>
\`<query>
Je cherche un expert comptable
</query>
expertise: comptabilité
ville: 
\`

\`<query>
J'ai besoin d'un spécialiste en droit des sociétés à Lyon
</query>
expertise: droit des sociétés
ville: lyon
\`

\`<query>
Qui peut m'aider avec ma comptabilité sur Paris ?
</query>
expertise: comptabilité
ville: paris
\`
</example>
`;

const ExpertAnalysisPrompt = `
Vous devez générer une synthèse des experts trouvés en vous basant UNIQUEMENT sur les données fournies.

Contexte de la recherche : {query}

Experts trouvés (à utiliser EXCLUSIVEMENT) :
{experts}

Format de la synthèse :
🎯 Synthèse de la recherche
[Résumé bref de la demande]

💫 Experts disponibles :
[Pour chaque expert trouvé dans les données :]
- [Prénom Nom] à [Ville]
  Expertise : [expertises]
  Tarif : [tarif]€
  [Point clé de la biographie]

⚠️ IMPORTANT : N'inventez PAS d'experts. Utilisez UNIQUEMENT les données fournies.
`;

const strParser = new StringOutputParser();

// Fonction pour convertir les données de l'expert
const convertToExpert = (data: any): Expert => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    id: data.id || 0,
    id_expert: data.id_expert || '',
    nom: data.nom || '',
    prenom: data.prenom || '',
    adresse: data.adresse || '',
    pays: data.pays || '',
    ville: data.ville || '',
    expertises: data.expertises || '',
    specialite: data.specialite,
    biographie: data.biographie || '',
    tarif: data.tarif || 0,
    services: data.services || {},
    created_at: data.created_at || new Date().toISOString(),
    image_url: data.image_url || '',
    url: `${baseUrl}/expert/${data.prenom.toLowerCase()}-${data.nom.toLowerCase()}-${data.id_expert}`.replace(/\s+/g, '-')
  };
};

const createExpertSearchChain = (llm: BaseChatModel) => {
  // Créer le prompt pour l'analyse de la requête
  const searchAnalysisPrompt = ChatPromptTemplate.fromTemplate(ExpertSearchChainPrompt);

  return RunnableSequence.from([
    // 1. Préparer les inputs
    RunnableMap.from({
      query: (input: ExpertSearchChainInput) => input.query || '',
      chat_history: (input: ExpertSearchChainInput) => 
        formatChatHistoryAsString(input.chat_history || []),
    }),
    // 2. Analyser la requête avec le LLM
    RunnableSequence.from([
      searchAnalysisPrompt,
      llm,
      strParser,
    ]),
    // 3. Extraire les critères de recherche
    RunnableLambda.from(async (llmOutput: string) => {
      console.log('🤖 Analyse LLM:', llmOutput);
      
      // Extraire expertise et ville du résultat LLM
      const expertiseMatch = llmOutput.match(/expertise:\s*(.+)/i);
      const villeMatch = llmOutput.match(/ville:\s*(.+)/i);
      
      const expertise = expertiseMatch?.[1]?.trim() || '';
      const ville = villeMatch?.[1]?.trim() || '';
      
      console.log('📊 Critères extraits:', { expertise, ville });
      
      return { expertise, ville };
    }),
    // 4. Rechercher les experts
    RunnableLambda.from(async (criteria: { expertise: string, ville: string }) => {
      try {
        console.log('🔍 Recherche avec critères:', criteria);

        // Construire la requête Supabase
        let query = supabase
          .from('experts')
          .select('*');

        // Ajouter les conditions de recherche
        if (criteria.expertise) {
          // Séparer les mots de l'expertise
          const keywords = criteria.expertise.toLowerCase().split(/\s+/);
          
          // Construire la requête pour chaque mot-clé
          keywords.forEach(keyword => {
            query = query.or(`expertises.ilike.%${keyword}%,biographie.ilike.%${keyword}%`);
          });
        }

        // Ajouter le filtre de ville si spécifié
        if (criteria.ville) {
          query = query.ilike('ville', `%${criteria.ville}%`);
        }

        // Exécuter la requête
        const { data: experts, error } = await query.limit(5);

        console.log('🔍 Résultat de la requête experts:', {
          criteres: criteria,
          nbExperts: experts?.length || 0,
          error: error?.message
        });

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          throw error;
        }

        if (!experts || experts.length === 0) {
          return {
            experts: [],
            synthese: `Désolé, je n'ai pas trouvé d'experts en ${criteria.expertise}${criteria.ville ? ` à ${criteria.ville}` : ''}.`
          } as ExpertSearchResponse;
        }

        // Générer la synthèse avec le LLM
        const synthesePrompt = PromptTemplate.fromTemplate(ExpertAnalysisPrompt);
        const formattedPrompt = await synthesePrompt.format({
          query: `Recherche d'expert en ${criteria.expertise}${criteria.ville ? ` à ${criteria.ville}` : ''}`,
          experts: JSON.stringify(experts, null, 2)
        });

        const syntheseResponse = await llm.invoke(formattedPrompt);
        const syntheseString = typeof syntheseResponse.content === 'string' 
          ? syntheseResponse.content 
          : JSON.stringify(syntheseResponse.content);

        return {
          experts: experts.map(convertToExpert),
          synthese: syntheseString
        } as ExpertSearchResponse;

      } catch (error) {
        console.error('❌ Erreur dans la recherche:', error);
        return {
          experts: [],
          synthese: "Une erreur est survenue lors de la recherche d'experts."
        } as ExpertSearchResponse;
      }
    }),
  ]);
};

const handleExpertSearch = async (input: ExpertSearchRequest, llm: BaseChatModel) => {
  try {
    // 1. Analyse de la requête via LLM pour extraire l'expertise et la ville
    const expertSearchChain = createExpertSearchChain(llm);
    const result = await expertSearchChain.invoke({
      query: input.query,
      chat_history: input.chat_history || []
    }) as ExpertSearchResponse; // Le résultat est déjà une ExpertSearchResponse

    // Pas besoin de retraiter la réponse car createExpertSearchChain fait déjà tout le travail
    return result;

  } catch (error) {
    console.error('❌ Erreur dans handleExpertSearch:', error);
    return {
      experts: [],
      synthese: "Une erreur est survenue."
    };
  }
};

export default handleExpertSearch;