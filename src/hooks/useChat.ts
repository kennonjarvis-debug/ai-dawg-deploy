/**
 * useChat Hook
 * Manages conversation state, message sending, and history loading
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useChatStreaming } from './useWebSocket';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  intent?: string;
  entities?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messages?: ChatMessage[];
}

interface UseChatOptions {
  conversationId?: string | null;
  autoLoadHistory?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { conversationId: initialConversationId = null, autoLoadHistory = true } = options;

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket streaming
  const { streamingMessage, streamingMessageId, isStreaming } = useChatStreaming(conversationId);

  /**
   * Load conversation history
   */
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await apiClient.getConversation(convId);
      setConversationId(convId);
      setMessages(conversation.messages || []);
    } catch (err: any) {
      console.error('[useChat] Failed to load conversation:', err);
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load list of conversations
   */
  const loadConversations = useCallback(async (params?: { limit?: number; offset?: number }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getConversations(params);
      setConversations(response.conversations);
    } catch (err: any) {
      console.error('[useChat] Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(async (params?: { title?: string; projectId?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await apiClient.createConversation(params);
      setConversationId(conversation.id);
      setMessages([]);
      return conversation;
    } catch (err: any) {
      console.error('[useChat] Failed to create conversation:', err);
      setError(err.message || 'Failed to create conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      console.warn('[useChat] Cannot send empty message');
      return null;
    }

    setIsSending(true);
    setError(null);

    // Add user message immediately for optimistic UI
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // If no conversation exists, create one
      let currentConvId = conversationId;
      if (!currentConvId) {
        const newConv = await createConversation();
        if (!newConv) {
          throw new Error('Failed to create conversation');
        }
        currentConvId = newConv.id;
      }

      // Send message (streaming response comes via WebSocket)
      const response = await apiClient.sendMessage(currentConvId!, content);

      // Update user message with real ID from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, id: response.messageId || msg.id }
            : msg
        )
      );

      return response;
    } catch (err: any) {
      console.error('[useChat] Failed to send message:', err);
      setError(err.message || 'Failed to send message');

      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));

      return null;
    } finally {
      setIsSending(false);
    }
  }, [conversationId, createConversation]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.deleteConversation(convId);

      // If the deleted conversation was active, clear it
      if (convId === conversationId) {
        setConversationId(null);
        setMessages([]);
      }

      // Remove from conversations list
      setConversations((prev) => prev.filter((conv) => conv.id !== convId));
    } catch (err: any) {
      console.error('[useChat] Failed to delete conversation:', err);
      setError(err.message || 'Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /**
   * Regenerate last assistant message
   */
  const regenerateMessage = useCallback(async (messageId?: string) => {
    if (!conversationId) {
      console.warn('[useChat] No active conversation');
      return null;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await apiClient.regenerateMessage(conversationId, messageId);
      return response;
    } catch (err: any) {
      console.error('[useChat] Failed to regenerate message:', err);
      setError(err.message || 'Failed to regenerate message');
      return null;
    } finally {
      setIsSending(false);
    }
  }, [conversationId]);

  /**
   * Clear current conversation
   */
  const clearConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
  }, []);

  // Auto-load conversation history when conversationId changes
  useEffect(() => {
    if (conversationId && autoLoadHistory) {
      loadConversation(conversationId);
    }
  }, [conversationId, autoLoadHistory, loadConversation]);

  // Add streaming message to messages list
  useEffect(() => {
    if (isStreaming && streamingMessage && streamingMessageId) {
      setMessages((prev) => {
        // Check if streaming message already exists
        const existingIndex = prev.findIndex((msg) => msg.id === streamingMessageId);

        if (existingIndex >= 0) {
          // Update existing streaming message
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            content: streamingMessage,
          };
          return updated;
        } else {
          // Add new streaming message
          return [
            ...prev,
            {
              id: streamingMessageId,
              role: 'assistant',
              content: streamingMessage,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      });
    }
  }, [isStreaming, streamingMessage, streamingMessageId]);

  return {
    // State
    conversationId,
    messages,
    conversations,
    isLoading,
    isSending,
    isStreaming,
    error,

    // Actions
    sendMessage,
    loadConversation,
    loadConversations,
    createConversation,
    deleteConversation,
    regenerateMessage,
    clearConversation,
    setConversationId,
  };
}
