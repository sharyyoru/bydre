import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendLeadToGoogleSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

// Create admin client for public lead capture
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const record = rateLimitMap.get(ip);
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.full_name || body.full_name.length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!body.email || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!body.phone || body.phone.length < 8) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    // Insert lead into database
    const { data, error } = await supabaseAdmin
      .from('public_leads')
      .insert({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        country: body.country || 'Not specified',
        interest: body.interest || null,
        lead_source: body.lead_source || 'website',
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save lead. Please try again.' },
        { status: 500 }
      );
    }

    let googleSheetSynced = false;
    try {
      googleSheetSynced = await appendLeadToGoogleSheet({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        interest: data.interest,
      });
    } catch {
      console.error('Google Sheets delivery failed for saved lead:', data.id);
      return NextResponse.json(
        { error: 'Your inquiry was saved, but delivery to our sales sheet could not be confirmed. Please contact our team directly.', id: data.id },
        { status: 502 }
      );
    }
    if (!googleSheetSynced) console.warn('Google Sheets is not configured; lead saved to Supabase only:', data.id);

    return NextResponse.json({ success: true, id: data.id, google_sheet_synced: googleSheetSynced }, { status: 201 });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
