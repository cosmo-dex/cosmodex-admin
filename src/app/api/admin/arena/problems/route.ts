import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const PAGE_SIZE = 20;
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'BOSS'];

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const search = searchParams.get('search')?.trim() ?? '';
  const difficulty = searchParams.get('difficulty')?.trim()?.toUpperCase() ?? '';

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (difficulty) where.difficulty = difficulty;

  try {
    const [problems, total] = await Promise.all([
      prisma.battle_problems.findMany({
        where,
        include: {
          test_cases: { select: { id: true, is_public: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.battle_problems.count({ where }),
    ]);

    const problemsWithCounts = problems.map((p) => ({
      ...p,
      publicTestCases: p.test_cases.filter((t) => t.is_public).length,
      hiddenTestCases: p.test_cases.filter((t) => !t.is_public).length,
      totalTestCases: p.test_cases.length,
      test_cases: undefined,
    }));

    return NextResponse.json(
      {
        problems: problemsWithCounts,
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=15',
        },
      }
    );
  } catch (err) {
    console.error('[admin/arena/problems GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

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
      test_cases?: Array<{ input: string; expected: string; is_public?: boolean }>;
    };

    if (!title || !description || !difficulty || base_points === undefined) {
      return NextResponse.json(
        { error: 'title, description, difficulty, and base_points are required.' },
        { status: 400 }
      );
    }

    const normDifficulty = difficulty.toUpperCase().trim();
    if (!VALID_DIFFICULTIES.includes(normDifficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Allowed values: ${VALID_DIFFICULTIES.join(', ')}` },
        { status: 400 }
      );
    }

    const defaultStarters: Record<string, string> = {
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
      python: 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()',
      java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}',
      javascript: 'function solve() {\n}\n\nsolve();',
    };

    const problem = await prisma.battle_problems.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        difficulty: normDifficulty,
        base_points: Number(base_points),
        time_limit_sec: time_limit_sec ? Number(time_limit_sec) : 2,
        memory_limit_mb: memory_limit_mb ? Number(memory_limit_mb) : 128,
        starter_codes_json: starter_codes_json ?? defaultStarters,
        tags_json: tags_json ?? [],
        ...(test_cases && test_cases.length > 0
          ? {
              test_cases: {
                create: test_cases.map((tc) => ({
                  input: tc.input,
                  expected: tc.expected,
                  is_public: Boolean(tc.is_public),
                })),
              },
            }
          : {}),
      },
      include: {
        test_cases: true,
      },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'create_problem',
      targetTable: 'battle_problems',
      targetId: problem.id,
      newValue: { title: problem.title, difficulty: problem.difficulty, base_points: problem.base_points },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, problem }, { status: 201 });
  } catch (err) {
    console.error('[admin/arena/problems POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
