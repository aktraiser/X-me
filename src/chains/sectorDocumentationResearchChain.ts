import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Embeddings } from '@langchain/core/embeddings';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import path from 'path';
import fs from 'fs';

export interface SectorResearchInput {
  sector: string;
  subsector?: string;
  documentPath: string;
}

// Configuration du text splitter
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 150,
  separators: ["\n\n", "\n", ".", "!", "?", ";", ":", " ", ""],
  keepSeparator: false,
  lengthFunction: (text) => text.length
});

// Fonction de prétraitement des documents
const preprocessDocument = (doc: Document): Document => {
  const cleanContent = doc.pageContent
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  return new Document({
    pageContent: cleanContent,
    metadata: {
      ...doc.metadata,
      chunk_type: 'text',
      word_count: cleanContent.split(/\s+/).length,
      processed_date: new Date().toISOString()
    }
  });
};

// Traitement des documents par lots
const processDocumentInBatches = async (
  docs: Document[],
  batchSize: number = 50
): Promise<Document[]> => {
  const processedDocs: Document[] = [];
  
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const processed = await Promise.all(
      batch.map(async (doc) => {
        const processedDoc = preprocessDocument(doc);
        console.log(`📑 Traitement chunk - Page ${doc.metadata.page} - Métadonnées:`, doc.metadata);
        return new Document({
          pageContent: processedDoc.pageContent,
          metadata: {
            ...processedDoc.metadata,
            page: doc.metadata.page,
            pageNumber: doc.metadata.page,
            total_pages: doc.metadata.total_pages,
            type: 'sector_documentation'
          }
        });
      })
    );
    processedDocs.push(...processed);
  }
  
  return processedDocs;
};

export class SectorDocumentationResearchChain {
  private llm: BaseChatModel;
  private embeddings: Embeddings;
  private strParser: StringOutputParser;
  private loadedDocuments: Document[] = [];
  private vectorStore: Chroma | null = null;
  private readonly baseCollectionName: string = 'sector_docs';

  constructor(llm: BaseChatModel, embeddings: Embeddings) {
    this.llm = llm;
    this.embeddings = embeddings;
    this.strParser = new StringOutputParser();
  }

  async getLoadedDocuments(): Promise<Document[]> {
    return this.loadedDocuments;
  }

  private getCollectionName(sector: string, subsector?: string): string {
    // Utiliser le sous-secteur s'il existe, sinon le secteur
    const name = subsector || sector;
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `${this.baseCollectionName}_${cleanName}`;
  }

  async loadSectorDocuments(input: SectorResearchInput): Promise<Document[]> {
    try {
      const documents: Document[] = [];
      
      if (!input.subsector) {
        console.warn('⚠️ Aucun sous-secteur spécifié');
        return [];
      }

      // Chemin du sous-secteur
      const sectorPath = path.join('/home/xme/documentation', input.sector.replace(/ /g, '_'));
      const subsectorPath = path.join(sectorPath, input.subsector.replace(/ /g, '_'));
      console.log(`📂 Recherche dans le sous-secteur: ${subsectorPath}`);
      
      if (!fs.existsSync(subsectorPath)) {
        console.error(`❌ Sous-secteur non trouvé: ${subsectorPath}`);
        return [];
      }

      // Charger UNIQUEMENT les documents du sous-secteur
      console.log(`✅ Sous-dossier trouvé: ${subsectorPath}`);
      const subsectorDocs = await this.loadDocumentsFromDirectory(subsectorPath, input, true);
      documents.push(...subsectorDocs);
      console.log(`📚 ${documents.length} pages chargées depuis ${subsectorDocs.length} fichiers PDF du sous-secteur ${input.subsector}`);
      
      if (documents.length > 0) {
        await this.initializeVectorStore(documents, input.sector, input.subsector);
      }
      
      return documents;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      return [];
    }
  }

  private async loadDocumentsFromDirectory(
    directoryPath: string, 
    input: SectorResearchInput, 
    isSubsector: boolean
  ): Promise<Document[]> {
    const documents: Document[] = [];
    
    try {
      const files = fs.readdirSync(directoryPath)
        .filter(file => file.toLowerCase().endsWith('.pdf'));
      
      console.log(`📑 Fichiers PDF trouvés dans ${directoryPath}:`, files);

      for (const file of files) {
        try {
          const filePath = path.join(directoryPath, file);
          console.log(`🔄 Traitement du fichier: ${file}`);
          
          const loader = new PDFLoader(filePath, {
            splitPages: true,
            parsedItemSeparator: "\n",
          });
          
          const docs = await loader.load();
          console.log(`📄 Pages chargées pour ${file}:`, docs.length);
          
          // Enrichir les documents avec les métadonnées
          const enrichedDocs = docs.map((doc, index) => {
            const pageNum = index + 1;
            return new Document({
              pageContent: `Page ${pageNum}\n\n${doc.pageContent}`,
              metadata: {
                ...doc.metadata,
                fileName: file,
                sector: input.sector,
                subsector: input.subsector,
                isSubsectorDocument: isSubsector,
                source: 'sector_documentation',
                documentPath: directoryPath,
                fullPath: filePath,
                page: pageNum,
                pageNumber: pageNum,
                total_pages: docs.length,
                extraction_date: new Date().toISOString()
              }
            });
          });

          console.log(`📊 Métadonnées enrichies pour ${file}:`, {
            pages: enrichedDocs.length,
          });

          documents.push(...enrichedDocs);
        } catch (error) {
          console.error(`❌ Erreur lors du traitement du fichier ${file}:`, error);
        }
      }

      return documents;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      return [];
    }
  }

