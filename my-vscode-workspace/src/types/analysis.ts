export interface AnalysisJob {
  jobId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  videoUrl?: string;
  timestamp?: string;
}

export interface GameplayFeedback {
  timestamp: string;
  observation: string;
  evidence?: {
    frameUrl?: string;
    timeIndex: number;
  };
  suggestion: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: {
    type: 'video' | 'frame' | 'feedback';
    url?: string;
    feedback?: GameplayFeedback[];
  }[];
}