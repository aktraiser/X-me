'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import { File, Message } from './ChatWindow';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';

const Chat = ({
  loading,
  messages,
  sendMessage,
  messageAppeared,
  rewrite,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  messages: Message[];
  sendMessage: (message: string) => void;
  loading: boolean;
  messageAppeared: boolean;
  rewrite: (messageId: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const [dividerWidth, setDividerWidth] = useState(0);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateDividerWidth = () => {
      if (dividerRef.current) {
        setDividerWidth(dividerRef.current.scrollWidth);
      }
    };

    updateDividerWidth();

    window.addEventListener('resize', updateDividerWidth);

    return () => {
      window.removeEventListener('resize', updateDividerWidth);
    };
  });

  useEffect(() => {
    if (messages.length === 1) {
      document.title = `${messages[0].content.substring(0, 30)} - X-me`;
    }
  }, [messages]);

  return (
    <div className="max-w-[1200px] w-full mx-auto px-4">
      <div className="flex flex-col space-y-0 mb-32">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const hasContext = msg.sources && msg.sources.length > 0;

          return (
            <Fragment key={msg.messageId}>
              <MessageBox
                key={i}
                message={msg}
                messageIndex={i}
                history={messages}
                loading={loading}
                dividerRef={isLast ? dividerRef : undefined}
                isLast={isLast}
                rewrite={rewrite}
                sendMessage={sendMessage}
              />
              {!isLast && msg.role === 'assistant' && (
                <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary mt-4" />
              )}
            </Fragment>
          );
        })}
        {loading && !messageAppeared && <MessageBoxLoading />}
        <div ref={messageEnd} />
        {dividerWidth > 0 && (
          <div
            className="fixed z-40 bottom-24 lg:bottom-10 w-full left-0 lg:left-auto lg:w-[calc(66.5%-2rem)] px-4 lg:px-0"
            style={{ 
              maxWidth: '900px',
              margin: '0 auto',
              right: messages.length > 0 ? 'auto' : '0'
            }}
          >
            <MessageInput
              loading={loading}
              sendMessage={sendMessage}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
