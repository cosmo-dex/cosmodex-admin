import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'BOSS'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const problem = await prisma.battle_problems.findUnique({
      where: { id },
      include: {
        test_cases: {
          orderBy: { is_public: 'desc' },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (err) {
    console.error('[admin/arena/problems/[id] GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      title,
      description,
      difficulty,
      base_points,
      time_limit_sec,
      memory_limit_mb,
      starter_codes_json,
      tags_json,
      test_cases,
    } = body as {
      title?: string;
      description?: string;
      difficulty?: string;
      base_points?: number;
      time_limit_sec?: number;
      memory_limit_mb?: number;
      starter_codes_json?: Record<string, string>;
      tags_json?: string[];
      test_cases?: Array<{ id?: string; input: string; expected: string; is_public?: boolean }>;
    };

    const existing = await prisma.battle_problems.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (difficulty !== undefined) {
      const normDiff = difficulty.toUpperCase().trim();
      if (!VALID_DIFFICULTIES.includes(normDiff)) {
        return NextResponse.json(
          { error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.difficulty = normDiff;
    }
    if (base_points !== undefined) updateData.base_points = Number(base_points);
    if (time_limit_sec !== undefined) updateData.time_limit_sec = Number(time_limit_sec);
    if (memory_limit_mb !== undefined) updateData.memory_limit_mb = Number(memory_limit_mb);
    if (starter_codes_json !== undefined) updateData.starter_codes_json = starter_codes_json;
    if (tags_json !== undefined) updateData.tags_json = tags_json;

    const updated = await prisma.$transaction(async (tx) => {
      const prob = await tx.battle_problems.update({
        where: { id },
        data: updateData,
      });

      if (test_cases && Array.isArray(test_cases)) {
        await tx.battle_test_cases.deleteMany({ where: { problem_id: id } });
        if (test_cases.length > 0) {
          await tx.battle_test_cases.createMany({
            data: test_cases.map((tc) => ({
              problem_id: id,
              input: tc.input,
              expected: tc.expected,
              is_public: Boolean(tc.is_public),
            })),
          });
        }
      }

      return prob;
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'update_problem',
      targetTable: 'battle_problems',
      targetId: id,
      oldValue: { title: existing.title },
      newValue: updateData,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, problem: updated });
  } catch (err) {
    console.error('[admin/arena/problems/[id] PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.battle_problems.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });

    await prisma.battle_problems.delete({ where: { id } });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'delete_problem',
      targetTable: 'battle_problems',
      targetId: id,
      oldValue: { title: existing.title },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, message: 'Problem deleted successfully' });
  } catch (err) {
    console.error('[admin/arena/problems/[id] DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
