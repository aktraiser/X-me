import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from '@langchain/core/prompts';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import {
  BaseMessage,
  AIMessage,
  HumanMessage,
} from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import LineListOutputParser from '../lib/outputParsers/listLineOutputParser';
import LineOutputParser from '../lib/outputParsers/lineOutputParser';
import { getDocumentsFromLinks } from '../utils/documents';
import { Document } from 'langchain/document';
import { searchSearxng } from '../lib/searxng';
import path from 'path';
import fs from 'fs';
import computeSimilarity from '../utils/computeSimilarity';
import formatChatHistoryAsString from '../utils/formatHistory';
import eventEmitter from 'events';
import { StreamEvent } from '@langchain/core/tracers/log_stream';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import handleImageSearch from '../chains/imageSearchAgent';
import handleExpertSearch from '../chains/expertSearchAgent';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RAGDocumentChain } from '../chains/rag_document_upload';
import { SearxngSearchOptions } from '../lib/searxng';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EventEmitter } from 'events';
import { webSearchetudeRetrieverPrompt, webSearchetudeResponsePrompt } from '../prompts/webEtude';
import { SectorDocumentationResearchChain } from '../chains/sectorDocumentationResearchChain';
// Intégration de la nouvelle chaîne d'analyse financière
import handleFinancialAnalysis from '../chains/financialAnalysisChain';

export interface MetaSearchAgentType {
  searchAndAnswer: (
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
  ) => Promise<eventEmitter>;
}

interface Config {
  activeEngines: string[];
  queryGeneratorPrompt?: string;
  responsePrompt?: string;
  rerank: boolean;
  rerankThreshold: number;
  searchWeb: boolean;
  summarizer: boolean;
  searchDatabase: boolean;
  provider?: string;
  model?: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

interface SearchResponse {
  text: string;
  sources: Array<{
    title: string;
    content: string;
    url?: string;
    source?: string;
  }>;
  illustrationImage?: string;
}

interface DocumentMetadata {
  title?: string;
  source?: string;
  fileId?: string;
  url?: string;
}

interface SearchResult {
  pageContent: string;
  metadata: {
    score?: number;
    title?: string;
    [key: string]: any;
  };
}

interface SectorResearchMessage {
  type: string;
  sector: string;
  subsector: string | null;
  region: string;
  city: string;
  budget: string;
  query: string;
  documentPath: string;
}

interface ChainInput extends BasicChainInput {
  sector?: string;
  subsector?: string;
  docs?: Document[];
  financialAnalysis?: string;
}

export class MetaSearchAgent implements MetaSearchAgentType {
  private config: Config;
  private strParser = new StringOutputParser();
  private fileIds: string[];
  private conversationHistory: BaseMessage[] = [];
  private sectorChain: SectorDocumentationResearchChain;

  constructor(config: Config) {
    this.config = config;
    this.fileIds = [];
  }

  // Méthode d'extraction des données financières depuis les documents
  private extractFinancialData(docs: Document[]): string {
    let financialText = "";
    docs.forEach(doc => {
      const lower = doc.pageContent.toLowerCase();
      if (
        lower.includes("chiffre d'affaires") ||
        lower.includes("marge") ||
        lower.includes("ratio")
      ) {
        financialText += doc.pageContent + "\n";
      }
    });
    return financialText || "Aucune donnée financière spécifique trouvée.";
  }

  private cleanJSONString(str: string): string {
    let cleaned = str.replace(/```json\s*|\s*```/g, '');
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    return cleaned.trim();
  }

  private updateMemory(message: BaseMessage) {
    this.conversationHistory.push(message);
  }

  public getMemory(): BaseMessage[] {
    return this.conversationHistory;
  }

