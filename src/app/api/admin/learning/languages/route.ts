import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  try {
    const languages = await prisma.languages.findMany({
      orderBy: { display_order: 'asc' },
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(
      { languages },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[admin/learning/languages GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { code, name, icon_url, display_order, is_active } = body as {
      code?: string;
      name?: string;
      icon_url?: string;
      display_order?: number;
      is_active?: boolean;
    };

    if (!code || !name) {
      return NextResponse.json({ error: 'Language code and name are required.' }, { status: 400 });
    }

    const normCode = code.trim().toLowerCase();
    const existing = await prisma.languages.findFirst({ where: { code: normCode } });
    if (existing) {
      return NextResponse.json({ error: `Language with code "${normCode}" already exists.` }, { status: 400 });
    }

    const language = await prisma.languages.create({
      data: {
        code: normCode,
        name: name.trim(),
        icon_url: icon_url?.trim() || null,
        display_order: display_order !== undefined ? Number(display_order) : 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'create_language',
      targetTable: 'languages',
      targetId: language.id,
      newValue: { code: language.code, name: language.name },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, language });
  } catch (err) {
    console.error('[admin/learning/languages POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
