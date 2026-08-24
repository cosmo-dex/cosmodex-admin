import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const languageId = searchParams.get('languageId');

  const where: Record<string, unknown> = {};
  if (languageId) where.language_id = languageId;

  try {
    const modules = await prisma.modules.findMany({
      where,
      orderBy: { module_number: 'asc' },
      include: {
        languages: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            questions: true,
            topics: true,
            module_completions: true,
          },
        },
      },
    });

    return NextResponse.json(
      { modules },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[admin/learning/modules GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const {
      language_id,
      module_number,
      title,
      description,
      icon_svg,
      is_skippable,
      is_locked_by_default,
      is_published,
    } = body as {
      language_id?: string;
      module_number?: number;
      title?: string;
      description?: string;
      icon_svg?: string;
      is_skippable?: boolean;
      is_locked_by_default?: boolean;
      is_published?: boolean;
    };

    if (!language_id || module_number === undefined || !title) {
      return NextResponse.json(
        { error: 'language_id, module_number, and title are required.' },
        { status: 400 }
      );
    }

    const moduleItem = await prisma.modules.create({
      data: {
        language_id,
        created_by: auth.user.userId,
        module_number: Number(module_number),
        title: title.trim(),
        description: description?.trim() || null,
        icon_svg: icon_svg?.trim() || null,
        is_skippable: Boolean(is_skippable ?? false),
        is_locked_by_default: Boolean(is_locked_by_default ?? true),
        is_published: Boolean(is_published ?? true),
      },
      include: { languages: { select: { name: true, code: true } } },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'create_module',
      targetTable: 'modules',
      targetId: moduleItem.id,
      newValue: { title: moduleItem.title, module_number: moduleItem.module_number },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, module: moduleItem });
  } catch (err) {
    console.error('[admin/learning/modules POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
