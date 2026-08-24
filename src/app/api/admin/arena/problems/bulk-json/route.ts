import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'BOSS'];

interface ProblemInput {
  title: string;
  description: string;
  difficulty: string;
  base_points: number;
  time_limit_sec?: number;
  memory_limit_mb?: number;
  starter_codes_json?: Record<string, string>;
  tags_json?: string[];
  test_cases?: Array<{ input: string; expected: string; is_public?: boolean }>;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    let items: ProblemInput[] = [];

    if (Array.isArray(rawBody)) {
      items = rawBody;
    } else if (rawBody && typeof rawBody === 'object' && Array.isArray(rawBody.problems)) {
      items = rawBody.problems;
    } else if (rawBody && typeof rawBody === 'object' && rawBody.title) {
      items = [rawBody as ProblemInput];
    } else {
      return NextResponse.json(
        {
          error:
            'Invalid JSON format. Expected an array of problems or an object with a "problems" array.',
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No problem items found in the provided JSON.' },
        { status: 400 }
      );
    }

    const validationErrors: string[] = [];

    const validatedItems = items.map((item, idx) => {
      const itemNum = idx + 1;
      const title = String(item.title ?? '').trim();
      const description = String(item.description ?? '').trim();
      const rawDiff = String(item.difficulty ?? '').trim().toUpperCase();
      const basePoints = Number(item.base_points);

      if (!title || title.length < 2) {
        validationErrors.push(`Item #${itemNum}: "title" is required (min 2 characters).`);
      }
      if (!description || description.length < 5) {
        validationErrors.push(`Item #${itemNum} ("${title || 'Untitled'}"): "description" is required.`);
      }
      if (!VALID_DIFFICULTIES.includes(rawDiff)) {
        validationErrors.push(
          `Item #${itemNum} ("${title || 'Untitled'}"): "difficulty" must be one of: ${VALID_DIFFICULTIES.join(', ')} (got "${item.difficulty}")`
        );
      }
      if (isNaN(basePoints) || basePoints <= 0) {
        validationErrors.push(`Item #${itemNum} ("${title || 'Untitled'}"): "base_points" must be a positive number.`);
      }

      const testCases = Array.isArray(item.test_cases)
        ? item.test_cases.map((tc, tcIdx) => {
            if (tc.input === undefined || tc.input === null || tc.expected === undefined || tc.expected === null) {
              validationErrors.push(
                `Item #${itemNum} ("${title || 'Untitled'}") Test Case #${tcIdx + 1}: "input" and "expected" are required.`
              );
            }
            return {
              input: String(tc.input ?? ''),
              expected: String(tc.expected ?? ''),
              is_public: Boolean(tc.is_public ?? false),
            };
          })
        : [];

      return {
        title,
        description,
        difficulty: rawDiff,
        base_points: basePoints,
        time_limit_sec: item.time_limit_sec ? Number(item.time_limit_sec) : 2,
        memory_limit_mb: item.memory_limit_mb ? Number(item.memory_limit_mb) : 128,
        starter_codes_json: item.starter_codes_json ?? {},
        tags_json: item.tags_json ?? [],
        test_cases: testCases,
      };
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'JSON Schema validation failed.',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    const createdProblems = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of validatedItems) {
        const prob = await tx.battle_problems.create({
          data: {
            title: item.title,
            description: item.description,
            difficulty: item.difficulty,
            base_points: item.base_points,
            time_limit_sec: item.time_limit_sec,
            memory_limit_mb: item.memory_limit_mb,
            starter_codes_json: item.starter_codes_json,
            tags_json: item.tags_json,
            test_cases: item.test_cases.length > 0
              ? { create: item.test_cases }
              : undefined,
          },
          include: { test_cases: true },
        });
        results.push(prob);
      }
      return results;
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'bulk_upload_problems',
      targetTable: 'battle_problems',
      targetId: 'multiple',
      newValue: { count: createdProblems.length, titles: createdProblems.map((p) => p.title) },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      count: createdProblems.length,
      problems: createdProblems,
    });
  } catch (err) {
    console.error('[admin/arena/problems/bulk-json POST] Error:', err);
    return NextResponse.json({ error: 'Failed to process JSON upload' }, { status: 500 });
  }
}
