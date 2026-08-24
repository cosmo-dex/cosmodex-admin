import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const moduleItem = await prisma.modules.findUnique({
      where: { id },
      include: {
        languages: { select: { id: true, name: true, code: true } },
        questions: { orderBy: { display_order: 'asc' } },
        topics: { orderBy: { display_order: 'asc' } },
      },
    });

    if (!moduleItem) return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    return NextResponse.json(moduleItem);
  } catch (err) {
    console.error('[admin/learning/modules/[id] GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      module_number,
      title,
      description,
      icon_svg,
      is_skippable,
      is_locked_by_default,
      is_published,
    } = body as {
      module_number?: number;
      title?: string;
      description?: string;
      icon_svg?: string;
      is_skippable?: boolean;
      is_locked_by_default?: boolean;
      is_published?: boolean;
    };

    const existing = await prisma.modules.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (module_number !== undefined) updateData.module_number = Number(module_number);
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon_svg !== undefined) updateData.icon_svg = icon_svg?.trim() || null;
    if (is_skippable !== undefined) updateData.is_skippable = Boolean(is_skippable);
    if (is_locked_by_default !== undefined) updateData.is_locked_by_default = Boolean(is_locked_by_default);
    if (is_published !== undefined) updateData.is_published = Boolean(is_published);
    updateData.updated_at = new Date();

    const updated = await prisma.modules.update({
      where: { id },
      data: updateData,
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'update_module',
      targetTable: 'modules',
      targetId: id,
      oldValue: { title: existing.title },
      newValue: updateData,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, module: updated });
  } catch (err) {
    console.error('[admin/learning/modules/[id] PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.modules.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    await prisma.modules.delete({ where: { id } });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'delete_module',
      targetTable: 'modules',
      targetId: id,
      oldValue: { title: existing.title },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/learning/modules/[id] DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
