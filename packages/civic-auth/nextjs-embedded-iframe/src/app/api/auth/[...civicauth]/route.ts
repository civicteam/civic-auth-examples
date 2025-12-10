import { handler } from "@civic/auth/nextjs";

// Simple passthrough to the civic auth handler
// Fake session is now handled in the success route
export const GET = handler();
export const POST = handler();
