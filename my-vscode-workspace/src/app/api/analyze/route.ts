import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';

// Configure upload limits
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '100') * 1024 * 1024; // Default 100MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Helper to handle file upload with proper chunks
async function saveFormFile(req: NextRequest): Promise<{ filepath: string; originalFilename: string; mimetype: string } | null> {
  if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
    throw new Error('Not a multipart form data request');
  }

  const formData = await req.formData();
  const file = formData.get('video') as File;
  
  if (!file) {
    return null;
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate a temporary filename
  const tempFilename = `${crypto.randomUUID()}${path.extname(file.name)}`;
  const filepath = path.join(process.cwd(), 'uploads', tempFilename);

  await fs.writeFile(filepath, buffer);

  return {
    filepath,
    originalFilename: file.name,
    mimetype: file.type
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/analyze - Starting upload handling');
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Handle the file upload
    console.log('Parsing form data...');
    const videoFile = await saveFormFile(request);

    if (!videoFile) {
      console.warn('No video file provided in form data');
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    console.log('File received:', videoFile.originalFilename, 'MIME:', videoFile.mimetype);

    // Validate file type by extension, MIME type, or both
    const filename = videoFile.originalFilename.toLowerCase();
    const ext = path.extname(filename);
    const isValidExtension = ['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext);
    const isValidMime = ALLOWED_TYPES.includes(videoFile.mimetype) || videoFile.mimetype === 'application/octet-stream';
    
    if (!isValidExtension && !isValidMime) {
      await fs.unlink(videoFile.filepath); // Clean up invalid file
      console.warn('Invalid file type:', videoFile.mimetype, 'extension:', ext);
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: MP4, MOV, WebM, MKV, AVI' },
        { status: 400 }
      );
    }

    // Generate a unique ID for this analysis job
    const jobId = crypto.randomUUID();
    console.log('Created job:', jobId);
    
    // Create job directory
    const jobDir = path.join(uploadsDir, jobId);
    await fs.mkdir(jobDir, { recursive: true });
    
    // Move the file to the job directory
    const finalPath = path.join(jobDir, `original${path.extname(videoFile.originalFilename)}`);
    await fs.rename(videoFile.filepath, finalPath);
    console.log('File moved to:', finalPath);

    // Persist initial job metadata so status can be read even if the in-memory queue
    // hasn't been observed by another request yet.
    const initialJob = {
      jobId,
      status: 'queued',
      progress: 0,
      timestamp: new Date().toISOString(),
      videoUrl: finalPath
    };
    await fs.writeFile(path.join(jobDir, 'job.json'), JSON.stringify(initialJob, null, 2), 'utf8');
    console.log('Job metadata saved');

    // Queue the processing job
    console.log('Importing ProcessingQueue...');
    const { processingQueue } = await import('@/services/ProcessingQueue');
    console.log('Adding job to queue...');
    processingQueue.addJob(jobId);
    console.log('Job added successfully');

    const response = {
      status: 'processing',
      jobId,
      message: 'Video received and queued for analysis',
      estimatedTime: '2-3 minutes'
    };
    
    console.log('Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing video upload:', error);
    const message = error instanceof Error ? error.message : 'Failed to process video upload';
    console.error('Error details:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}