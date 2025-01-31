'use client';

import { cn } from '@/lib/utils';
import { Home, Search, SquarePen, Settings, Clock, Library, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useState, useEffect, type ReactNode } from 'react';
import Layout from './Layout';
import SettingsDialog from './SettingsDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-y-3 w-full">{children}</div>
  );
};

const IconWithTooltip = ({ icon: Icon, label, isExpanded }: { icon: any, label: string, isExpanded: boolean }) => {
  if (isExpanded) return <Icon className="shrink-0 w-5 h-5" />;
  
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Icon className="shrink-0 w-5 h-5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchChats = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/chats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
        });
        const data = await res.json();
        if (data && data.chats) {
          setChatHistory(data.chats);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Erreur:', error);
        }
      }
    };

    if (isExpanded) {
      setLoading(true);
      fetchChats().finally(() => setLoading(false));
    }

    return () => {
      controller.abort();
    };
  }, [isExpanded]);

  // Effet de débogage
  useEffect(() => {
    if (chatHistory.length > 0) {
      console.log('Historique disponible:', chatHistory);
    }
  }, [chatHistory]);

  const navLinks = [
    {
      icon: Home,
      href: '/',
      active: segments.length === 0 || segments.includes('c'),
      label: 'Accueil',
    },
    {
      icon: Search,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Découvrir',
    },
    {
      icon: Clock,
      href: '/etude',
      active: segments.includes('spaces'),
      label: 'Espaces',
    },
    {
      icon: Library,
      href: '/library',
      active: segments.includes('library'),
      label: 'Bibliothèque',
    },
  ];

  return (
    <div>
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
        isExpanded ? "lg:w-56" : "lg:w-20"
      )}>
        <div className="flex grow flex-col items-center justify-between gap-y-5 overflow-y-auto bg-light-secondary dark:bg-dark-secondary px-2 py-8">
          <div className="flex flex-col items-start gap-y-4 w-full">
            <div className="flex items-center pl-2 w-full">
              <div className={cn(
                "transition-all duration-300",
                isExpanded ? "w-20 h-20" : "w-10 h-10"
              )}>
                <Image
                  src="/images/logo.svg"
                  alt="Logo"
                  width={isExpanded ? 80 : 40}
                  height={isExpanded ? 80 : 40}
                  className="w-full h-full"
                />
              </div>
            </div>
            <button
              className={cn(
                "flex items-center w-full cursor-pointer rounded-lg py-2",
                isExpanded ? "px-3" : "justify-center hover:bg-black/10 dark:hover:bg-white/10"
              )}
            >
              {isExpanded ? (
                <div className="flex items-center gap-3 w-full px-4 py-2 border border-black/20 dark:border-white/20 rounded-full hover:border-[#c59d3f] transition-all">
                  <SquarePen className="w-5 h-5 shrink-0" />
                  <span className="text-base font-medium">Discussion</span>
                </div>
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SquarePen className="w-5 h-5 shrink-0" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Nouvelle discussion
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>
          </div>
          <VerticalIconContainer>
            {navLinks.map((link, i) => (
              <div key={i} className="w-full">
                <Link
                  href={link.href}
                  className={cn(
                    'relative flex flex-row items-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition w-full py-2 rounded-lg',
                    isExpanded ? 'px-3' : 'justify-center',
                    link.active
                      ? 'text-black dark:text-white'
                      : 'text-black/70 dark:text-white/70',
                  )}
                >
                  <IconWithTooltip icon={link.icon} label={link.label} isExpanded={isExpanded} />
                  {isExpanded && (
                    <span className="ml-3 text-base font-medium">{link.label}</span>
                  )}
                  {link.active && (
                    <div className="absolute right-0 -mr-2 h-full w-1 rounded-l-lg bg-black dark:bg-white" />
                  )}
                </Link>
                {isExpanded && link.label === "Bibliothèque" && !loading && chatHistory && chatHistory.length > 0 && (
                  <div className="relative pl-8 mt-1 space-y-0.5">
                    <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-black/10 dark:bg-white/10" />
                    {chatHistory.map((chat) => (
                      <Link
                        key={chat.id}
                        href={`/c/${chat.id}`}
                        className="flex items-center py-1.5 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
                      >
                        <span className="truncate max-w-[160px]">{chat.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </VerticalIconContainer>

          <div className="flex flex-col items-center gap-y-4 w-full">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center w-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-lg py-2",
                isExpanded ? "px-3" : "justify-center"
              )}
            >
              {isExpanded ? (
                <ArrowLeftToLine className="w-5 h-5 shrink-0" />
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ArrowRightToLine className="w-5 h-5 shrink-0" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Étendre
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isExpanded && (
                <span className="ml-3 text-base text-black/70 dark:text-white/70">Réduire</span>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "flex items-center w-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-lg py-2",
                isExpanded ? "px-3" : "justify-center"
              )}
            >
              {isExpanded ? (
                <Settings className="w-5 h-5 shrink-0" />
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Settings className="w-5 h-5 shrink-0" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Réglages
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isExpanded && (
                <span className="ml-3 text-base text-black/70 dark:text-white/70">Réglages</span>
              )}
            </button>
          </div>

          <SettingsDialog
            isOpen={isSettingsOpen}
            setIsOpen={setIsSettingsOpen}
          />
        </div>
      </div>

      <main className={cn(
        "transition-all duration-300 relative",
        isExpanded && segments.length > 0 ? "lg:ml-32" : ""
      )}>
        <Layout>{children}</Layout>
      </main>
    </div>
  );
};

export default Sidebar;
