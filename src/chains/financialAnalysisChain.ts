import {
    RunnableSequence,
    RunnableMap,
    RunnableLambda,
  } from '@langchain/core/runnables';
  import { PromptTemplate } from '@langchain/core/prompts';
  import formatChatHistoryAsString from '../utils/formatHistory';
  import { BaseMessage } from '@langchain/core/messages';
  import { StringOutputParser } from '@langchain/core/output_parsers';
  import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
  import { ChatOpenAI } from '@langchain/openai';
  
  const financialAnalysisPromptTemplate = `
  Tu es un expert en analyse financière spécialisé dans le secteur {business_type}, avec une expertise particulière pour la région {location}.
  
  Budget disponible pour le projet : {budget}
  
  À partir des données financières extraites et du contexte fourni, réalise une analyse financière DÉTAILLÉE et STRUCTURÉE.
  
  Historique des échanges :
  {chat_history}
  
  Données financières disponibles :
  {financial_data}
  
  INSTRUCTIONS :
  1. Analyse chaque aspect financier en détail
  2. Fournis des données chiffrées précises
  3. Compare avec les moyennes du secteur
  4. Adapte tes recommandations au budget spécifié
  5. Structure ta réponse selon le plan suivant
  
  Rédige ta réponse en Markdown avec la structure suivante :
  
  # Analyse Financière Détaillée
  
  ## 1. Analyse Globale du Marché
  - Taille du marché local et régional
  - Tendances de croissance
  - Positionnement concurrentiel
  
  ## 2. Analyse des Revenus
  - Chiffre d'affaires moyen du secteur
  - Projection des ventes sur 3 ans
  - Analyse de la saisonnalité
  - Mix produit recommandé
  
  ## 3. Structure des Coûts
  - Détail des coûts fixes avec estimation prix
  - Détail des coûts variables avec estimation prix
  - Marges par catégorie de produits
  - Point mort estimé
  
  ## 4. Plan de Financement
  - Structure de financement recommandée
  - Détail des investissements nécessaires
  - Aides et subventions disponibles
  - Plan de trésorerie prévisionnel
  
  ## 5. Indicateurs de Performance
  - KPIs spécifiques au secteur
  - Ratios financiers clés
  - Seuils d'alerte
  - Objectifs de performance
  
  ## 6. Recommandations
  - Points d'optimisation identifiés
  - Actions prioritaires
  - Stratégie financière recommandée`;

  type FinancialAnalysisChainInput = {
    chat_history: BaseMessage[];
    financial_data: string;
    external_data: string;
    business_type: string;
    location: string;
    budget: string;
  };
  
  const strParser = new StringOutputParser();
  
  const createFinancialAnalysisChain = (llm: BaseChatModel) => {
    console.log('🔄 Création de la chaîne d\'analyse financière...');
    
    return RunnableSequence.from([
      RunnableMap.from({
        chat_history: (input: FinancialAnalysisChainInput) => {
          console.log('📜 Formatage de l\'historique des conversations...');
          return formatChatHistoryAsString(input.chat_history);
        },
        financial_data: (input: FinancialAnalysisChainInput) => {
          console.log('📊 Préparation des données financières...');
          return input.financial_data;
        },
        business_type: (input: FinancialAnalysisChainInput) => input.business_type,
        location: (input: FinancialAnalysisChainInput) => input.location,
        budget: (input: FinancialAnalysisChainInput) => input.budget
      }),
      PromptTemplate.fromTemplate(financialAnalysisPromptTemplate),
      llm,
      new StringOutputParser(),
    ]);
  };
  
  const handleFinancialAnalysis = async (
    input: FinancialAnalysisChainInput,
    llm: BaseChatModel,
  ) => {
    console.log('🚀 Démarrage de l\'analyse financière...');
    
    try {
      (llm as unknown as ChatOpenAI).temperature = 0;
      const chain = createFinancialAnalysisChain(llm);
      const result = await chain.invoke(input);
      
      console.log('✅ Analyse financière terminée avec succès');
      return result;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse financière:', error);
      return `# Erreur d'Analyse Financière\nUne erreur est survenue lors de l'analyse : ${error.message}`;
    }
  };
  
  export default handleFinancialAnalysis;
