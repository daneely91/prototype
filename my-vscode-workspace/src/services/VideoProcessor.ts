import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export interface VideoMetadata {
  duration: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
}

export interface ProcessingOptions {
  frameInterval?: number; // Seconds between extracted frames
  maxFrames?: number; // Maximum number of frames to extract
  sampleDuration?: number; // Duration of sample clips in seconds
}

export class VideoProcessor {
  private uploadsDir: string;
  private defaultOptions: ProcessingOptions = {
    frameInterval: 5,
    maxFrames: 20,
    sampleDuration: 10
  };

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
  }

  async getMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) return reject(new Error('No video stream found'));

        // Parse r_frame_rate which often comes as '30000/1001' or '30/1'
        const rFrame = videoStream.r_frame_rate || '30/1';
        let fps = 30;
        try {
          const parts = String(rFrame).split('/').map(Number);
          if (parts.length === 2 && parts[1] !== 0) fps = parts[0] / parts[1];
          else if (!Number.isNaN(parts[0])) fps = parts[0];
        } catch (e) {
          // fallback to 30
        }

        resolve({
          duration: metadata.format.duration || 0,
          fps,
          resolution: {
            width: (videoStream.width as number) || 0,
            height: (videoStream.height as number) || 0
          }
        });
      });
    });
  }

  async extractFrames(
    jobId: string,
    options: ProcessingOptions = {}
  ): Promise<string[]> {
    const opts = { ...this.defaultOptions, ...options };
    const videoPath = await this.findVideoFile(jobId);
    const metadata = await this.getMetadata(videoPath);
    
    // Create frames directory
    const framesDir = path.join(this.uploadsDir, jobId, 'frames');
    await fs.mkdir(framesDir, { recursive: true });

    // Calculate frame extraction points
    const framePoints = this.calculateFramePoints(metadata.duration, opts);

    // Extract frames
    const framePromises = framePoints.map((timestamp) =>
      this.extractFrame(videoPath, timestamp, framesDir)
    );

    await Promise.all(framePromises);

    // Return paths to extracted frames
    const files = await fs.readdir(framesDir);
    return files
      .filter(f => f.endsWith('.jpg'))
      .map(f => path.join(framesDir, f));
  }

  async generateSampleClip(
    jobId: string,
    startTime: number,
    options: ProcessingOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const videoPath = await this.findVideoFile(jobId);
    
    // Create samples directory
    const samplesDir = path.join(this.uploadsDir, jobId, 'samples');
    await fs.mkdir(samplesDir, { recursive: true });

  const outputPath = path.join(samplesDir, `sample-${startTime}.mp4`);

    return new Promise((resolve, reject) => {
      // Ensure a defined duration (ffmpeg expects string|number)
      const duration = opts.sampleDuration ?? this.defaultOptions.sampleDuration!;

      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async findVideoFile(jobId: string): Promise<string> {
    // Look inside the job directory for the original video file
    const jobDir = path.join(this.uploadsDir, jobId);
    try {
      const files = await fs.readdir(jobDir);
      // Prefer files named starting with 'original', otherwise any common video extension
      const videoFile = files.find((f) => f.startsWith('original'))
        || files.find((f) => /\.(mp4|mov|webm|mkv|avi)$/i.test(f));

      if (!videoFile) {
        throw new Error(`No video file found in job directory for job ${jobId}`);
      }

      return path.join(jobDir, videoFile);
    } catch (e) {
      throw new Error(`No video file found for job ${jobId}`);
    }
  }

  private calculateFramePoints(duration: number, options: ProcessingOptions): number[] {
    const points: number[] = [];
    const interval = options.frameInterval || this.defaultOptions.frameInterval!;
    const maxFrames = options.maxFrames || this.defaultOptions.maxFrames!;

    for (let time = 0; time < duration && points.length < maxFrames; time += interval) {
      points.push(time);
    }

    return points;
  }

  private extractFrame(videoPath: string, timestamp: number, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, `frame-${timestamp}.jpg`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: `frame-${timestamp}.jpg`,
          folder: outputDir,
          size: '1280x720'
        })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }
}