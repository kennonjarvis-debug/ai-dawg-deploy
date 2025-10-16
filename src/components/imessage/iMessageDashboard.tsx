import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Settings } from 'lucide-react';

interface Conversation {
  chatId: number;
  chatGuid: string;
  identifier: string;
  displayName: string | null;
  serviceName: string;
  messageCount: number;
  lastMessageDate: string | null;
  lastMessageText: string | null;
  lastMessageIsFromMe: boolean;
}

interface Message {
  id: number;
  guid: string;
  text: string | null;
  handle: string;
  handleId: number;
  date: string;
  isFromMe: boolean;
  service: string;
  chatId?: number;
  chatGuid?: string;
}

export function IMessageDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      // Poll for new messages in selected chat every 2 seconds
      const interval = setInterval(() => fetchMessages(selectedChat), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/v1/imessage/conversations');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/v1/imessage/conversations/${chatId}/messages?limit=200`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getContactDisplay = (conv: Conversation) => {
    if (conv.displayName) return conv.displayName;
    if (conv.identifier) return conv.identifier;
    return 'Unknown';
  };

  const filteredConversations = conversations.filter(conv =>
    getContactDisplay(conv).toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessageText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(c => c.chatId === selectedChat);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <Settings className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-16 h-16 mb-2" />
              <p>No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.chatId}
                onClick={() => setSelectedChat(conv.chatId)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat === conv.chatId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getContactDisplay(conv)}
                      </h3>
                      {conv.lastMessageDate && (
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(conv.lastMessageDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessageIsFromMe && 'You: '}
                      {conv.lastMessageText || 'No messages'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {conv.serviceName} • {conv.messageCount} messages
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedConversation && getContactDisplay(selectedConversation)}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedConversation?.serviceName}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-xs lg:max-w-md">
                    {!msg.isFromMe && (
                      <span className="text-xs text-gray-500 mb-1 px-3">
                        {msg.handle}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.isFromMe
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text || '(no text)'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 px-3">
                      {new Date(msg.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Placeholder */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-100 rounded-full px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
                Sending messages not available (read-only)
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Monitoring Active</span>
      </div>
    </div>
  );
}
