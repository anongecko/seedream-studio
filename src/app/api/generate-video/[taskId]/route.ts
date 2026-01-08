/**
 * Video task status API proxy route
 * GET /api/generate-video/[taskId] - Get video generation task status
 *
 * This is a Next.js API route that proxies polling requests to the Seedance API
 */

import { NextRequest, NextResponse } from 'next/server';
import type { VideoTaskResponse, VideoError } from '@/types/video-api';

const SEEDANCE_API_URL = process.env.NEXT_PUBLIC_SEEDREAM_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_api_key',
            message: 'API key is required in Authorization header',
            type: 'authentication_error',
          },
        } as VideoError,
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate task ID
    if (!taskId || taskId.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_request',
            message: 'Task ID is required',
            type: 'invalid_request_error',
          },
        } as VideoError,
        { status: 400 }
      );
    }

    // Forward request to Seedance API
    const response = await fetch(`${SEEDANCE_API_URL}/contents/generations/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
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
    const data: VideoTaskResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Video task status error:', error);

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
export const maxDuration = 10; // 10 seconds max for status check
