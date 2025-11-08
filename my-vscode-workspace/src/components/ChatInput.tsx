import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/analysis';

interface ChatInputProps {
  onSend: (message: string) => void;
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function ChatInput({ onSend, onUpload, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  }, [message, onSend]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2 items-end">
      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
        className="hidden"
        id="video-upload"
      />
      <label
        htmlFor="video-upload"
        className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600"
      >
        Upload Video
      </label>
      <div className="flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your gameplay or request analysis..."
          className="w-full p-2 border rounded"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !message.trim()}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}