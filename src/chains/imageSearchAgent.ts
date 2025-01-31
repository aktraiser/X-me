import {
  RunnableSequence,
  RunnableMap,
  RunnableLambda,
} from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { searchSearxng } from '../lib/searxng';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

const EXCLUDE_TERMS = [
  'watermark',
  'shutterstock',
  'istockphoto',
  'photo by',
  'unsplash+',
  'getty'
];

const imageSearchChainPrompt = `
Vous êtes un expert en recherche d'images sur Unsplash. Votre objectif est de trouver des images professionnelles et authentiques qui illustrent parfaitement le contexte business.

Instructions :
- Traduisez la demande en 2-3 mots-clés maximum en anglais
- Privilégiez des termes génériques et visuels (ex: "business meeting", "office team", "startup workspace")
- Évitez les termes techniques ou trop spécifiques
- Recherchez des images naturelles montrant des personnes en situation professionnelle

Conversation :
{chat_history}

Question : {query}
Requête de recherche d'image :`;

type ImageSearchChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

const strParser = new StringOutputParser();

const createImageSearchChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: ImageSearchChainInput) => {
        return formatChatHistoryAsString(input.chat_history);
      },
      query: (input: ImageSearchChainInput) => {
        return input.query;
      },
    }),
    PromptTemplate.fromTemplate(imageSearchChainPrompt),
    llm,
    strParser,
    RunnableLambda.from(async (input: string) => {
      const res = await searchSearxng(input, {
        engines: ['unsplash'],
        language: 'fr',
        categories: ['images'],
      });
      
      const images = [];
      res.results.forEach((result) => {
        if (
          result.img_src && 
          result.url && 
          result.title &&
          !containsTechnicalContent(result) &&
          isRelevantImage(result)
        ) {
          images.push({
            img_src: result.img_src,
            url: result.url,
            title: result.title,
          });
        }
      });
      
      const sortedImages = images.sort((a, b) => {
        const scoreA = calculateRelevanceScore(a);
        const scoreB = calculateRelevanceScore(b);
        return scoreB - scoreA;
      });
      
      return sortedImages.slice(0, 5);
    }),
  ]);
};

const containsTechnicalContent = (result: any): boolean => {
  // On récupère le titre et l'URL en minuscule
  const content = (result.title + ' ' + result.url).toLowerCase();

  // Mots-clés existants
  const techTerms = ['diagram', 'chart', 'graph', 'schema', 'process', 'workflow'];

  // Si l'un ou l'autre est trouvé, on considère le résultat invalide
  return (
    techTerms.some(term => content.includes(term)) ||
    EXCLUDE_TERMS.some(term => content.includes(term))
  );
};

const isRelevantImage = (result: any): boolean => {
  // Vérifier si l'image vient d'Unsplash
  if (!result.url.includes('unsplash.com')) {
    return false;
  }

  // Vérifier que ce n'est pas une image Unsplash+
  if (result.url.includes('plus.unsplash.com')) {
    return false;
  }

  // Vérifier la qualité de l'image
  const qualityTerms = [
    'business', 'office', 'professional',
    'team', 'meeting', 'workplace',
    'startup', 'work', 'collaboration',
    'corporate', 'company', 'entrepreneur'
  ];

  const content = result.title.toLowerCase();
  return qualityTerms.some(term => content.includes(term));
};

const calculateRelevanceScore = (image: any): number => {
  let score = 0;

  // Score de base pour les images Unsplash
  if (image.url.includes('unsplash.com') && !image.url.includes('plus.unsplash.com')) {
    score += 10;
  }

  // Bonus pour les termes pertinents
  const qualityTerms = [
    'business', 'office', 'professional',
    'team', 'meeting', 'workplace',
    'startup', 'work', 'collaboration',
    'corporate', 'company', 'entrepreneur'
  ];

  qualityTerms.forEach(term => {
    if (image.title.toLowerCase().includes(term)) {
      score += 2;
    }
  });

  // Malus pour les contenus non désirés
  if (containsTechnicalContent(image)) {
    score -= 10;
  }

  return score;
};

const handleImageSearch = (
  input: ImageSearchChainInput,
  llm: BaseChatModel,
) => {
  const imageSearchChain = createImageSearchChain(llm);
  return imageSearchChain.invoke(input);
};

export default handleImageSearch;