  async extractSectorInformation(input: SectorResearchInput): Promise<Document[]> {
    if (!input.subsector || !input.sector) {
      throw new Error("Les paramètres 'subsector' et 'sector' sont requis");
    }

    try {
      console.log('🔍 Préparation de l\'analyse sectorielle pour le sous-secteur:', input.subsector);
      
      // Vérifier si la collection existe déjà
      const collectionName = this.getCollectionName(input.sector, input.subsector);
      
      if (this.vectorStore) {
        try {
          // Tenter de récupérer les documents depuis la collection existante
          const existingDocs = await this.vectorStore.similaritySearch("", 1000);
          if (existingDocs && existingDocs.length > 0) {
            console.log('📚 Utilisation de la collection existante:', existingDocs.length, 'documents');
            this.loadedDocuments = existingDocs;
            console.log('✅ Analyse terminée:', existingDocs.length, 'chunks analysés');
            console.log('📄 Documents pertinents trouvés:', existingDocs.length);
            return existingDocs;
          }
        } catch (error) {
          console.log('⚠️ Collection non trouvée, chargement depuis les fichiers...');
        }
      }
      
      // Si pas de collection existante, charger depuis les fichiers
      const documents = await this.loadSectorDocuments(input);
      console.log('📊 Documents sectoriels chargés:', documents.length);

      if (documents.length === 0) {
        console.warn('⚠️ Aucun document trouvé pour ce sous-secteur');
        return [];
      }

      // Enrichir les documents avec des métadonnées supplémentaires
      const enrichedDocs = documents.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          sector: input.sector,
          subsector: input.subsector,
          isSubsectorDocument: true,
          analysisDate: new Date().toISOString(),
          contentType: this.identifyContentType(doc.pageContent),
          documentSection: this.identifyDocumentSection(doc.pageContent)
        }
      }));

      // Sauvegarder les documents enrichis
      this.loadedDocuments = enrichedDocs;
      
      console.log('✅ Analyse terminée:', enrichedDocs.length, 'chunks analysés');
      return enrichedDocs;

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction des informations:', error);
      throw error;
    }
  }

  private async initializeVectorStore(documents: Document[], sector: string, subsector?: string): Promise<void> {
    try {
      // Filtrer les documents invalides
      const validDocuments = documents.filter(doc => 
        doc.pageContent && 
        typeof doc.pageContent === 'string' && 
        doc.pageContent.trim().length > 0
      );

      console.log(`📄 Documents valides: ${validDocuments.length}/${documents.length}`);
      
      const collectionName = this.getCollectionName(sector, subsector);
      
      // Si déjà initialisé avec les mêmes documents, ne rien faire
      if (this.vectorStore && this.loadedDocuments.length === validDocuments.length) {
        const sameDocuments = validDocuments.every((doc, index) => 
          doc.pageContent === this.loadedDocuments[index].pageContent
        );

        if (sameDocuments) {
          console.log("📚 Réutilisation de la collection existante");
          return;
        }
      }
      
      console.log("🔄 Initialisation du vectorStore avec la collection:", collectionName);
      this.vectorStore = await Chroma.fromDocuments(validDocuments, this.embeddings, {
        collectionName,
        url: "http://chroma:8000"
      });

      this.loadedDocuments = validDocuments;
      console.log("✅ VectorStore initialisé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation du vectorStore:", error);
      throw error;
    }
  }

  private identifyContentType(content: string): string {
    // Implementation of identifyContentType method
    return 'Unknown';
  }

  private identifyDocumentSection(content: string): string {
    // Implementation of identifyDocumentSection method
    return 'Unknown';
  }

  public getVectorStore(): Chroma | null {
    return this.vectorStore;
  }

  public async getCollectionDocuments(sector: string, subsector?: string): Promise<Document[]> {
    try {
      if (!this.vectorStore) {
        console.log('⚠️ VectorStore non initialisé');
        return [];
      }

      const query = "Tous les documents du secteur";
      console.log('🔍 Recherche de documents pour le secteur:', sector);
      
      // Utilisation de similaritySearch sans filtre
      const results = await this.vectorStore.similaritySearch(query, 500);
      
      // Filtrage post-recherche si nécessaire
      const filteredResults = subsector 
        ? results.filter(doc => 
            doc.metadata.sector === sector && 
            doc.metadata.subsector === subsector)
        : results.filter(doc => 
            doc.metadata.sector === sector);
      
      console.log(`📚 Documents trouvés: ${filteredResults.length}`);
      
      return filteredResults;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des documents:', error);
      throw error;
    }
  }
}