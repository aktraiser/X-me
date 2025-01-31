import { ChatOpenAI } from '@langchain/openai';
import { getDeepseekApiKey } from '../../config';
import logger from '../../utils/logger';

export const loadDeepseekChatModels = async () => {
  const deepseekApiKey = getDeepseekApiKey();

  if (!deepseekApiKey) return {};

  try {
    const chatModels = {
      'deepseek-chat': {
        displayName: 'DeepSeek Chat V3',
        model: new ChatOpenAI(
          {
            openAIApiKey: deepseekApiKey,
            modelName: 'deepseek-chat',
            temperature: 1.3,
          },
          {
            baseURL: 'https://api.deepseek.com',
            defaultHeaders: {
              'Authorization': `Bearer ${deepseekApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      },
      'deepseek-reasoner': {
        displayName: 'DeepSeek Reasoner (R1)',
        model: new ChatOpenAI(
          {
            openAIApiKey: deepseekApiKey,
            modelName: 'deepseek-reasoner',
            temperature: 0.7,
            maxTokens: 4096,
          },
          {
            baseURL: 'https://api.deepseek.com',
            defaultHeaders: {
              'Authorization': `Bearer ${deepseekApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      },
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Deepseek models: ${err}`);
    return {};
  }
}; 