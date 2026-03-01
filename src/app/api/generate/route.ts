import https from 'node:https';
import { NextRequest } from 'next/server';

// Allow up to 15 minutes for large batch generations
export const maxDuration = 900;

// Persistent HTTPS agent with TCP keepalive enabled.
// This prevents idle connections from being dropped by intermediate
// network devices (firewalls, NATs, load balancers) during the
// minutes-long Seedream generation process.
const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 15_000, // TCP keepalive probe every 15 seconds
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, ...seedreamRequest } = body;

    if (!apiKey) {
      return Response.json(
        { error: { message: 'API key is required' } },
        { status: 401 }
      );
    }

    const apiUrl = new URL(
      process.env.NEXT_PUBLIC_SEEDREAM_API_URL
        ? `${process.env.NEXT_PUBLIC_SEEDREAM_API_URL}/images/generations`
        : 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations'
    );

    const requestBody = JSON.stringify(seedreamRequest);

    // Use Node.js https module directly instead of fetch/undici.
    // This gives us full control over TCP keepalive and socket timeouts,
    // which undici's fetch() does not expose (its hardcoded headersTimeout
    // of 5 minutes kills long-running batch generation requests).
    const result = await new Promise<Response>((resolve) => {
      const req = https.request(
        {
          hostname: apiUrl.hostname,
          port: 443,
          path: apiUrl.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(requestBody),
          },
          agent,
        },
        (res) => {
          // Stream the response through to the client without buffering
          const stream = new ReadableStream({
            start(controller) {
              res.on('data', (chunk: Buffer) => {
                controller.enqueue(new Uint8Array(chunk));
              });
              res.on('end', () => {
                controller.close();
              });
              res.on('error', (err) => {
                controller.error(err);
              });
            },
          });

          resolve(
            new Response(stream, {
              status: res.statusCode ?? 500,
              headers: {
                'Content-Type':
                  res.headers['content-type'] || 'application/json',
              },
            })
          );
        }
      );

      req.on('error', (err) => {
        console.error('API route request error:', err.message);
        resolve(
          Response.json(
            { error: { message: err.message } },
            { status: 500 }
          )
        );
      });

      // Once the socket connects, enable keepalive and remove idle timeout.
      // This is critical: without this, the OS or Node.js may consider the
      // socket idle during the generation wait and close it (ECONNRESET).
      req.on('socket', (socket) => {
        socket.setKeepAlive(true, 15_000);
        socket.setTimeout(0);
      });

      req.write(requestBody);
      req.end();
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    console.error('API route error:', message);
    return Response.json({ error: { message } }, { status: 500 });
  }
}
