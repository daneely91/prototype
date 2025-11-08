import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // `params` may be a Promise in some Next.js runtimes — unwrap if needed
    let jobId: string | undefined = (params as any).jobId;
    if (!jobId && typeof (params as any)?.then === 'function') {
      const unwrapped = await (params as any);
      jobId = unwrapped?.jobId;
    }

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job status from the in-memory queue if available. If not, fall back to disk-backed job.json
    const { processingQueue } = await import('@/services/ProcessingQueue');
    let job = processingQueue.getJob(jobId);

    if (!job) {
      // Try to read persisted job file under uploads/<jobId>/job.json
      try {
        const jobFile = path.join(process.cwd(), 'uploads', jobId, 'job.json');
        const raw = await fs.readFile(jobFile, 'utf8');
        const parsed = JSON.parse(raw);
        // Map persisted shape to the same response shape
        return NextResponse.json({
          status: parsed.status || 'queued',
          jobId,
          progress: parsed.progress ?? 0,
          message: parsed.status === 'failed'
            ? `Analysis failed: ${parsed.error || 'unknown'}`
            : parsed.status === 'completed'
            ? 'Analysis complete'
            : 'Processing gameplay footage...',
          result: parsed.result,
          frames: parsed.frames
        });
      } catch (err) {
        return NextResponse.json(
          { error: 'Analysis job not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      status: job.status,
      jobId,
      progress: job.progress,
      message: job.status === 'failed' 
        ? `Analysis failed: ${job.error}`
        : job.status === 'completed'
        ? 'Analysis complete'
        : 'Processing gameplay footage...',
      result: job.result,
      frames: job.frames
    });

  } catch (error) {
    console.error('Error checking analysis status:', error);
    return NextResponse.json(
      { error: 'Failed to check analysis status' },
      { status: 500 }
    );
  }
}