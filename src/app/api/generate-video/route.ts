/**
 * Video generation API proxy route
 * POST /api/generate-video - Create video generation task
 *
 * This is a Next.js API route that proxies requests to the Seedance API
 * to avoid exposing API keys in the client
 */

import { NextRequest, NextResponse } from 'next/server';
import type { VideoGenerationRequest, VideoGenerationResponse, VideoError } from '@/types/video-api';

const SEEDANCE_API_URL = process.env.NEXT_PUBLIC_SEEDREAM_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { apiKey, ...videoRequest } = body as VideoGenerationRequest & { apiKey: string };

    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_api_key',
            message: 'API key is required',
            type: 'authentication_error',
          },
        } as VideoError,
        { status: 401 }
      );
    }

    // Validate request
    if (!videoRequest.model || !videoRequest.content || videoRequest.content.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_request',
            message: 'Model and content are required',
            type: 'invalid_request_error',
          },
        } as VideoError,
        { status: 400 }
      );
    }

    // Forward request to Seedance API
    const response = await fetch(`${SEEDANCE_API_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(videoRequest),
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: 'api_error',
          message: `API request failed with status ${response.status}`,
          type: 'api_error',
        },
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    // Return successful response
    const data: VideoGenerationResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Video generation error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: error instanceof Error ? error.message : 'Internal server error',
          type: 'internal_error',
        },
      } as VideoError,
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 30; // 30 seconds max for task creation
