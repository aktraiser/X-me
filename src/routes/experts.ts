import express from 'express';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getAvailableChatModelProviders } from '../lib/providers';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import logger from '../utils/logger';
import { ChatOpenAI } from '@langchain/openai';
import handleExpertSearch from '../chains/expertSearchAgent';
import { ExpertSearchRequest } from '../types/types';

const router = express.Router();

interface ChatModel {
  provider: string;
  model: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

interface ExpertsBody {
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  chatModel?: ChatModel;
}

router.post('/', async (req, res) => {
  try {
    let body: ExpertsBody = req.body;

    const chatHistory: BaseMessage[] = body.chatHistory.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });

    const chatModelProviders = await getAvailableChatModelProviders();

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.model ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    let llm: BaseChatModel | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      if (
        !body.chatModel?.customOpenAIBaseURL ||
        !body.chatModel?.customOpenAIKey
      ) {
        return res
          .status(400)
          .json({ message: 'Missing custom OpenAI base URL or key' });
      }

      llm = new ChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        temperature: 0.7,
        configuration: {
          baseURL: body.chatModel.customOpenAIBaseURL,
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel].model;
    }

    if (!llm) {
      return res.status(400).json({ message: 'Invalid model selected' });
    }

    const lastMessage = chatHistory[chatHistory.length - 1];

    if (!lastMessage) {
      return res.status(400).json({ message: 'No messages in chat history' });
    }

    const searchRequest: ExpertSearchRequest = {
      query: lastMessage.content.toString(),
      chat_history: chatHistory,
      messageId: 'search_' + Date.now(),
      chatId: 'chat_' + Date.now()
    };

    const result = await handleExpertSearch(searchRequest, llm);

    res.status(200).json({
      suggestions: [],
      suggestedExperts: result.experts
    });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in finding experts: ${err.message}`);
  }
});

router.post('/suggestionexperts', async (req, res) => {
  try {
    let body: ExpertsBody = req.body;

    const chatHistory: BaseMessage[] = body.chatHistory.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });

    const chatModelProviders = await getAvailableChatModelProviders();

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.model ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    let llm: BaseChatModel | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      if (
        !body.chatModel?.customOpenAIBaseURL ||
        !body.chatModel?.customOpenAIKey
      ) {
        return res
          .status(400)
          .json({ message: 'Missing custom OpenAI base URL or key' });
      }

      llm = new ChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        temperature: 0.7,
        configuration: {
          baseURL: body.chatModel.customOpenAIBaseURL,
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel].model;
    }

    if (!llm) {
      return res.status(400).json({ message: 'Invalid model selected' });
    }

    const lastMessage = chatHistory[chatHistory.length - 1];

    if (!lastMessage) {
      return res.status(400).json({ message: 'No messages in chat history' });
    }

    const searchRequest: ExpertSearchRequest = {
      query: lastMessage.content.toString(),
      chat_history: chatHistory,
      messageId: 'search_' + Date.now(),
      chatId: 'chat_' + Date.now()
    };

    const result = await handleExpertSearch(searchRequest, llm);

    // S'assurer que tous les champs requis sont présents avec des valeurs par défaut
    const experts = result.experts.map(expert => ({
      id: expert.id || 0,
      id_expert: expert.id_expert || '',
      nom: expert.nom || '',
      prenom: expert.prenom || '',
      adresse: expert.adresse || '',
      pays: expert.pays || '',
      ville: expert.ville || '',
      expertises: expert.expertises || '',
      biographie: expert.biographie || '',
      tarif: expert.tarif || 0,
      services: expert.services || {},
      created_at: expert.created_at || new Date().toISOString(),
      image_url: expert.image_url || ''
    }));

    res.status(200).json({
      suggestions: [],
      suggestedExperts: experts
    });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in finding experts: ${err.message}`);
  }
});

export default router; 