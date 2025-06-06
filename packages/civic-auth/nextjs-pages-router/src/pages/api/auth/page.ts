import { handler as civicHandler } from '@civic/auth/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';

async function bufferToBody(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Reconstruct the full URL
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const url = `${protocol}://${host}${req.url}`;

  // Read and buffer the request body
  const body = await bufferToBody(req);

  // Create a new NextRequest from the buffered body and init options
  const nextRequest = new NextRequest(url, {
    method: req.method,
    headers: new Headers(req.headers as any),
    body: body.length > 0 ? body : undefined,
  });

  // Call the App Router-style handler
  const response = await civicHandler()(nextRequest);

  // Convert Response back to Node response
  const responseBody = await response.text();
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(responseBody);
}