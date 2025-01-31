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
import { SectorDocumentationResearchChain } from '../chains/sectorDocumentationResearchChain';
import { SearxngSearchOptions } from '../lib/searxng';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EventEmitter } from 'events';
import { webSearchetudeRetrieverPrompt, webSearchetudeResponsePrompt } from '../prompts/webEtude';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

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
  sector?: string;
  subsector?: string;
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

// Ajouter l'interface pour les métadonnées des documents
interface DocumentMetadata {
  title?: string;
  source?: string;
  fileId?: string;
  url?: string; // Ajout de l'url optionnelle
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
  query: string;
  documentPath: string;
}

interface ChainInput extends BasicChainInput {
  docs?: Document[];
}

interface AnsweringChainInput {
  chat_history: BaseMessage[];
  query: string;
  sector?: string;
  subsector?: string;
}

export class MetaSearchAgent implements MetaSearchAgentType {
  private config: Config;
  private strParser = new StringOutputParser();
  private fileIds: string[];
  private conversationHistory: BaseMessage[] = [];
  private sectorChain: SectorDocumentationResearchChain;
  private currentSector: string | null = null;
  private vectorStore: Chroma | null = null;

  constructor(config: Config) {
    this.config = config;
    this.fileIds = [];
  }

  private updateMemory(message: BaseMessage) {
    this.conversationHistory.push(message);
  }

  public getMemory(): BaseMessage[] {
    return this.conversationHistory;
  }

