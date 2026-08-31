import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const event = await prisma.events.findUnique({
      where: { id },
      include: { _count: { select: { event_registrations: true, event_leaderboard: true } } },
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ event });
  } catch (err) {
    console.error('[GET /api/admin/super/events/[id]] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.events.findUnique({ 
      where: { id }, 
      select: { id: true, status: true, title: true, submission_config: true } 
    });
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const body = await req.json();
    const {
      title, tagline, description, event_type, banner_url,
      prize_pool, max_participants, registration_open,
      tags_json, rules_json, timeline_json, faqs_json, sponsors_json,
      starts_at, ends_at, registration_deadline, status,
      participation_type, min_team_size, max_team_size,
      enter_event_url, rounds_json, prizes_json, eligibility, registration_fee,
      submission_config, private_access,
    } = body;

    const VALID_STATUSES = ['draft', 'published', 'ongoing', 'ended', 'archived'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (title !== undefined) updateData.title = title;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (description !== undefined) updateData.description = description;
    if (event_type !== undefined) updateData.event_type = event_type;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (prize_pool !== undefined) updateData.prize_pool = prize_pool;
    if (max_participants !== undefined) updateData.max_participants = max_participants ? Number(max_participants) : null;
    if (registration_open !== undefined) updateData.registration_open = registration_open;
    if (tags_json !== undefined) updateData.tags_json = tags_json;
    if (rules_json !== undefined) updateData.rules_json = rules_json;
    if (timeline_json !== undefined) updateData.timeline_json = timeline_json;
    if (faqs_json !== undefined) updateData.faqs_json = faqs_json;
    if (sponsors_json !== undefined) updateData.sponsors_json = sponsors_json;
    if (starts_at !== undefined) updateData.starts_at = starts_at ? new Date(starts_at) : null;
    if (ends_at !== undefined) updateData.ends_at = ends_at ? new Date(ends_at) : null;
    if (registration_deadline !== undefined) updateData.registration_deadline = registration_deadline ? new Date(registration_deadline) : null;
    if (status !== undefined) updateData.status = status;
    if (participation_type !== undefined) updateData.participation_type = participation_type;
    if (min_team_size !== undefined) updateData.min_team_size = min_team_size ? Number(min_team_size) : null;
    if (max_team_size !== undefined) updateData.max_team_size = max_team_size ? Number(max_team_size) : null;
    if (enter_event_url !== undefined) updateData.enter_event_url = enter_event_url || null;
    if (rounds_json !== undefined) updateData.rounds_json = rounds_json;
    if (prizes_json !== undefined) updateData.prizes_json = prizes_json;
    if (eligibility !== undefined) updateData.eligibility = eligibility;
    if (registration_fee !== undefined) updateData.registration_fee = registration_fee;

    // Handle submission_config merging
    let currentConfig = (submission_config || existing.submission_config || {}) as Record<string, unknown>;
    if (body.registration_fields_config !== undefined) {
      currentConfig = {
        ...currentConfig,
        registration_fields_config: body.registration_fields_config,
      };
    }
    if (private_access !== undefined) {
      currentConfig = {
        ...currentConfig,
        private_access: private_access,
      };
    }
    if (submission_config !== undefined || body.registration_fields_config !== undefined || private_access !== undefined) {
      updateData.submission_config = currentConfig;
    }

    if (body.start_now) {
      updateData.status = 'ongoing';
      updateData.starts_at = new Date();
    }
    if (body.auto_publish && existing.status === 'draft') {
      updateData.status = 'published';
    }
    if (status === 'ended' && registration_open === undefined) {
      updateData.registration_open = false;
    }

    const updated = await prisma.events.update({ where: { id }, data: updateData });

    return NextResponse.json({ event: updated });
  } catch (err) {
    console.error('[PATCH /api/admin/super/events/[id]] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.events.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    await prisma.events.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/super/events/[id]] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
