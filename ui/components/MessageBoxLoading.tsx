const MessageBoxLoading = () => {
  const steps = [
    "Prise en compte du contexte",
    "Analyse",
    "Recherche d'un expert",
    "Inférence"
  ];

  return (
    <div className="flex flex-col space-y-8 w-full">
      
      {/* Steps animation */}
      <div className="px-4 h-6 relative mb-6">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="absolute left-4 flex items-center"
                style={{
                  opacity: 0,
                  animation: `stepAnimation 12s ease-in-out infinite`,
                  animationDelay: `${index * 3}s`
                }}
              >
                <span className="text-sm text-black/70 dark:text-white/70">
                  {step}
                  <span className="loading-dots after:content-[''] after:inline-block after:w-4"></span>
                </span>
              </div>
            ))}
          </div>

      {/* Question loading */}
      <div className="w-full lg:w-9/12 animate-pulse">
        <div className="h-8 bg-light-secondary dark:bg-dark-secondary rounded-lg w-1/3" />
      </div>

      {/* Sources loading */}
      <div className="w-full lg:w-9/12">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-5 w-5 bg-light-secondary dark:bg-dark-secondary rounded-full animate-pulse" />
          <div className="h-5 w-24 bg-light-secondary dark:bg-dark-secondary rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-light-secondary dark:bg-dark-secondary h-20 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Response loading */}
      <div className="flex flex-col lg:flex-row lg:space-x-8 w-full">
        <div className="w-full lg:w-9/12">
          
          {/* Content loading skeleton */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-5 w-5 bg-light-secondary dark:bg-dark-secondary rounded-full animate-pulse" />
              <div className="h-5 w-32 bg-light-secondary dark:bg-dark-secondary rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-full animate-pulse" />
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-11/12 animate-pulse" />
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-9/12 animate-pulse" />
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-10/12 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBoxLoading;

// Ajoutez ce CSS dans votre fichier global.css
/*
@keyframes stepAnimation {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  5% {
    opacity: 1;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
    transform: translateY(0);
  }
  25% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 0;
  }
}

.loading-dots::after {
  animation: loadingDots 1.5s infinite;
}

@keyframes loadingDots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: ''; }
}
*/
