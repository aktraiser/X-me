import {
  academicSearchResponsePrompt,
  academicSearchRetrieverPrompt,
} from './academicSearch';
import {
  redditSearchResponsePrompt,
  redditSearchRetrieverPrompt,
} from './redditSearch';
import { webSearchResponsePrompt, webSearchRetrieverPrompt } from './webSearch';
import {
  wolframAlphaSearchResponsePrompt,
  wolframAlphaSearchRetrieverPrompt,
} from './wolframAlpha';
import { writingAssistantPrompt } from './writingAssistant';
import {
  youtubeSearchResponsePrompt,
  youtubeSearchRetrieverPrompt,
} from './youtubeSearch';
import {
  webSearchetudeRetrieverPrompt,
  webSearchetudeResponsePrompt,
} from './webEtude';

export { webSearchRetrieverPrompt, webSearchResponsePrompt } from './webSearch';
export { webSearchetudeRetrieverPrompt, webSearchetudeResponsePrompt } from './webEtude';

export default {
  webSearchResponsePrompt,
  webSearchRetrieverPrompt,
  webSearchetudeRetrieverPrompt,
  webSearchetudeResponsePrompt,
  academicSearchResponsePrompt,
  academicSearchRetrieverPrompt,
  redditSearchResponsePrompt,
  redditSearchRetrieverPrompt,
  wolframAlphaSearchResponsePrompt,
  wolframAlphaSearchRetrieverPrompt,
  writingAssistantPrompt,
  youtubeSearchResponsePrompt,
  youtubeSearchRetrieverPrompt,
};
