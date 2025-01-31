/* eslint-disable @next/next/no-img-element */
import { PlayCircle, PlayIcon, PlusIcon, VideoIcon } from 'lucide-react';
import { useState } from 'react';
import Lightbox, { GenericSlide, VideoSlide } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';

type Video = {
  url: string;
  img_src: string;
  title: string;
  iframe_src: string;
};

declare module 'yet-another-react-lightbox' {
  export interface VideoSlide extends GenericSlide {
    type: 'video-slide';
    src: string;
    iframe_src: string;
  }

  interface SlideTypes {
    'video-slide': VideoSlide;
  }
}

const Searchvideos = ({
  query,
  chatHistory,
}: {
  query: string;
  chatHistory: Message[];
}) => {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<VideoSlide[]>([]);

  return (
    <>
      {!loading && videos === null && (
        <button
          onClick={async () => {
            setLoading(true);

            const chatModelProvider = localStorage.getItem('chatModelProvider');
            const chatModel = localStorage.getItem('chatModel');

            const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
            const customOpenAIKey = localStorage.getItem('openAIApiKey');

            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/videos`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: query,
                  chatHistory: chatHistory,
                  chatModel: {
                    provider: chatModelProvider,
                    model: chatModel,
                    ...(chatModelProvider === 'custom_openai' && {
                      customOpenAIBaseURL: customOpenAIBaseURL,
                      customOpenAIKey: customOpenAIKey,
                    }),
                  },
                }),
              },
            );

            const data = await res.json();

            const videos = data.videos ?? [];
            setVideos(videos);
            setSlides(
              videos.map((video: Video) => {
                return {
                  type: 'video-slide',
                  iframe_src: video.iframe_src,
                  src: video.img_src,
                };
              }),
            );
            setLoading(false);
          }}
          className="border border-dashed border-light-200 dark:border-dark-200 hover:bg-light-200 dark:hover:bg-dark-200 active:scale-95 duration-200 transition px-4 py-2 flex flex-row items-center justify-between rounded-lg dark:text-white text-sm w-full"
        >
          <div className="flex flex-row items-center space-x-2">
            <VideoIcon size={17} />
            <p>Voir des videos</p>
          </div>
          <PlusIcon className="text-[#24A0ED]" size={17} />
        </button>
      )}
      {loading && (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}
      {videos !== null && videos.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {/* Video principale */}
            <div
              onClick={() => {
                setOpen(true);
                setSlides([slides[0], ...slides.slice(1)]);
              }}
              className="relative transition duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer w-full"
            >
              <img
                src={videos[0].img_src}
                alt={videos[0].title}
                className="relative h-full w-full aspect-video object-cover rounded-lg"
              />
              <div className="absolute bg-white/70 dark:bg-black/70 text-black/70 dark:text-white/70 px-2 py-1 flex flex-row items-center space-x-1 bottom-1 right-1 rounded-md">
                <PlayCircle size={15} />
                <p className="text-xs">Regarder</p>
              </div>
            </div>

            {/* Grid des 4 vidéos en dessous */}
            <div className="grid grid-cols-2 gap-2">
              {videos.slice(1, 5).map((video, i) => (
                <div
                  onClick={() => {
                    setOpen(true);
                    setSlides([
                      slides[i + 1],
                      slides[0],
                      ...slides.slice(1, i + 1),
                      ...slides.slice(i + 2),
                    ]);
                  }}
                  className="relative transition duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer"
                  key={i}
                >
                  <img
                    src={video.img_src}
                    alt={video.title}
                    className="relative h-full w-full aspect-video object-cover rounded-lg"
                  />
                  <div className="absolute bg-white/70 dark:bg-black/70 text-black/70 dark:text-white/70 px-2 py-1 flex flex-row items-center space-x-1 bottom-1 right-1 rounded-md">
                    <PlayCircle size={15} />
                    <p className="text-xs">Regarder</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
          <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={slides}
            render={{
              slide: ({ slide }) =>
                slide.type === 'video-slide' ? (
                  <div className="h-full w-full flex flex-row items-center justify-center">
                    <iframe
                      src={slide.iframe_src}
                      className="aspect-video max-h-[95vh] w-[95vw] rounded-2xl md:w-[80vw]"
                      allowFullScreen
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : null,
            }}
          />
        </>
      )}
    </>
  );
};

export default Searchvideos;
