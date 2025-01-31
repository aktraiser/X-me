import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { getOpenaiApiKey } from '../../config';
import logger from '../../utils/logger';

export const loadOpenAIChatModels = async () => {
  const openAIApiKey = getOpenaiApiKey();

  if (!openAIApiKey) return {};

  try {
    const chatModels = {
      'gpt-4o': {
        displayName: 'gpt-4o-2024-11-20',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4o',
          temperature: 1.3,
        }),
      },
      'gpt-3.5-turbo': {
        displayName: 'GPT-3.5 Turbo',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-3.5-turbo',
          temperature: 1.2,
        }),
      },
      'gpt-4-turbo': {
        displayName: 'GPT-4 turbo',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4-turbo',
          temperature: 0.2,
        }),
      },
      'gpt-4omni': {
        displayName: 'GPT-4 omni',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4o',
          temperature: 0.2,
        }),
      },
      'gpt-4o-mini': {
        displayName: 'gpt-4o-mini-2024-07-18',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4o-mini',
          temperature: 1.2,
        }),
      },
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading OpenAI models: ${err}`);
    return {};
  }
};

export const loadOpenAIEmbeddingsModels = async () => {
  const openAIApiKey = getOpenaiApiKey();

  if (!openAIApiKey) return {};

  try {
    const embeddingModels = {
      'text-embedding-3-small': {
        displayName: 'Text Embedding 3 Small',
        model: new OpenAIEmbeddings({
          openAIApiKey,
          modelName: 'text-embedding-3-small',
          stripNewLines: true,
        }),
      },
      'text-embedding-3-large': {
        displayName: 'Text Embedding 3 Large',
        model: new OpenAIEmbeddings({
          openAIApiKey,
          modelName: 'text-embedding-3-large',
          stripNewLines: true,
        }),
      },
    };

    return embeddingModels;
  } catch (err) {
    logger.error(`Error loading OpenAI embeddings model: ${err}`);
    return {};
  }
};