  private async createSearchRetrieverChain(llm: BaseChatModel) {
    (llm as unknown as ChatOpenAI).temperature = 0;

    return RunnableSequence.from([
      PromptTemplate.fromTemplate(webSearchetudeRetrieverPrompt),
      llm,
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        const linksOutputParser = new LineListOutputParser({
          key: 'links',
        });
        const questionOutputParser = new LineOutputParser({
          key: 'question',
        });
        const links = await linksOutputParser.parse(input);
        let question = this.config.summarizer
          ? await questionOutputParser.parse(input)
          : input;
        if (question === 'not_needed') {
          return { query: '', docs: [] };
        }
        let documents: Document[] = [];
        if (this.config.searchWeb) {
          console.log('🔍 Démarrage de la recherche web...');
          const res = await searchSearxng(question, {
            language: 'fr',
            engines: this.config.activeEngines,
          });
          documents = res.results.map(
            (result) =>
              new Document({
                pageContent: result.content,
                metadata: {
                  title: result.title,
                  url: result.url,
                  type: 'web',
                  source: 'web',
                  displayDomain: new URL(result.url).hostname.replace('www.', ''),
                  favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.url}`,
                  linkText: 'Voir la page',
                  ...(result.img_src && { img_src: result.img_src }),
                },
              }),
          );
          console.log('🌐 Sources web trouvées:', documents.length);
        }
        return { query: question, docs: documents };
      }),
    ]);
  }

  private async createAnsweringChain(
    llm: BaseChatModel,
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
  ) {
    return RunnableSequence.from([
      RunnableMap.from({
        query: (input: ChainInput) => input.query,
        chat_history: (input: ChainInput) => input.chat_history,
        // Si des documents sont déjà fournis (issu de la documentation), on les intègre
        docs: RunnableLambda.from(async (input: ChainInput) => {
          console.log('Début de la recherche...');
          let docs: Document[] = (input.docs && input.docs.length > 0) ? [...input.docs] : [];
          
          const ragChain = RAGDocumentChain.getInstance();
          const searchChain = ragChain.createSearchChain(llm);
          const searchChainPromise = searchChain.invoke({
            query: input.query,
            chat_history: input.chat_history,
            type: 'specific'
          });
          const expertPromise = this.config.searchDatabase
            ? handleExpertSearch(
                {
                  query: input.query,
                  chat_history: input.chat_history,
                  messageId: 'search_' + Date.now(),
                  chatId: 'chat_' + Date.now()
                },
                llm
              ).catch(error => {
                console.error('❌ Erreur lors de la recherche d\'experts:', error);
                return { experts: [] };
              })
            : Promise.resolve({ experts: [] });
          const webPromise = this.config.searchWeb
            ? this.performWebSearch(input.query).catch(error => {
                console.error('❌ Erreur lors de la recherche web:', error);
                return [];
              })
            : Promise.resolve([]);
          const [relevantDocs, expertResults, webResults] = await Promise.all([
            searchChainPromise,
            expertPromise,
            webPromise,
          ]);
          if (expertResults && expertResults.experts && expertResults.experts.length > 0) {
            const expertDocs = this.convertExpertsToDocuments(expertResults.experts);
            docs = [...docs, ...expertDocs];
          }
          if (webResults && Array.isArray(webResults)) {
            console.log(`🌐 ${webResults.length} résultats web trouvés`);
            docs = [...docs, ...webResults];
          }
          console.log('🔍 DEBUG - Avant appel rerankDocs - Mode:', optimizationMode, 'Query:', input.query);
          return this.rerankDocs(
            input.query,
            docs,
            fileIds,
            embeddings,
            optimizationMode,
            llm
          );
        }).withConfig({ runName: 'FinalSourceRetriever' }),
        sector: (input: ChainInput) => input.sector ?? 'Non spécifié',
        subsector: (input: ChainInput) => input.subsector ?? 'Non spécifié',
        date: () => new Date().toISOString(),
        context: (input) => {
          console.log('Préparation du contexte...');
          return this.processDocs(input.docs || []);
        },
        financialAnalysis: (input: ChainInput) => 
          input.financialAnalysis || "Aucune analyse financière disponible pour ce secteur."
      }),
      ChatPromptTemplate.fromMessages([
        ['system', webSearchetudeResponsePrompt],
        new MessagesPlaceholder('chat_history'),
        [
          'user',
          '{context}\n\n' +
          'Analyse financière : {financialAnalysis}\n\n' +
          'Secteur: {sector}\n' +
          'Sous-secteur: {subsector}\n\n' +
          '{query}'
        ],
      ]),
      llm,
      this.strParser,
    ]).withConfig({ runName: 'FinalResponseGenerator' });
  }

  private convertExpertsToDocuments(experts: any[]) {
    return experts.map(expert =>
      new Document({
        pageContent: `Expert: ${expert.prenom} ${expert.nom}
        Spécialité: ${expert.specialite}
        Ville: ${expert.ville}
        Tarif: ${expert.tarif}€
        Expertises: ${expert.expertises}
        Services: ${JSON.stringify(expert.services)}
        ${expert.biographie}`,
        metadata: {
          type: 'expert',
          expert: true,
          expertData: expert,
          title: `${expert.prenom} ${expert.nom} - ${expert.specialite}`,
          url: `/expert/${expert.id_expert}`,
          image_url: expert.image_url,
          score: 0.6
        }
      })
    );
  }

  private async performWebSearch(query: string) {
    const res = await searchSearxng(query, {
      language: 'fr',
      engines: this.config.activeEngines,
    });
    return res.results.map(result =>
      new Document({
        pageContent: result.content,
        metadata: {
          title: result.title,
          url: result.url,
          type: 'web',
          score: 0.4,
          ...(result.img_src && { img_src: result.img_src }),
        }
      })
    );
  }

  private processDocs(docs: Document[]) {
    const sortedDocs = docs.sort(
      (a, b) => (b.metadata?.score || 0) - (a.metadata?.score || 0)
    );
    const limitedDocs = sortedDocs.slice(0, 5);
    return limitedDocs
      .map((doc, index) => {
        const content =
          doc.pageContent.length > 1000
            ? doc.pageContent.substring(0, 1000) + '...'
            : doc.pageContent;
        return `${content} [${index + 1}]`;
      })
      .join('\n\n');
  }

  private async handleStream(
    stream: IterableReadableStream<StreamEvent>,
    emitter: eventEmitter
  ) {
    for await (const event of stream) {
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalSourceRetriever'
      ) {
        const sources = event.data.output;
        const normalizedSources =
          sources?.map(source => {
            const isUploadedDoc = source.metadata?.type === 'uploaded';
            const isExpert = source.metadata?.type === 'expert';
            const isWeb = source.metadata?.type === 'web';
            const sourceId = source.metadata?.source;
            let url;
            if (isUploadedDoc && sourceId) {
              const page = source.metadata?.pageNumber || source.metadata?.page || 1;
              console.log(`🔍 Construction URL pour source ${sourceId} - Page ${page}`, source.metadata);
              url = `/api/uploads/${sourceId}/content?page=${page}`;
            } else if (isExpert) {
              url = source.metadata?.url;
            } else if (isWeb) {
              url = source.metadata?.url;
              console.log('🌐 Source web trouvée:', {
                title: source.metadata?.title,
                url: url
              });
            }
            let title = source.metadata?.title || '';
            if (isUploadedDoc && title) {
              const page = source.metadata?.pageNumber || source.metadata?.page || 1;
              title = `${title} - Page ${page}`;
            } else if (isExpert) {
              title = source.metadata?.displayTitle || title;
            }
            const limitedContent = source.pageContent?.substring(0, 1000) || '';
            return {
              pageContent: limitedContent,
              metadata: {
                title: title,
                type: source.metadata?.type || 'web',
                url: url,
                source: sourceId || (isWeb ? 'web' : undefined),
                pageNumber: source.metadata?.pageNumber || source.metadata?.page || 1,
                displayDomain: isUploadedDoc ? 'Document local' : undefined,
                searchText:
                  source.metadata?.searchText?.substring(0, 200) ||
                  limitedContent.substring(0, 200),
                expertData: source.metadata?.expertData,
                illustrationImage: source.metadata?.illustrationImage,
                imageTitle: source.metadata?.imageTitle,
                favicon: isWeb ? `https://s2.googleusercontent.com/s2/favicons?domain_url=${url}` : source.metadata?.favicon,
                linkText: isUploadedDoc ? 'Voir le document' : 'Voir la source',
                expertName: source.metadata?.expertName,
                fileId: sourceId,
                page: source.metadata?.pageNumber || source.metadata?.page || 1,
                isFile: isUploadedDoc
              }
            };
          }) || [];
        console.log('🔍 Sources normalisées:', normalizedSources.length);
        console.log('🔍 Types de sources:', normalizedSources.map(s => s.metadata.type));
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'sources',
            data: normalizedSources,
            illustrationImage: normalizedSources[0]?.metadata?.illustrationImage || null,
            imageTitle: normalizedSources[0]?.metadata?.imageTitle || null
          })
        );
      }
      if (
        event.event === 'on_chain_stream' &&
        event.name === 'FinalResponseGenerator'
      ) {
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.data.chunk })
        );
      }
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalResponseGenerator'
      ) {
        emitter.emit('end');
      }
    }
  }

  private async handleStreamWithMemory(
    stream: IterableReadableStream<StreamEvent>,
    emitter: eventEmitter,
    llm: BaseChatModel,
    originalQuery: string
  ) {
    let fullAssistantResponse = '';
    let hasEmittedSuggestions = false;
    for await (const event of stream) {
      if (event.event === 'on_chain_stream') {
        if (event.name === 'FinalResponseGenerator') {
          fullAssistantResponse += event.data.chunk;
          emitter.emit(
            'data',
            JSON.stringify({ type: 'response', data: event.data.chunk })
          );
        }
      } else if (event.event === 'on_chain_end') {
        if (event.name === 'FinalResponseGenerator' && !hasEmittedSuggestions) {
          try {
            const suggestionsPrompt = `
            En te basant sur cette conversation et cette réponse, suggère 3 questions pertinentes de suivi en français :
            "${fullAssistantResponse}"
            Retourne uniquement les questions, une par ligne.`;
            
            const suggestionsResponse = await llm.invoke(suggestionsPrompt);
            const suggestions = String(suggestionsResponse.content)
              .split('\n')
              .filter(s => s.trim())
              .slice(0, 3);

            // Émettre uniquement les suggestions
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'suggestions',
                data: {
                  suggestions: suggestions,
                  suggestedExperts: []
                }
              })
            );
            hasEmittedSuggestions = true;
          } catch (error) {
            console.error('❌ Erreur lors de la génération des suggestions:', error);
          }
          this.updateMemory(new AIMessage(fullAssistantResponse.trim()));
          emitter.emit('end');
        }
        if (event.name === 'FinalSourceRetriever') {
          const sources = event.data.output;
          const normalizedSources = sources?.map(source => {
            const isUploadedDoc = source.metadata?.type === 'uploaded';
            const isExpert = source.metadata?.type === 'expert';
            const isWeb = source.metadata?.type === 'web';
            const pageNumber = source.metadata?.pageNumber || source.metadata?.page || 1;
            const sourceId = source.metadata?.source;
            let url;
            if (isUploadedDoc && sourceId) {
              url = `/api/uploads/${sourceId}/content?page=${pageNumber}`;
            } else if (isExpert) {
              url = source.metadata?.url;
            } else if (isWeb) {
              url = source.metadata?.url;
            }
            let title = source.metadata?.title || '';
            if (isUploadedDoc && title) {
              title = `${title} - Page ${pageNumber}`;
            } else if (isExpert) {
              title = source.metadata?.displayTitle || title;
            }
            const limitedContent = source.pageContent?.substring(0, 1000) || '';
            return {
              pageContent: limitedContent,
              metadata: {
                title: title,
                type: source.metadata?.type || 'web',
                url: url,
                source: sourceId,
                pageNumber: pageNumber,
                displayDomain: isUploadedDoc ? 'Document local' : undefined,
                searchText: source.metadata?.searchText?.substring(0, 200) || limitedContent.substring(0, 200),
                expertData: source.metadata?.expertData,
                illustrationImage: source.metadata?.illustrationImage,
                imageTitle: source.metadata?.imageTitle,
                favicon: isWeb ? `https://s2.googleusercontent.com/s2/favicons?domain_url=${url}` : source.metadata?.favicon,
                linkText: isUploadedDoc ? 'Voir le document' : 'Voir la source',
                expertName: source.metadata?.expertName,
                fileId: sourceId,
                page: pageNumber,
                isFile: isUploadedDoc
              }
            };
          }) || [];
          console.log('🔍 Sources normalisées:', normalizedSources.length);
          emitter.emit(
            'data',
            JSON.stringify({ 
              type: 'sources', 
              data: normalizedSources,
              illustrationImage: normalizedSources[0]?.metadata?.illustrationImage || null,
              imageTitle: normalizedSources[0]?.metadata?.imageTitle || null
            })
          );
        }
      }
      else {
        emitter.emit(event.event, event.data);
      }
    }
  }

  private async searchExperts(
    query: string,
    embeddings: Embeddings,
    llm: BaseChatModel
  ): Promise<SearchResult[]> {
    try {
      console.log('👥 Recherche d\'experts pour:', query);
      const expertResults = await handleExpertSearch(
        {
          query,
          chat_history: [],
          messageId: 'search_' + Date.now(),
          chatId: 'chat_' + Date.now()
        },
        llm
      );
      return expertResults.experts.map(expert => ({
        pageContent: `Expert: ${expert.prenom} ${expert.nom}
        Spécialité: ${expert.specialite}
        Ville: ${expert.ville}
        Tarif: ${expert.tarif}€
        Expertises: ${expert.expertises}
        Services: ${JSON.stringify(expert.services)}
        ${expert.biographie}`,
        metadata: {
          type: 'expert',
          expert: true,
          expertData: expert,
          title: `${expert.prenom} ${expert.nom} - ${expert.specialite}`,
          url: `/expert/${expert.id_expert}`,
          image_url: expert.image_url,
          score: 0.6
        }
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la recherche d\'experts:', error);
      return [];
    }
  }

  private async searchWeb(query: string): Promise<SearchResult[]> {
    try {
      console.log('🌐 Recherche web pour:', query);
      const res = await searchSearxng(query, {
        language: 'fr',
        engines: this.config.activeEngines,
      });
      return res.results.map(result => ({
        pageContent: result.content,
        metadata: {
          title: result.title,
          url: result.url,
          type: 'web',
          score: 0.4,
          ...(result.img_src && { img_src: result.img_src }),
        }
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la recherche web:', error);
      return [];
    }
  }

  private async rerankDocs(
    query: string,
    docs: Document[],
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    llm: BaseChatModel
  ) {
    console.log('🔍 Mode d\'optimisation:', optimizationMode);
    console.log('🔍 Query pour la recherche d\'image:', query);
    if (optimizationMode === 'balanced' || optimizationMode === 'quality') {
      console.log('🔍 Démarrage de la recherche d\'images...');
      try {
        console.log('🔍 Appel de handleImageSearch avec la query:', query);
        const images = await handleImageSearch(
          {
            query,
            chat_history: [],
          },
          llm
        );
        console.log('🔍 Résultat brut de handleImageSearch:', JSON.stringify(images, null, 2));
        console.log('🔍 Images trouvées:', images?.length);
        if (images && images.length > 0) {
          console.log('🔍 Première image trouvée:', {
            src: images[0].img_src,
            title: images[0].title,
            url: images[0].url
          });
          return docs.slice(0, 15).map(doc => ({
            ...doc,
            metadata: {
              ...doc.metadata,
              illustrationImage: images[0].img_src,
              imageTitle: images[0].title
            }
          }));
        } else {
          console.log('⚠️ Aucune image trouvée dans le résultat');
        }
      } catch (error) {
        console.error('❌ Erreur détaillée lors de la recherche d\'image:', {
          message: error.message,
          stack: error.stack
        });
      }
    } else {
      console.log('🔍 Mode speed: pas de recherche d\'images');
    }
    return docs.slice(0, 15);
  }

  private async initializeSectorChain(llm: BaseChatModel, embeddings: Embeddings) {
    if (!this.sectorChain) {
      this.sectorChain = new SectorDocumentationResearchChain(llm, embeddings);
    }
  }

  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[]
  ) {
    const effectiveMode = 'balanced';
    const emitter = new eventEmitter();
    try {
      await this.initializeSectorChain(llm, embeddings);
      let messageData: SectorResearchMessage | null = null;
      let sectorDocs: Document[] = [];
      try {
        const messageStr = this.cleanJSONString(message);
        console.log('🔍 Message après nettoyage:', messageStr.substring(0, 100) + '...');
        if (messageStr.startsWith('{') && messageStr.endsWith('}')) {
          try {
            messageData = JSON.parse(messageStr);
            console.log('✅ Message JSON parsé avec succès:', {
              type: messageData?.type,
              sector: messageData?.sector,
              subsector: messageData?.subsector,
              hasQuery: !!messageData?.query
            });
            if (messageData?.type === 'sector_research' && messageData.sector) {
              console.log('📊 Enrichissement avec documentation sectorielle:', {
                sector: messageData.sector,
                subsector: messageData.subsector,
                query: messageData.query?.substring(0, 50) + '...'
              });
              message = messageData.query || message;
              if (this.sectorChain && messageData.sector) {
                sectorDocs = await this.sectorChain.extractSectorInformation({
                  sector: messageData.sector,
                  subsector: messageData.subsector || undefined,
                  documentPath: messageData.documentPath || ''
                });
                console.log('📚 Documents sectoriels trouvés:', sectorDocs.length);
              }
            }
          } catch (parseError) {
            console.error('❌ Erreur de parsing JSON:', parseError);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du traitement du message:', error);
        sectorDocs = [];
      }
      this.updateMemory(new HumanMessage(message));
      const mergedHistory: BaseMessage[] = [...this.conversationHistory, ...history];

      // Analyse de la requête par le LLM
      const queryAnalysis = await llm.invoke(`Tu es un expert en analyse de requêtes. Examine cette demande et détermine la stratégie de recherche optimale.
IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.

Question/Requête: "${message}"

Documents disponibles: ${sectorDocs.length > 0 ? 'Oui' : 'Non'}
Secteur: ${messageData?.sector || 'Non spécifié'}
Sous-secteur: ${messageData?.subsector || 'Non spécifié'}`);
      try {
        const cleanJSON = this.cleanJSONString(String(queryAnalysis.content));
        const analysis = JSON.parse(cleanJSON);
        console.log('🎯 Analyse de la requête:', analysis);

        // Intégration de l'analyse financière si le budget est spécifié
        if (messageData && messageData.budget) {
          const extractedFinancialData = this.extractFinancialData(sectorDocs);
          const externalFinancialData = ""; // Vous pouvez enrichir avec des données externes via API si nécessaire
          const financialAnalysisInput = {
            chat_history: mergedHistory,
            financial_data: extractedFinancialData,
            external_data: externalFinancialData,
            business_type: messageData.subsector || messageData.sector,
            location: `${messageData.city} (${messageData.region})`,
            budget: messageData.budget
          };
          try {
            const financialAnalysisResult = await handleFinancialAnalysis(financialAnalysisInput, llm);
            console.log("Analyse financière :", financialAnalysisResult);
            analysis.financialAnalysis = financialAnalysisResult;
          } catch (error) {
            console.error("❌ Erreur lors de l'analyse financière :", error);
          }
        }

        const ragChain = RAGDocumentChain.getInstance();
        if (sectorDocs.length > 0) {
          try {
            console.log('🔄 Initialisation du vector store avec les documents sectoriels...');
            await ragChain.initializeVectorStoreFromDocuments(sectorDocs, embeddings);
            console.log('✅ Vector store initialisé');
            // Lancer en parallèle la recherche vectorielle et la recherche web (si nécessaire)
            const searchSimilarPromise = ragChain.searchSimilarDocuments(message, 10);
            const webSearchPromise = analysis.requiresWebSearch
              ? searchSearxng(message, {
                  language: 'fr',
                  engines: this.config.activeEngines,
                }).catch(error => {
                  console.error('❌ Erreur lors de la recherche web:', error);
                  return { results: [] };
                })
              : Promise.resolve({ results: [] });
            let [relevantDocs, webSearchResult] = await Promise.all([
              searchSimilarPromise,
              webSearchPromise,
            ]);
            // Si aucun document pertinent n'est trouvé via le vector store, utiliser l'ensemble des documents sectoriels en fallback
            if (!relevantDocs || relevantDocs.length === 0) {
              console.log("Aucun document pertinent trouvé via le vector store. Utilisation de tous les documents sectoriels comme fallback.");
              relevantDocs = sectorDocs;
            }
            const webResults = webSearchResult.results.map(result =>
              new Document({
                pageContent: result.content,
                metadata: {
                  title: result.title,
                  url: result.url,
                  type: 'web',
                  source: 'web',
                  ...(result.img_src && { img_src: result.img_src }),
                },
              })
            );
            // On ne garde que les résultats web
            const combinedResults = webResults.map(doc => ({
              ...doc,
              metadata: {
                ...doc.metadata,
                score: 0.6
              }
            }));
            console.log('🔍 DEBUG - Avant appel rerankDocs - Mode:', effectiveMode, 'Query:', message);
            const finalResults = await this.rerankDocs(
              message,
              combinedResults,
              [],
              embeddings,
              effectiveMode,
              llm
            );
            // Modification : passer les documents issus de la recherche (documentation + web) dans le champ "docs"
            const answeringChain = await this.createAnsweringChain(
              llm,
              [],
              embeddings,
              effectiveMode
            );
            const stream = answeringChain.streamEvents(
              {
                chat_history: mergedHistory,
                query: message,
                sector: messageData?.sector || '',
                subsector: messageData?.subsector || '',
                docs: finalResults,
                financialAnalysis: analysis.financialAnalysis
              },
              {
                version: 'v1'
              }
            );
            this.handleStreamWithMemory(stream, emitter, llm, message);
          } catch (error) {
            console.error('❌ Erreur lors de la gestion des documents:', error);
            await this.handleFallback(llm, message, mergedHistory, emitter, [], embeddings, effectiveMode);
          }
        } else {
          await this.handleFallback(llm, message, mergedHistory, emitter, [], embeddings, effectiveMode);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la gestion de l\'analyse:', error);
        await this.handleFallback(llm, message, this.conversationHistory, emitter, [], embeddings, effectiveMode);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      await this.handleFallback(llm, message, this.conversationHistory, emitter, [], embeddings, effectiveMode);
    }
    return emitter;
  }

  private async handleFallback(
    llm: BaseChatModel,
    message: string,
    history: BaseMessage[],
    emitter: eventEmitter,
    fileIds: string[],
    embeddings: Embeddings,
    mode: 'speed' | 'balanced' | 'quality'
  ) {
    const answeringChain = await this.createAnsweringChain(
      llm,
      fileIds,
      embeddings,
      mode
    );
    const stream = answeringChain.streamEvents(
      {
        chat_history: history,
        query: message
      },
      {
        version: 'v1'
      }
    );
    this.handleStreamWithMemory(stream, emitter, llm, message);
  }

  private async ensureVectorStoreInitialized(documents: Document[], embeddings: Embeddings): Promise<RAGDocumentChain> {
    const ragChain = RAGDocumentChain.getInstance();
    try {
      const hasDocuments = ragChain.isInitialized();
      if (!hasDocuments) {
        console.log('🔄 Initialisation du vector store avec les documents...');
        await ragChain.initializeVectorStoreFromDocuments(documents, embeddings);
      } else {
        console.log('✅ Vector store déjà initialisé avec des documents');
      }
      return ragChain;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du vector store:', error);
      throw error;
    }
  }
}

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  legal: {
    searchAndAnswer: async (
      message,
      history,
      llm,
      embeddings,
      optimizationMode,
      fileIds
    ) => {
      const emitter = new eventEmitter();
      try {
        const mergedHistory: BaseMessage[] = history;
        const chain = RAGDocumentChain.getInstance();
        await chain.initializeVectorStoreFromDocuments(
          fileIds.map(fileId => new Document({
            pageContent: '',
            metadata: { source: fileId }
          })),
          embeddings
        );
        const searchChain = chain.createSearchChain(llm);
        const results = await searchChain.invoke({
          query: message,
          chat_history: mergedHistory,
          type: 'legal'
        });
        const response: SearchResponse = {
          text: results,
          sources: []
        };
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: response.text
          })
        );
        emitter.emit('end');
      } catch (error) {
        emitter.emit(
          'error',
          JSON.stringify({
            type: 'error',
            data: error.message
          })
        );
      }
      return emitter;
    }
  },
  documents: {
    searchAndAnswer: async (
      message,
      history,
      llm,
      embeddings,
      optimizationMode,
      fileIds
    ) => {
      const emitter = new eventEmitter();
      try {
        const chain = RAGDocumentChain.getInstance();
        await chain.initializeVectorStoreFromDocuments(
          fileIds.map(fileId => new Document({
            pageContent: '',
            metadata: { source: fileId }
          })),
          embeddings
        );
        const searchChain = chain.createSearchChain(llm);
        const results = await searchChain.invoke({
          query: message,
          chat_history: history,
          type: 'documents'
        });
        const response: SearchResponse = {
          text: results,
          sources: []
        };
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: response.text
          })
        );
        emitter.emit('end');
      } catch (error) {
        emitter.emit(
          'error',
          JSON.stringify({
            type: 'error',
            data: error.message
          })
        );
      }
      return emitter;
    }
  },
  uploads: {
    searchAndAnswer: async (
      message,
      history,
      llm,
      embeddings,
      optimizationMode,
      fileIds
    ) => {
      const emitter = new eventEmitter();
      try {
        const queryIntent = await llm.invoke(`
          Analysez cette requête et déterminez son intention principale :
          1. SUMMARY (demande de résumé ou synthèse globale)
          2. ANALYSIS (demande d'analyse ou d'explication)
          3. SPECIFIC (question spécifique sur le contenu)
          4. COMPARE (demande de comparaison)
          Requête : "${message}"
          Répondez uniquement avec l'intention.
        `);
        const intent = String(queryIntent.content).trim();
        console.log('🎯 Intention détectée:', intent);
        const docs = await Promise.all(
          fileIds.map(async fileId => {
            const filePath = path.join(process.cwd(), 'uploads', fileId);
            const contentPath = `${filePath}-extracted.json`;
            if (!fs.existsSync(contentPath)) {
              throw new Error(`Fichier non trouvé: ${contentPath}`);
            }
            const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
            const chunkSize = 1000;
            const overlap = 100;
            const chunks: string[] = [];
            let currentChunk = '';
            let currentSize = 0;
            content.contents.forEach((text: string) => {
              currentChunk += text + ' ';
              currentSize += text.length;
              if (currentSize >= chunkSize) {
                chunks.push(currentChunk);
                currentChunk = currentChunk.slice(-overlap);
                currentSize = overlap;
              }
            });
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            return chunks.map((chunk, index) => {
              const pageNumber = Math.floor(index / (chunks.length / (content.pageCount || 1))) + 1;
              return new Document({
                pageContent: chunk,
                metadata: {
                  title: content.title || 'Document sans titre',
                  source: fileId,
                  type: 'uploaded',
                  url: `/viewer/${fileId}?page=${pageNumber}`,
                  pageNumber: pageNumber,
                  chunkIndex: index,
                  totalChunks: chunks.length,
                  searchText: chunk
                    .substring(0, 100)
                    .replace(/[\n\r]+/g, ' ')
                    .trim()
                }
              });
            });
          })
        );
        const flatDocs = docs.flat();
        console.log('📚 Nombre total de chunks:', flatDocs.length);
        const ragChain = RAGDocumentChain.getInstance();
        await ragChain.initializeVectorStoreFromDocuments(flatDocs, embeddings);
        const chain = ragChain.createSearchChain(llm);
        let queryPrompt = message;
        switch (intent) {
          case 'SUMMARY':
            queryPrompt =
              'Fais un résumé complet et structuré de ce document en te concentrant sur les points clés';
            break;
          case 'ANALYSIS':
            queryPrompt = `Analyse en détail les aspects suivants du document concernant : ${message}. Fournis une analyse structurée avec des exemples du texte.`;
            break;
          case 'SPECIFIC':
            queryPrompt = `En te basant sur le contenu du document, réponds précisément à cette question : ${message}`;
            break;
          case 'COMPARE':
            queryPrompt = `Compare et analyse en détail les différents aspects concernant : ${message}. Structure ta réponse par points de comparaison.`;
            break;
        }
        const stream = await chain.streamEvents(
          {
            query: queryPrompt,
            chat_history: history,
            type: intent.toLowerCase()
          },
          { version: 'v1' }
        );
        let sourcesEmitted = false;
        for await (const event of stream) {
          if (event.event === 'on_chain_stream') {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: event.data.chunk
              })
            );
          }
          if (!sourcesEmitted && event.event === 'on_chain_start') {
            const sources = flatDocs.slice(0, 5).map(doc => ({
              title: doc.metadata?.title || '',
              content: doc.metadata?.searchText || '',
              url: doc.metadata?.url,
              source: doc.metadata?.source,
              type: 'uploaded',
              pageNumber: doc.metadata?.pageNumber
            }));
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'sources',
                data: sources
              })
            );
            sourcesEmitted = true;
          }
          if (event.event === 'on_chain_end') {
            emitter.emit('end');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la recherche dans les documents:', error);
        emitter.emit(
          'error',
          JSON.stringify({
            type: 'error',
            data: error.message
          })
        );
      }
      return emitter;
    }
  }
};

export default MetaSearchAgent;
