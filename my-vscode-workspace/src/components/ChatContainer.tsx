'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/analysis';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (content: string) => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const { content: aiContent, timestamp } = await response.json();
      
      const aiResponse: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const uploadResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { jobId } = await uploadResponse.json();

      // Add upload message
      const uploadMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded video: ${file.name}`,
        timestamp: new Date().toISOString(),
        attachments: [{
          type: 'video',
          url: URL.createObjectURL(file)
        }]
      };

      setMessages(prev => [...prev, uploadMessage]);

      // Add AI acknowledgment
      const aiResponse: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'ve received your video and I\'m starting the analysis. This may take a few minutes...',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Start polling for results
      // TODO: Implement polling and update messages with analysis results

    } catch (error) {
      console.error('Error uploading video:', error);
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, there was an error uploading your video. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <ChatInput
        onSend={handleSend}
        onUpload={handleUpload}
        isLoading={isLoading}
      />
    </div>
  );
}