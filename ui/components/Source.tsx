import { Document } from '@langchain/core/documents';
import { File, X } from 'lucide-react';

const Source = ({
  sources,
  isOpen,
  onClose
}: {
  sources: Document[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  const filteredSources = sources.filter(source => source.metadata.type !== 'expert');

  return (
    <div className="bg-light-secondary dark:bg-dark-primary border border-light-200 dark:border-gray-400 rounded-lg shadow-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 dark:text-white">
          {filteredSources.length} sources
        </h3>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-light-200 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-sm text-black/70 dark:text-white/70">Fermer</span>
          <X className="w-5 h-5 text-black/70 dark:text-white/70" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto">
        {filteredSources.map((source, i) => {
          const url = source.metadata.url;
          const isFile = source.metadata.isFile;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-light-secondary hover:bg-light-200 dark:bg-dark-secondary dark:hover:bg-gray-800 transition duration-200 rounded-lg p-3 flex flex-col justify-between h-24 font-medium"
            >
              <p className="dark:text-white text-xs line-clamp-2">
                {source.metadata.title}
              </p>
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center space-x-1">
                  {isFile ? (
                    <div className="bg-dark-200 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full">
                      <File size={12} className="text-white/70" />
                    </div>
                  ) : (
                    <img
                      src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${url}`}
                      width={16}
                      height={16}
                      alt="favicon"
                      className="rounded-lg h-4 w-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <p className="text-xs text-black/50 dark:text-white/50 truncate max-w-[120px] flex-shrink">
                    {isFile 
                      ? `Page ${source.metadata.page || 1}`
                      : url
                        ? new URL(url).hostname.replace(/^www\./, '')
                        : 'Source'}
                  </p>
                </div>
                <div className="flex flex-row items-center space-x-1 text-black/50 dark:text-white/50 text-xs">
                  <div className="bg-black/50 dark:bg-white/50 h-[4px] w-[4px] rounded-full" />
                  <span>{i + 1}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default Source; 