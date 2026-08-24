import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const status = searchParams.get('status')?.trim() ?? '';

  const where: NonNullable<Parameters<typeof prisma.battle_matches.findMany>[0]>['where'] = {};
  if (status) where.status = status;

  try {
    const [matches, total] = await Promise.all([
      prisma.battle_matches.findMany({
        where,
        include: {
          player1: { select: { username: true, email: true } },
          player2: { select: { username: true, email: true } },
          winner: { select: { username: true } },
        },
        orderBy: { started_at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.battle_matches.count({ where }),
    ]);

    return NextResponse.json({ matches, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) });
  } catch (err) {
    console.error('[admin/arena/matches GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
