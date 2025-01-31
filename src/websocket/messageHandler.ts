import { EventEmitter, WebSocket } from 'ws';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import db from '../db';
import { chats, messages as messagesSchema } from '../db/schema';
import { eq, asc, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { getFileDetails } from '../utils/files';
import MetaSearchAgent, {
  MetaSearchAgentType,
} from '../search/metaSearchAgent';
import prompts from '../prompts';
import MarketResearchAgent from '../search/marketResearchAgent';


type Message = {
  messageId: string;
  chatId: string;
  content: string;
};

type SearchHandlerType = 
  | 'webSearch' 
  | 'marketResearch' 
  | 'academicSearch' 
  | 'writingAssistant' 
  | 'wolframAlphaSearch' 
  | 'youtubeSearch' 
  | 'redditSearch'
  | 'legal'
  | 'documents'
  | 'uploads';

type WSMessage = {
  message: Message;
  optimizationMode: 'speed' | 'balanced' | 'quality';
  type: 'message' | 'sources' | 'error';
  focusMode: SearchHandlerType;
  history: Array<[string, string]>;
  files: Array<string>;
};

export const searchHandlers = {
  webSearch: new MetaSearchAgent({
    activeEngines: ['google'],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.5,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
  }),
  marketResearch: new MarketResearchAgent({
    activeEngines: ['google'],
    rerank: true,
    rerankThreshold: 0.5,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
    queryGeneratorPrompt: prompts.webSearchetudeRetrieverPrompt,
    responsePrompt: prompts.webSearchetudeResponsePrompt
  }),
  academicSearch: new MetaSearchAgent({
    activeEngines: ['google'],
    queryGeneratorPrompt: prompts.academicSearchRetrieverPrompt,
    responsePrompt: prompts.academicSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.5,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
  }),
  writingAssistant: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    responsePrompt: prompts.writingAssistantPrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: false,
    summarizer: false,
    searchDatabase: true,
  }),
  wolframAlphaSearch: new MetaSearchAgent({
    activeEngines: ['wolframalpha'],
    queryGeneratorPrompt: prompts.wolframAlphaSearchRetrieverPrompt,
    responsePrompt: prompts.wolframAlphaSearchResponsePrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
  }),
  youtubeSearch: new MetaSearchAgent({
    activeEngines: ['youtube'],
    queryGeneratorPrompt: prompts.youtubeSearchRetrieverPrompt,
    responsePrompt: prompts.youtubeSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
  }),
  redditSearch: new MetaSearchAgent({
    activeEngines: ['reddit'],
    queryGeneratorPrompt: prompts.redditSearchRetrieverPrompt,
    responsePrompt: prompts.redditSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
  }),
};

const handleEmitterEvents = (
  emitter: EventEmitter,
  ws: WebSocket,
  messageId: string,
  chatId: string,
) => {
  let receivedMessage = '';
  let sources = [];
  let isFirstChunk = true;
  let messageBuffer = '';
  const BUFFER_THRESHOLD = 50;
  const TYPING_DELAY = 10;
  let lastEmitTime = Date.now();
  const MIN_EMIT_INTERVAL = 20;

  console.log('[DEBUG] Initialisation handleEmitterEvents:', { messageId, chatId });

  emitter.on('data', (data) => {
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type === 'response' || parsedData.type === 'message') {
        messageBuffer += parsedData.data;
        const currentTime = Date.now();
        
        if (isFirstChunk) {
          ws.send(
            JSON.stringify({
              type: 'message',
              data: messageBuffer,
              messageId: messageId,
            }),
          );
          messageBuffer = '';
          isFirstChunk = false;
          lastEmitTime = currentTime;
        } else if (messageBuffer.length >= BUFFER_THRESHOLD && currentTime - lastEmitTime >= MIN_EMIT_INTERVAL) {
          ws.send(
            JSON.stringify({
              type: 'message',
              data: messageBuffer,
              messageId: messageId,
            }),
          );
          messageBuffer = '';
          lastEmitTime = currentTime;
        }
        
        receivedMessage += parsedData.data;
      } else if (parsedData.type === 'sources') {
        console.log('[DEBUG] Sources reçues dans messageHandler:', {
          count: parsedData.data?.length || 0,
          firstSource: parsedData.data[0]?.metadata?.title || 'No title'
        });
        sources = parsedData.data;
        ws.send(
          JSON.stringify({
            type: 'sources',
            data: parsedData.data,
            messageId: messageId,
          }),
        );
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement des données:', error);
      // Ne pas arrêter le processus, continuer avec les prochaines données
    }
  });

  emitter.on('end', async () => {
    console.log('[DEBUG] Event end reçu:', {
      finalMessageLength: receivedMessage.length,
      sourcesCount: sources.length,
      messageId
    });

    if (messageBuffer.length > 0) {
      ws.send(
        JSON.stringify({
          type: 'message',
          data: messageBuffer,
          messageId: messageId,
        })
      );
    }
    
    console.log('[DEBUG] Envoi du messageEnd');
    ws.send(JSON.stringify({ type: 'messageEnd', messageId: messageId }));

    console.log('[DEBUG] Sauvegarde en base de données');
    try {
      await db.insert(messagesSchema)
        .values({
          content: receivedMessage,
          chatId: chatId,
          messageId: messageId,
          role: 'assistant',
          metadata: JSON.stringify({
            createdAt: new Date(),
            ...(sources && sources.length > 0 && { sources }),
          }),
        })
        .execute();
    } catch (err) {
      console.error('Error saving message to database:', err);
    }
  });

  emitter.on('error', (data) => {
    const parsedData = JSON.parse(data);
    console.error('[DEBUG] Erreur reçue dans messageHandler:', parsedData.data);
    ws.send(
      JSON.stringify({
        type: 'error',
        data: parsedData.data,
        messageId: messageId,
      }),
    );
  });
};

