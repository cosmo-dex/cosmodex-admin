import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const mcq = await prisma.battle_mcq_questions.findUnique({ where: { id } });
    if (!mcq) return NextResponse.json({ error: 'MCQ Question not found' }, { status: 404 });
    return NextResponse.json(mcq);
  } catch (err) {
    console.error('[admin/arena/mcq/[id] GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { question, options, correct_index, difficulty, category } = body as {
      question?: string;
      options?: string[];
      correct_index?: number;
      difficulty?: string;
      category?: string;
    };

    const existing = await prisma.battle_mcq_questions.findUnique({
      where: { id },
      select: { id: true, question: true },
    });
    if (!existing) return NextResponse.json({ error: 'MCQ Question not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (question !== undefined) updateData.question = question.trim();
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return NextResponse.json({ error: 'options must be an array of choices.' }, { status: 400 });
      }
      updateData.options_json = options;
    }
    if (correct_index !== undefined) updateData.correct_index = Number(correct_index);
    if (difficulty !== undefined) {
      const normDiff = difficulty.toLowerCase().trim();
      if (!VALID_DIFFICULTIES.includes(normDiff)) {
        return NextResponse.json({ error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` }, { status: 400 });
      }
      updateData.difficulty = normDiff;
    }
    if (category !== undefined) updateData.category = category.trim();

    const updated = await prisma.battle_mcq_questions.update({
      where: { id },
      data: updateData,
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'update_mcq_question',
      targetTable: 'battle_mcq_questions',
      targetId: id,
      oldValue: { question: existing.question },
      newValue: updateData,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (err) {
    console.error('[admin/arena/mcq/[id] PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.battle_mcq_questions.findUnique({
      where: { id },
      select: { id: true, question: true },
    });
    if (!existing) return NextResponse.json({ error: 'MCQ Question not found' }, { status: 404 });

    await prisma.battle_mcq_questions.delete({ where: { id } });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'delete_mcq_question',
      targetTable: 'battle_mcq_questions',
      targetId: id,
      oldValue: { question: existing.question },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, message: 'MCQ question deleted successfully' });
  } catch (err) {
    console.error('[admin/arena/mcq/[id] DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
