import axios from 'axios';
import { getSearxngApiEndpoint, getSearxngEtudeApiEndpoint } from '../config';

export interface SearxngSearchOptions {
  language?: string;
  engines?: string[];
  categories?: string[];
  limit?: number;
  pageno?: number;
  isEtude?: boolean;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

export async function searchSearxng(
  query: string,
  opts: SearxngSearchOptions = {}
) {
  const searxngURL = opts.isEtude ? getSearxngEtudeApiEndpoint() : getSearxngApiEndpoint();

  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      if (key === 'isEtude') return;
      if (Array.isArray(opts[key])) {
        url.searchParams.append(key, opts[key].join(','));
        return;
      }
      url.searchParams.append(key, opts[key]);
    });
  }

  const res = await axios.get(url.toString());

  const results: SearxngSearchResult[] = res.data.results;
  const suggestions: string[] = res.data.suggestions;

  return { results, suggestions };
}
