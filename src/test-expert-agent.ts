import { ChatOpenAI } from '@langchain/openai';
import handleExpertSearch from './chains/expertSearchAgent';
import { ExpertSearchRequest } from './types/types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getOpenaiApiKey } from './config';

async function testExpertAgent() {
  try {
    const openaiApiKey = getOpenaiApiKey();
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found in config');
    }

    // Initialiser le modèle LLM
    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey: openaiApiKey
    }) as unknown as BaseChatModel;

    // Tester différentes requêtes
    const testQueries = [
      "Je cherche un expert comptable sur Paris",
      "J'ai besoin d'un spécialiste en droit des affaires",
      "Qui peut m'aider avec le marketing digital à Lyon ?",
      "Je recherche un consultant en stratégie d'entreprise à Marseille"
    ];

    for (const query of testQueries) {
      console.log('\n🔍 Test avec la requête:', query);
      
      const request: ExpertSearchRequest = {
        query,
        chat_history: [],
        messageId: 'test-' + Date.now(),
        chatId: 'test-chat'
      };

      const result = await handleExpertSearch(request, llm);

      console.log('✅ Résultat:');
      console.log('Synthèse:', result.synthese);
      console.log('Nombre d\'experts trouvés:', result.experts.length);
      if (result.experts.length > 0) {
        console.log('Premier expert:', {
          nom: result.experts[0].nom,
          prenom: result.experts[0].prenom,
          ville: result.experts[0].ville,
          expertises: result.experts[0].expertises
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testExpertAgent(); 