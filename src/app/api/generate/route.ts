import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, ...seedreamRequest } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: 'API key is required' } },
        { status: 401 }
      );
    }

    // Make request to Seedream API from server-side (no CORS issues)
    const response = await fetch(
      'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(seedreamRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
