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
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const PAGE_SIZE = 30;

  try {
    const where: NonNullable<Parameters<typeof prisma.event_registrations.findMany>[0]>['where'] = {
      event_id: id,
    };
    if (status) where.status = status;
    if (search) {
      where.users = {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [registrations, total] = await Promise.all([
      prisma.event_registrations.findMany({
        where,
        include: {
          users: { select: { id: true, username: true, email: true, avatar_url: true, xp_total: true, level: true } },
        },
        orderBy: { registered_at: 'asc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.event_registrations.count({ where }),
    ]);

    return NextResponse.json({ registrations, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) });
  } catch (err) {
    console.error('[GET /api/admin/super/events/[id]/registrations] Error:', err);
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
  const body = await req.json();
  const { registrationId, status } = body as { registrationId?: string; status?: string };

  if (!registrationId || !status) {
    return NextResponse.json({ error: 'registrationId and status are required' }, { status: 400 });
  }

  const VALID = ['registered', 'disqualified', 'withdrawn'];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const reg = await prisma.event_registrations.findFirst({
      where: { id: registrationId, event_id: id },
    });
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const updated = await prisma.event_registrations.update({
      where: { id: registrationId },
      data: { status },
    });

    return NextResponse.json({ registration: updated });
  } catch (err) {
    console.error('[PATCH /api/admin/super/events/[id]/registrations] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