  private async createSearchRetrieverChain(llm: BaseChatModel) {
    console.log('🔄 Initialisation de la chaîne de recherche...');
    (llm as unknown as ChatOpenAI).temperature = 0;

    return RunnableSequence.from([
      PromptTemplate.fromTemplate(this.config.queryGeneratorPrompt),
      llm,
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        console.log('🔍 Analyse de la requête:', input);
        const linksOutputParser = new LineListOutputParser({
          key: 'links',
        });

        const questionOutputParser = new LineOutputParser({
          key: 'question',
        });

        const links = await linksOutputParser.parse(input);
        console.log('🔗 Liens extraits:', links.length);
        
        let question = this.config.summarizer
          ? await questionOutputParser.parse(input)
          : input;
        console.log('❓ Question reformulée:', question);

        if (question === 'not_needed') {
          console.log('⚠️ Recherche non nécessaire');
          return { query: '', docs: [] };
        }

        if (links.length > 0) {
          console.log('📑 Traitement des liens trouvés...');
          let docs = [];
          const linkDocs = await getDocumentsFromLinks({ links });
          console.log(`📄 Documents récupérés depuis les liens: ${linkDocs.length}`);

          await Promise.all(
            linkDocs.map(async (doc) => {
              console.log(`🔄 Analyse du document: ${doc.metadata.title || 'Sans titre'}`);
              const res = await llm.invoke(`
                Analyse ce document selon les critères suivants:
                ${this.config.queryGeneratorPrompt}
                
                Document à analyser:
                ${doc.pageContent}
              `);
              console.log('✅ Document analysé');

              docs.push(new Document({
                pageContent: res.content as string,
                metadata: {
                  ...doc.metadata,
                  type: 'web',
                  analyzed: true,
                  processedAt: new Date().toISOString()
                },
              }));
            })
          );

          console.log(`📚 Total documents traités: ${docs.length}`);
          return { query: question, docs };
        } else {
          console.log('🌐 Lancement de la recherche web...');
          const res = await searchSearxng(question, {
            language: 'fr',
            engines: this.config.activeEngines,
          });
          console.log(`🔍 Résultats de recherche trouvés: ${res.results.length}`);

          const documents = res.results.map(result => {
            console.log(`📄 Traitement du résultat: ${result.title}`);
            return new Document({
              pageContent: result.content,
              metadata: {
                title: result.title,
                url: result.url,
                type: 'web',
                displayDomain: new URL(result.url).hostname.replace('www.', ''),
                favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.url}`,
                ...(result.img_src && { img_src: result.img_src }),
              },
            });
          });

          console.log(`📚 Documents web créés: ${documents.length}`);
          return { query: question, docs: documents };
        }
      }),
    ]);
  }

  private async initializeVectorStore(docs: Document[], embeddings: Embeddings) {
    console.log('🔄 Initialisation du vectorStore...');
    
    try {
        // Création d'un ID unique pour la collection basé sur le secteur
        const collectionName = `sector_docs_${this.currentSector?.toLowerCase().replace(/\s+/g, '_')}`;
        console.log(`📚 Collection cible: ${collectionName}`);

        // Configuration de ChromaDB
        const vectorStore = await Chroma.fromDocuments(docs, embeddings, {
            collectionName: collectionName,
            url: process.env.CHROMA_URL || 'http://localhost:8000',
            collectionMetadata: {
                "hnsw:space": "cosine",
                "hnsw:construction_ef": 100,
                "hnsw:search_ef": 100,
                "hnsw:M": 16
            }
        });

        console.log(`✅ VectorStore initialisé avec ${docs.length} documents`);
        return vectorStore;
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du vectorStore:', error);
        throw error;
    }
  }

  private async processAndVectorizeDocuments(
    docs: Document[],
    embeddings: Embeddings,
    llm: BaseChatModel
  ) {
    console.log('🔄 Traitement et vectorisation des documents...');
    
    // 1. Préparation des documents
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 5000,
        chunkOverlap: 100,
    });
    
    console.log('📄 Découpage des documents en chunks...');
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`📊 ${splitDocs.length} chunks créés à partir de ${docs.length} documents`);

    // 2. Initialisation du vectorStore
    const vectorStore = await this.initializeVectorStore(splitDocs, embeddings);
    
    // 3. Recherche similaire
    console.log('🔍 Test de recherche de similarité...');
    const results = await vectorStore.similaritySearch("test", 1);
    console.log(`✅ Test de recherche réussi: ${results.length} résultats trouvés`);

    return vectorStore;
  }

  private async createAnsweringChain(
    input: AnsweringChainInput,
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    llm: BaseChatModel,
  ) {
    console.log('🔄 Création de la chaîne de réponse...');
    console.log(`⚙️ Mode d'optimisation: ${optimizationMode}`);

    return RunnableSequence.from([
      RunnableMap.from({
        query: (input: ChainInput) => input.query,
        chat_history: (input: ChainInput) => formatChatHistoryAsString(input.chat_history),
        sector: (input: ChainInput) => input.sector || 'Non spécifié',
        subsector: (input: ChainInput) => input.subsector || 'Non spécifié',
        date: () => new Date().toISOString(),
        context: RunnableLambda.from(async (input: ChainInput) => {
          console.log('🔍 Début de la recherche de contexte...');
          console.log(`📚 Recherche dans le secteur: ${input.sector}`);
          console.log(`🔍 Préparation de l'analyse sectorielle pour le sous-secteur: ${input.subsector}`);

          let docs: Document[] = [];

          // 1. Recherche sectorielle
          if (input.sector && this.sectorChain) {
            try {
              // Nettoyer les noms de secteur et sous-secteur
              const cleanSector = input.sector.replace(/\s+/g, '_');
              const cleanSubsector = input.subsector ? input.subsector.replace(/\s+/g, '_') : '';
              
              // Construire les chemins possibles
              const basePath = '/home/xme/documentation';
              const paths = [
                path.join(basePath, cleanSector, cleanSubsector),
                path.join(basePath, input.sector, input.subsector || ''),
                path.join(basePath, cleanSector),
                path.join(basePath, input.sector)
              ].filter(Boolean);

              console.log('🔍 Tentative de recherche dans les chemins suivants:');
              paths.forEach(p => console.log(`- ${p}`));

              // Essayer chaque chemin possible
              for (const currentPath of paths) {
                if (fs.existsSync(currentPath)) {
                  console.log('✅ Dossier trouvé:', currentPath);
                  
                  // Lister les fichiers PDF
                  const files = fs.readdirSync(currentPath)
                    .filter(file => file.toLowerCase().endsWith('.pdf'));
                  console.log(`📑 ${files.length} fichiers PDF trouvés dans ${currentPath}:`, files);

                  if (files.length > 0) {
                    let totalPages = 0;
                    let validDocs = 0;

                    // Traiter chaque fichier
                    for (const file of files) {
                      console.log(`\n🔄 Traitement du fichier: ${file}`);
                      try {
                        const filePath = path.join(currentPath, file);
                        console.log(`📄 Chemin complet: ${filePath}`);
                        
                        const sectorDocs = await this.sectorChain.extractSectorInformation({
                          sector: input.sector,
                          subsector: input.subsector || '',
                          documentPath: filePath
                        });

                        if (sectorDocs && sectorDocs.length > 0) {
                          console.log(`📄 Pages extraites de ${file}: ${sectorDocs.length}`);
                          
                          totalPages += sectorDocs.length;
                          validDocs += 1;

                          const enrichedDocs = sectorDocs.map(doc => ({
                            ...doc,
                            metadata: {
                              ...doc.metadata,
                              type: 'sector',
                              source: input.sector,
                              subsector: input.subsector,
                              fileName: file,
                              filePath: filePath,
                              score: 0.9,
                              processedAt: new Date().toISOString()
                            }
                          }));

                          docs = [...docs, ...enrichedDocs];
                          console.log(`✅ Document traité: ${file} (${enrichedDocs.length} chunks)`);
                        }
                      } catch (error) {
                        console.error(`❌ Erreur lors du traitement de ${file}:`, error);
                        console.error('Détails:', {
                          file,
                          path: currentPath,
                          error: error.message,
                          stack: error.stack
                        });
                      }
                    }

                    console.log(`\n📊 Résumé du traitement pour ${currentPath}:
                    - Total des pages: ${totalPages}
                    - Documents valides: ${validDocs}/${files.length}
                    - Chunks extraits: ${docs.length}`);

                    // Si on a trouvé des documents, on peut arrêter la recherche
                    if (docs.length > 0) break;
                  }
                } else {
                  console.log(`⚠️ Chemin non trouvé: ${currentPath}`);
                }
              }

              // Si aucun document n'a été trouvé, essayer une dernière fois avec le chemin de base
              if (docs.length === 0) {
                console.log('⚠️ Aucun document trouvé dans les chemins standards, tentative avec le chemin de base...');
                const relevantDocs = await this.sectorChain.extractSectorInformation({
                  sector: input.sector,
                  subsector: input.subsector || '',
                  documentPath: basePath
                });

                if (relevantDocs.length > 0) {
                  console.log(`✅ Documents trouvés dans le chemin de base: ${relevantDocs.length}`);
                  docs = relevantDocs.map(doc => ({
                    ...doc,
                    metadata: {
                      ...doc.metadata,
                      type: 'sector',
                      source: input.sector,
                      subsector: input.subsector,
                      score: 0.9,
                      processedAt: new Date().toISOString()
                    }
                  }));
                }
              }
            } catch (error) {
              console.error('❌ Erreur lors de la recherche sectorielle:', error);
              console.error('Détails:', {
                sector: input.sector,
                subsector: input.subsector,
                error: error.message,
                stack: error.stack
              });
            }
          }

          // 2. Recherche web complémentaire si activée
          if (this.config.searchWeb) {
            console.log('🌐 Démarrage de la recherche web...');
            const res = await searchSearxng(input.query, {
              language: 'fr',
              engines: this.config.activeEngines,
            });
            console.log(`🌐 Documents web trouvés: ${res.results.length}`);
            
            // Ajouter un score plus faible pour les résultats web
            const enrichedWebDocs = res.results.map(result => new Document({
              pageContent: result.content,
              metadata: {
                title: result.title,
                url: result.url,
                type: 'web',
                score: 0.6,
                displayDomain: new URL(result.url).hostname.replace('www.', ''),
                favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.url}`,
                ...(result.img_src && { img_src: result.img_src }),
              },
            }));
            
            docs = [...docs, ...enrichedWebDocs];
            console.log('📝 Documents web traités');
          }

          // 3. Reranking des documents
          console.log('📊 Reranking des documents...');
          console.log(`📚 Total documents avant reranking: ${docs.length}`);
          const rankedDocs = await this.rerankDocs(
            input.query,
            docs,
            fileIds,
            embeddings,
            optimizationMode,
            llm
          );
          console.log(`✅ Documents classés: ${rankedDocs.length}`);

          // 4. Traitement et formatage des documents
          return this.processDocs(rankedDocs);
        }).withConfig({ runName: 'FinalSourceRetriever' }),
      }),
      ChatPromptTemplate.fromMessages([
        ['system', this.config.responsePrompt || webSearchetudeResponsePrompt],
        new MessagesPlaceholder('chat_history'),
        ['user', `Secteur: {sector}
Sous-secteur: {subsector}
Date de l'analyse: {date}

Question: {query}

Contexte:
{context}

Instructions:
1. Analyse les informations fournies de manière structurée
2. Concentre-toi sur les données sectorielles spécifiques
3. Identifie les tendances et chiffres clés
4. Fournis des recommandations basées sur les données
5. Cite tes sources en utilisant les numéros entre crochets`],
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
          title: `${expert.specialite} - ${expert.ville}`,
          url: `/expert/${expert.id_expert}`,
          image_url: expert.image_url
        }
      })
    );
  }

  private processDocs(docs: Document[]) {
    console.log(`🔍 Traitement de ${docs.length} documents...`);
    if (docs.length === 0) {
      console.log('⚠️ Aucun document à traiter');
      return "Aucun document pertinent trouvé.";
    }

    // Trier les documents par score
    const sortedDocs = docs.sort((a, b) => 
      (b.metadata?.score || 0) - (a.metadata?.score || 0)
    );

    // Limiter à 10 documents
    const limitedDocs = sortedDocs.slice(0, 10);

    const processedDocs = limitedDocs
      .map((doc, index) => {
        // Formater la source
        const source = this.formatSource(doc);
        
        // Extraire les informations clés
        const keyInfo = this.extractKeyInfo(doc.pageContent);
        
        // Formater le contenu
        const content = this.formatContent(doc.pageContent);

        return `=== Source [${index + 1}]: ${source} ===\n${keyInfo}\n${content}\n`;
      })
      .join('\n\n');
    
    console.log(`✅ ${limitedDocs.length} documents traités et formatés`);
    console.log('📄 Aperçu du contexte:', processedDocs.substring(0, 200) + '...');
    
    return processedDocs;
  }

  private formatSource(doc: Document): string {
    const type = doc.metadata?.type || 'unknown';
    const title = doc.metadata?.title || 'Sans titre';
    
    switch (type) {
      case 'web':
        return `[Source Web: ${title} (${doc.metadata?.displayDomain || 'web'})]`;
      default:
        return `[${title}]`;
    }
  }

  private extractKeyInfo(content: string): string {
    const keyPatterns = [
      /\d+(?:,\d+)?(?:\s*%|\s*euros?|\s*€)/g,  // Chiffres avec unités
      /\d{4}/g,  // Années
      /\d+(?:,\d+)?\s*(?:millions?|milliards?)/g,  // Grands nombres
      /(?:CA|Chiffre d'affaires)\s*:?\s*\d+(?:,\d+)?(?:\s*[k€M]|\s*euros?|\s*millions?|\s*milliards?)/gi,  // Chiffres d'affaires
      /(?:croissance|évolution|progression|augmentation|baisse)\s*(?:de)?\s*\d+(?:,\d+)?%/gi  // Évolutions
    ];

    const keyInfo = keyPatterns
      .map(pattern => {
        const matches = content.match(pattern);
        return matches ? matches.slice(0, 5) : [];
      })
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');

    return keyInfo ? `📊 Informations clés: ${keyInfo}` : '';
  }

  private formatContent(content: string): string {
    const maxLength = 1500;
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;

    return truncated
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private async handleStream(
    stream: IterableReadableStream<StreamEvent>,
    emitter: eventEmitter,
  ) {
    console.log('🔄 Démarrage du streaming de la réponse...');
    let fullResponse = '';

    for await (const event of stream) {
      if (event.event === 'on_chain_end' && event.name === 'FinalSourceRetriever') {
        console.log('📚 Sources traitées, envoi au client...');
        const sources = event.data.output;
        
        // Normaliser les sources pour le frontend
        const normalizedSources = sources?.map(source => ({
          pageContent: source.pageContent?.substring(0, 1000) || '',
          metadata: {
            title: source.metadata?.title || '',
            type: source.metadata?.type || 'unknown',
            url: source.metadata?.url,
            score: source.metadata?.score,
            displayDomain: source.metadata?.displayDomain,
            searchText: source.pageContent?.substring(0, 200),
            favicon: source.metadata?.favicon
          }
        })) || [];

        emitter.emit('data', JSON.stringify({ 
          type: 'sources', 
          data: normalizedSources 
        }));
      }
      
      if (event.event === 'on_chain_stream' && event.name === 'FinalResponseGenerator') {
        const chunk = event.data.chunk;
        fullResponse += chunk;
        console.log('📝 Chunk de réponse généré:', chunk.substring(0, 50) + '...');
        emitter.emit('data', JSON.stringify({ 
          type: 'response', 
          data: chunk 
        }));
      }
      
      if (event.event === 'on_chain_end' && event.name === 'FinalResponseGenerator') {
        console.log('✅ Génération de la réponse terminée');
        console.log('📊 Taille totale de la réponse:', fullResponse.length);
        emitter.emit('end');
      }
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
    if (!this.config.rerank || docs.length === 0) {
      return docs.slice(0, 15);
    }

    const filesData = fileIds
      .map((file) => {
        const filePath = path.join(process.cwd(), 'uploads', file);
        const contentPath = filePath + '-extracted.json';
        const embeddingsPath = filePath + '-embeddings.json';

        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));

        return content.contents.map((c: string, i: number) => ({
          fileName: content.title,
          content: c,
          embeddings: embeddings.embeddings[i],
        }));
      })
      .flat();

    const [docEmbeddings, queryEmbedding] = await Promise.all([
      embeddings.embedDocuments(docs.map((doc) => doc.pageContent)),
      embeddings.embedQuery(query),
    ]);

    // Ajouter les documents de fichiers aux documents existants
    const allDocs = [
      ...docs,
      ...filesData.map((fileData) => new Document({
        pageContent: fileData.content,
        metadata: {
          title: fileData.fileName,
          type: 'file',
          source: 'uploaded'
        },
      })),
    ];

    const allEmbeddings = [...docEmbeddings, ...filesData.map(f => f.embeddings)];

    const similarities = allEmbeddings.map((docEmbedding, i) => ({
      index: i,
      similarity: computeSimilarity(queryEmbedding, docEmbedding),
    }));

    return similarities
      .filter((sim) => sim.similarity > (this.config.rerankThreshold || 0.3))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15)
      .map((sim) => ({
        ...allDocs[sim.index],
        metadata: {
          ...allDocs[sim.index].metadata,
          score: sim.similarity,
        },
      }));
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
    const emitter = new eventEmitter();
    
    try {
      await this.initializeSectorChain(llm, embeddings);

      let messageData: SectorResearchMessage | null = null;
      try {
        const messageObj = JSON.parse(message);
        if (messageObj.type === 'sector_research') {
          messageData = messageObj;
        }
      } catch (e) {
        // Si ce n'est pas du JSON, on continue normalement
      }

      this.updateMemory(new HumanMessage(messageData?.query || message));

      const chainInput: AnsweringChainInput = {
        chat_history: [...this.conversationHistory, ...history],
        query: messageData?.query || message,
        sector: messageData?.sector,
        subsector: messageData?.subsector,
      };

      const answeringChain = await this.createAnsweringChain(
        chainInput,
        fileIds,
        embeddings,
        optimizationMode,
        llm
      );

      const stream = answeringChain.streamEvents(
        chainInput,
        { version: 'v1' },
      );

      await this.handleStream(stream, emitter);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      emitter.emit('error', JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
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
    const chainInput: AnsweringChainInput = {
      chat_history: history,
      query: message
    };

    const answeringChain = await this.createAnsweringChain(
      chainInput,
      fileIds,
      embeddings,
      mode,
      llm
    );

    const stream = answeringChain.streamEvents(
      chainInput,
      { version: 'v1' }
    );

    this.handleStream(stream, emitter);
  }

  private async ensureVectorStoreInitialized(
    documents: Document[],
    embeddings: Embeddings,
    llm: BaseChatModel
  ): Promise<SectorDocumentationResearchChain> {
    if (!this.sectorChain) {
      this.sectorChain = new SectorDocumentationResearchChain(llm, embeddings);
    }
    return this.sectorChain;
  }

  private async ensureVectorStore(sector: string, docs: Document[], embeddings: Embeddings, llm: BaseChatModel) {
    if (this.currentSector !== sector || !this.vectorStore) {
      console.log(`🔄 Changement de secteur: ${sector}`);
      this.currentSector = sector;
      this.vectorStore = await this.processAndVectorizeDocuments(docs, embeddings, llm);
    }
    return this.vectorStore;
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
        // Fusionner l'historique si nécessaire
        const mergedHistory: BaseMessage[] = history;

        const sectorChain = new SectorDocumentationResearchChain(llm, embeddings);
        const results = await sectorChain.extractSectorInformation({
          sector: 'legal',
          subsector: '',
          documentPath: fileIds[0] || ''
        });

        // Convertir le résultat en objet SearchResponse
        const response: SearchResponse = {
          text: results.map(doc => doc.pageContent).join('\n\n'),
          sources: results.map(doc => ({
            title: doc.metadata.title || '',
            content: doc.pageContent,
            source: doc.metadata.source
          }))
        };

        // Émettre la réponse
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
        const sectorChain = new SectorDocumentationResearchChain(llm, embeddings);
        const results = await sectorChain.extractSectorInformation({
          sector: 'documents',
          subsector: '',  
          documentPath: fileIds[0] || ''
        });

        const response: SearchResponse = {
          text: results.map(doc => doc.pageContent).join('\n\n'),
          sources: results.map(doc => ({
            title: doc.metadata.title || '',
            content: doc.pageContent,
            source: doc.metadata.source
          }))
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
  }
};

export default MetaSearchAgent;

function cleanJSONString(str: string): string {
  // Supprimer les caractères non-imprimables et les espaces en début/fin
  let cleaned = str.trim();
  
  // Supprimer les délimiteurs de bloc de code markdown
  cleaned = cleaned.replace(/```json\s*|\s*```/g, '');
  
  // Supprimer les caractères de contrôle
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Remplacer les guillemets courbes par des guillemets droits
  cleaned = cleaned.replace(/[""]/g, '"');
  
  // Remplacer les apostrophes courbes par des apostrophes droites
  cleaned = cleaned.replace(/['']/g, "'");
  
  return cleaned;
}