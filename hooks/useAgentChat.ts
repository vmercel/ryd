import { useState, useCallback } from 'react';
import { streamChat } from '../services/chatService';
import { buildSystemPrompt } from '../services/agentService';
import { ChatMessage } from '../types';

export const useAgentChat = (userProfile?: any, tripContext?: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: Math.random().toString(36),
        user_id: 'current_user',
        role: 'user',
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);
      setCurrentResponse('');

      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36),
        user_id: 'current_user',
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      const systemPrompt = buildSystemPrompt(userProfile, tripContext);
      const conversationMessages = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));
      conversationMessages.push({ role: 'user', content });

      await streamChat({
        messages: conversationMessages,
        systemPrompt,
        onChunk: (chunk) => {
          setCurrentResponse(prev => {
            const newText = prev + chunk;
            setMessages(msgs => {
              const updated = [...msgs];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: newText,
              };
              return updated;
            });
            return newText;
          });
        },
        onComplete: () => {
          setIsStreaming(false);
          setCurrentResponse('');
        },
        onError: (error) => {
          setIsStreaming(false);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: `Error: ${error}`,
            };
            return updated;
          });
        },
      });
    },
    [messages, isStreaming, userProfile, tripContext]
  );

  return {
    messages,
    isStreaming,
    sendMessage,
  };
};