export const handleMessage = async (
  message: string,
  ws: WebSocket,
  llm: BaseChatModel,
  embeddings: Embeddings,
) => {
  try {
    const parsedWSMessage: WSMessage = JSON.parse(message);
    let parsedMessage: Message;
    
    // Validate message structure
    if (!parsedWSMessage.message || !parsedWSMessage.type) {
      return ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Invalid message format',
          key: 'INVALID_FORMAT',
        }),
      );
    }

    parsedMessage = parsedWSMessage.message;

    console.log('[DEBUG] Received message:', {
      focusMode: parsedWSMessage.focusMode,
      content: parsedMessage.content,
      type: parsedWSMessage.type
    });

    if (parsedWSMessage.files?.length > 0) {
      /* TODO: Implement uploads in other classes/single meta class system*/
      parsedWSMessage.focusMode = 'webSearch';
    }

    const humanMessageId =
      parsedMessage.messageId ?? crypto.randomBytes(7).toString('hex');
    const aiMessageId = crypto.randomBytes(7).toString('hex');

    if (!parsedMessage.content)
      return ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Invalid message format',
          key: 'INVALID_FORMAT',
        }),
      );

    const history: BaseMessage[] = (parsedWSMessage.history || []).map((msg) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    if (parsedWSMessage.type === 'message') {
      console.log('[DEBUG] Getting handler for mode:', {
        requestedMode: parsedWSMessage.focusMode,
        availableHandlers: Object.keys(searchHandlers),
        hasHandler: searchHandlers.hasOwnProperty(parsedWSMessage.focusMode)
      });
      
      const handler: MetaSearchAgentType | undefined = searchHandlers[parsedWSMessage.focusMode];

      if (handler) {
        try {
          console.log('[DEBUG] Handler found:', {
            type: handler.constructor.name,
            focusMode: parsedWSMessage.focusMode,
            engines: (handler as any).config?.activeEngines || [],
            prompts: {
              queryGenerator: (handler as any).config?.queryGeneratorPrompt?.substring(0, 50) + '...',
              response: (handler as any).config?.responsePrompt?.substring(0, 50) + '...'
            }
          });
          
          console.log('[DEBUG] Handler configuration:', {
            prompts: {
              queryGenerator: (handler as any).config?.queryGeneratorPrompt?.substring(0, 50) + '...',
              response: (handler as any).config?.responsePrompt?.substring(0, 50) + '...'
            },
            searchWeb: (handler as any).config?.searchWeb,
            rerank: (handler as any).config?.rerank
          });

          const emitter = await handler.searchAndAnswer(
            parsedMessage.content,
            history,
            llm,
            embeddings,
            parsedWSMessage.optimizationMode,
            parsedWSMessage.files,
          );

          console.log('[DEBUG] Setting up emitter events');
          handleEmitterEvents(emitter, ws, aiMessageId, parsedMessage.chatId);

          const chat = await db.query.chats.findFirst({
            where: eq(chats.id, parsedMessage.chatId),
          });

          if (!chat) {
            await db
              .insert(chats)
              .values({
                id: parsedMessage.chatId,
                title: parsedMessage.content,
                createdAt: new Date().toString(),
                focusMode: parsedWSMessage.focusMode,
                files: parsedWSMessage.files.map(getFileDetails),
              })
              .execute();
          }

          const messageExists = await db.query.messages.findFirst({
            where: eq(messagesSchema.messageId, humanMessageId),
          });

          if (!messageExists) {
            await db
              .insert(messagesSchema)
              .values({
                content: parsedMessage.content,
                chatId: parsedMessage.chatId,
                messageId: humanMessageId,
                role: 'user',
                metadata: JSON.stringify({
                  createdAt: new Date(),
                }),
              })
              .execute();
          } else {
            await db
              .delete(messagesSchema)
              .where(gt(messagesSchema.id, messageExists.id))
              .execute();
          }
        } catch (err) {
          console.error('[DEBUG] Error in handler:', err);
          ws.send(
            JSON.stringify({
              type: 'error',
              data: err instanceof Error ? err.message : 'Error processing message',
              key: 'HANDLER_ERROR',
            }),
          );
        }
      } else {
        console.error('[DEBUG] Invalid focus mode:', parsedWSMessage.focusMode);
        ws.send(
          JSON.stringify({
            type: 'error',
            data: 'Invalid focus mode',
            key: 'INVALID_FOCUS_MODE',
          }),
        );
      }
    }
  } catch (err) {
    console.error('[DEBUG] Error parsing message:', err);
    ws.send(
      JSON.stringify({
        type: 'error',
        data: 'Invalid message format',
        key: 'INVALID_FORMAT',
      }),
    );
    logger.error(`Failed to handle message: ${err}`);
  }
};