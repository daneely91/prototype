import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-dev',
});

export async function POST(request: NextRequest) {
  try {
    const { message, jobId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize Claude with gameplay analysis context
    const systemPrompt = `You are an expert gameplay analysis AI assistant. You provide detailed, constructive feedback on gameplay videos.
Your feedback should:
- Be specific and actionable
- Reference concrete examples from the gameplay
- Suggest practical improvements
- Stay positive and encouraging

If analyzing a specific video segment:
- Note the timestamp
- Describe what happened
- Explain why it's significant
- Suggest how to improve

Keep responses focused on gameplay improvement.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${systemPrompt}\n\nUser message: ${message}${jobId ? `\nRegarding analysis job: ${jobId}` : ''}`
      }]
    });

    return NextResponse.json({
      content: response.content[0].type === 'text' ? response.content[0].text : 'Unable to process response',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}