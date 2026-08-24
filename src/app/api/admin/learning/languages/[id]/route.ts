import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const language = await prisma.languages.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { module_number: 'asc' },
          include: {
            questions: { select: { id: true, problem_text: true, difficulty: true, xp_reward: true } },
            topics: { select: { id: true, title: true, display_order: true } },
          },
        },
      },
    });

    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });
    return NextResponse.json(language);
  } catch (err) {
    console.error('[admin/learning/languages/[id] GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { code, name, icon_url, display_order, is_active } = body as {
      code?: string;
      name?: string;
      icon_url?: string;
      display_order?: number;
      is_active?: boolean;
    };

    const existing = await prisma.languages.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code.trim().toLowerCase();
    if (name !== undefined) updateData.name = name.trim();
    if (icon_url !== undefined) updateData.icon_url = icon_url?.trim() || null;
    if (display_order !== undefined) updateData.display_order = Number(display_order);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updated = await prisma.languages.update({
      where: { id },
      data: updateData,
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'update_language',
      targetTable: 'languages',
      targetId: id,
      oldValue: { name: existing.name, code: existing.code },
      newValue: updateData,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, language: updated });
  } catch (err) {
    console.error('[admin/learning/languages/[id] PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.languages.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    await prisma.languages.delete({ where: { id } });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'delete_language',
      targetTable: 'languages',
      targetId: id,
      oldValue: { name: existing.name, code: existing.code },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/learning/languages/[id] DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
