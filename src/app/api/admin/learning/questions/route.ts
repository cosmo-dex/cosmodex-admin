import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const moduleId = searchParams.get('moduleId');
  const search = searchParams.get('search')?.trim() ?? '';
  const difficulty = searchParams.get('difficulty')?.trim() ?? '';

  const where: Record<string, unknown> = {};
  if (moduleId) where.module_id = moduleId;
  if (search) where.problem_text = { contains: search, mode: 'insensitive' };
  if (difficulty) where.difficulty = difficulty;

  try {
    const [questions, total] = await Promise.all([
      prisma.questions.findMany({
        where,
        orderBy: { display_order: 'asc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              languages: { select: { name: true, code: true } },
            },
          },
        },
      }),
      prisma.questions.count({ where }),
    ]);

    return NextResponse.json(
      {
        questions,
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
    console.error('[admin/learning/questions GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

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

    if (!module_id || !problem_text) {
      return NextResponse.json(
        { error: 'module_id and problem_text are required.' },
        { status: 400 }
      );
    }

    const question = await prisma.questions.create({
      data: {
        module_id,
        created_by: auth.user.userId,
        problem_text: problem_text.trim(),
        difficulty: difficulty?.trim() || 'easy',
        section: section?.trim() || 'Core',
        question_type: question_type?.trim() || 'code',
        test_cases_json: test_cases_json ?? [],
        hints_json: hints_json ?? [],
        time_limit_secs: time_limit_secs ? Number(time_limit_secs) : 5,
        xp_reward: xp_reward ? Number(xp_reward) : 55,
        display_order: display_order ? Number(display_order) : 0,
      },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'learning_platform',
      action: 'create_question',
      targetTable: 'questions',
      targetId: question.id,
      newValue: { difficulty: question.difficulty, module_id: question.module_id },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, question });
  } catch (err) {
    console.error('[admin/learning/questions POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
