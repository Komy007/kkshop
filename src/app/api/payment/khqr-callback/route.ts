// KHQR Payment Callback — will be connected when KHQR is live

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('[KHQR Callback] Received payload:', JSON.stringify(body, null, 2));
    } catch {
        console.log('[KHQR Callback] Received request with no/invalid JSON body');
    }

    return NextResponse.json({
        received: true,
        message: 'KHQR callback endpoint ready. Integration pending.',
    });
}
