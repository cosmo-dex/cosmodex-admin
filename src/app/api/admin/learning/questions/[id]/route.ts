import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const question = await prisma.questions.findUnique({
      where: { id },
      include: {
        modules: {
          select: {
            id: true,
            title: true,
            languages: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    return NextResponse.json(question);
  } catch (err) {
    console.error('[admin/learning/questions/[id] GET] Error:', err);
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
      module_id,
      problem_text,
      difficulty,
      section,
      question_type,
      test_cases_json,
      hints_json,
      time_limit_secs,
      xp_reward,
      display_order,
    } = body as {
      module_id?: string;
      problem_text?: string;
      difficulty?: string;
      section?: string;
      question_type?: string;
      test_cases_json?: unknown;
      hints_json?: unknown;
      time_limit_secs?: number;
      xp_reward?: number;
      display_order?: number;
    };

    const existing = await prisma.questions.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (module_id !== undefined) updateData.module_id = module_id;
    if (problem_text !== undefined) updateData.problem_text = problem_text.trim();
    if (difficulty !== undefined) updateData.difficulty = difficulty.trim();
    if (section !== undefined) updateData.section = section.trim();
    if (question_type !== undefined) updateData.question_type = question_type.trim();
    if (test_cases_json !== undefined) updateData.test_cases_json = test_cases_json;
    if (hints_json !== undefined) updateData.hints_json = hints_json;
    if (time_limit_secs !== undefined) updateData.time_limit_secs = Number(time_limit_secs);
    if (xp_reward !== undefined) updateData.xp_reward = Number(xp_reward);
    if (display_order !== undefined) updateData.display_order = Number(display_order);

    const updated = await prisma.questions.update({
      where: { id },
      data: updateData,
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'update_question',
      targetTable: 'questions',
      targetId: id,
      oldValue: { problem_text: existing.problem_text, difficulty: existing.difficulty },
      newValue: updateData,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (err) {
    console.error('[admin/learning/questions/[id] PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.questions.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    await prisma.questions.delete({ where: { id } });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'delete_question',
      targetTable: 'questions',
      targetId: id,
      oldValue: { problem_text: existing.problem_text, difficulty: existing.difficulty },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/learning/questions/[id] DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
