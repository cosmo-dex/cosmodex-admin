import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now().toString(36);
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const PAGE_SIZE = 20;

  const where: NonNullable<Parameters<typeof prisma.events.findMany>[0]>['where'] = {};
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  try {
    const [eventsData, total] = await Promise.all([
      prisma.events.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          tagline: true,
          event_type: true,
          status: true,
          registration_open: true,
          max_participants: true,
          prize_pool: true,
          starts_at: true,
          ends_at: true,
          registration_deadline: true,
          submission_config: true,
          created_at: true,
          updated_at: true,
          _count: { select: { event_registrations: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.events.count({ where }),
    ]);

    return NextResponse.json({
      events: eventsData,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error('[GET /api/admin/super/events] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const {
      title,
      tagline,
      description,
      event_type,
      banner_url,
      prize_pool,
      max_participants,
      registration_open,
      tags_json,
      rules_json,
      timeline_json,
      faqs_json,
      sponsors_json,
      starts_at,
      ends_at,
      registration_deadline,
      participation_type,
      min_team_size,
      max_team_size,
      enter_event_url,
      rounds_json,
      prizes_json,
      eligibility,
      registration_fee,
      submission_config,
      private_access,
    } = body;

    if (!title || !event_type) {
      return NextResponse.json({ error: 'title and event_type are required' }, { status: 400 });
    }

    const slug = generateSlug(title);

    const mergedSubmissionConfig = {
      ...(submission_config ?? { mode: 'platform', required_fields: ['submission_url', 'demo_url', 'video_url', 'tech_stack', 'description'] }),
      registration_fields_config: body.registration_fields_config ?? null,
      private_access: private_access ?? submission_config?.private_access ?? null,
    };

    const event = await prisma.events.create({
      data: {
        created_by: auth.user.userId,
        title,
        slug,
        tagline: tagline ?? null,
        description: description ?? null,
        event_type,
        banner_url: banner_url ?? null,
        prize_pool: prize_pool ?? null,
        max_participants: max_participants ? Number(max_participants) : null,
        registration_open: registration_open ?? false,
        tags_json: tags_json ?? [],
        rules_json: rules_json ?? [],
        timeline_json: timeline_json ?? [],
        faqs_json: faqs_json ?? [],
        sponsors_json: sponsors_json ?? [],
        starts_at: starts_at ? new Date(starts_at) : null,
        ends_at: ends_at ? new Date(ends_at) : null,
        registration_deadline: registration_deadline ? new Date(registration_deadline) : null,
        status: 'draft',
        participation_type: participation_type ?? 'individual',
        min_team_size: min_team_size ? Number(min_team_size) : 1,
        max_team_size: max_team_size ? Number(max_team_size) : 4,
        enter_event_url: enter_event_url ?? null,
        rounds_json: rounds_json ?? [],
        prizes_json: prizes_json ?? [],
        eligibility: eligibility ?? 'Open to All',
        registration_fee: registration_fee ?? 'Free',
        submission_config: mergedSubmissionConfig,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/super/events] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
