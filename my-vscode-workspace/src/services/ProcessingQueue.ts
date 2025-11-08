import { VideoProcessor } from './VideoProcessor';
import { promises as fs } from 'fs';
import path from 'path';
import type { AnalysisResult } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';

interface ProcessingJob {
  jobId: string;
  status: 'queued' | 'processing' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  frames?: string[];
  error?: string;
  metadata?: {
    duration: number;
    fps: number;
    resolution: {
      width: number;
      height: number;
    };
  };
  result?: AnalysisResult & {
    sampleClips?: string[];
  };
}

class ProcessingQueue {
  private jobs: Map<string, ProcessingJob>;
  private videoProcessor: VideoProcessor;
  private aiProvider: GeminiProvider;
  private processing: boolean;

  constructor() {
    this.jobs = new Map();
    this.videoProcessor = new VideoProcessor();
    this.aiProvider = new GeminiProvider();
    this.processing = false;
  }

  addJob(jobId: string) {
    this.jobs.set(jobId, {
      jobId,
      status: 'queued',
      progress: 0
    });

    // Persist initial job state to disk so status is discoverable even if the in-memory
    // queue isn't available for another request (dev servers / reloads).
    const job = this.jobs.get(jobId)!;
    this.persistJob(job).catch(console.error);

    this.processNextJob();
  }

  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  private async processNextJob() {
    if (this.processing) return;

    const pendingJob = Array.from(this.jobs.values()).find(
      job => job.status === 'queued'
    );

    if (!pendingJob) return;

    this.processing = true;
    const job = pendingJob;
    job.status = 'processing';
  await this.persistJob(job).catch(console.error);

    try {
      // Extract metadata and frames
      job.progress = 10;
      const videoPath = await this.videoProcessor.findVideoFile(job.jobId);
      const metadata = await this.videoProcessor.getMetadata(videoPath);
      job.metadata = metadata;
  await this.persistJob(job).catch(console.error);
      
      job.progress = 20;
      const frames = await this.videoProcessor.extractFrames(job.jobId);
      job.frames = frames;
      job.progress = 40;
  await this.persistJob(job).catch(console.error);

      // AI Analysis
      job.status = 'analyzing';
      job.progress = 50;
      const analysis = await this.aiProvider.analyzeGameplay(frames, metadata);
      job.progress = 70;
  await this.persistJob(job).catch(console.error);

      // Generate sample clips for key moments
      const sampleClips: string[] = [];
      for (const obs of analysis.observations) {
        if (obs.confidence > 0.8) { // Only create clips for high-confidence observations
          try {
            const clip = await this.videoProcessor.generateSampleClip(job.jobId, obs.timestamp);
            sampleClips.push(clip);
          } catch (error) {
            console.error('Error generating sample clip:', error);
          }
        }
      }
      job.progress = 90;

  await this.persistJob(job).catch(console.error);

      // Store complete results
      job.result = {
        ...analysis,
        sampleClips
      };

      job.status = 'completed';
      job.progress = 100;
  await this.persistJob(job).catch(console.error);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.persistJob(job).catch(console.error);
    } finally {
      this.processing = false;
      this.processNextJob();
    }
  }

  private async persistJob(job: ProcessingJob) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const jobDir = path.join(uploadsDir, job.jobId);
      await fs.mkdir(jobDir, { recursive: true });
      const jobFile = path.join(jobDir, 'job.json');
      // Write a trimmed object (avoid functions)
      await fs.writeFile(jobFile, JSON.stringify(job, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist job to disk:', err);
    }
  }
}

// Export singleton instance
export const processingQueue = new ProcessingQueue();