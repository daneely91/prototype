import type { ChatMessage as ChatMessageType } from '@/types/analysis';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === 'assistant';

  return (
    <div className={`flex gap-4 p-4 ${isAI ? 'bg-gray-50' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isAI ? 'bg-blue-500' : 'bg-gray-300'} flex items-center justify-center text-white`}>
        {isAI ? 'AI' : 'U'}
      </div>
      <div className="flex-1">
        <div className="font-medium">
          {isAI ? 'AI Assistant' : 'You'}
          <span className="ml-2 text-sm text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="mt-1 text-gray-700">{message.content}</div>
        
        {message.attachments?.map((attachment, i) => (
          <div key={i} className="mt-4">
            {attachment.type === 'video' && attachment.url && (
              <video
                src={attachment.url}
                controls
                className="max-w-xl rounded"
              />
            )}
            {attachment.type === 'frame' && attachment.url && (
              <img
                src={attachment.url}
                alt="Gameplay frame"
                className="max-w-xl rounded"
              />
            )}
            {attachment.type === 'feedback' && attachment.feedback && (
              <div className="mt-2 space-y-4">
                {attachment.feedback.map((fb, j) => (
                  <div key={j} className="bg-white p-4 rounded border">
                    <div className="text-sm text-gray-500">
                      {fb.timestamp}
                    </div>
                    <div className="mt-2">
                      <strong>Observation:</strong> {fb.observation}
                    </div>
                    {fb.evidence?.frameUrl && (
                      <img
                        src={fb.evidence.frameUrl}
                        alt={`Evidence at ${fb.evidence.timeIndex}s`}
                        className="mt-2 max-w-md rounded"
                      />
                    )}
                    <div className="mt-2 text-blue-600">
                      <strong>Suggestion:</strong> {fb.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}