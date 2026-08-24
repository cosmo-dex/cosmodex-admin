import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const PAGE_SIZE = 20;
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const search = searchParams.get('search')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const difficulty = searchParams.get('difficulty')?.trim()?.toLowerCase() ?? '';

  const where: Record<string, unknown> = {};
  if (search) where.question = { contains: search, mode: 'insensitive' };
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (difficulty) where.difficulty = difficulty;

  try {
    const [questions, total] = await Promise.all([
      prisma.battle_mcq_questions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.battle_mcq_questions.count({ where }),
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
    console.error('[admin/arena/mcq GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { question, options, correct_index, difficulty, category } = body as {
      question?: string;
      options?: string[];
      correct_index?: number;
      difficulty?: string;
      category?: string;
    };

    if (!question || !options || correct_index === undefined || !difficulty || !category) {
      return NextResponse.json(
        { error: 'question, options (4 choices), correct_index, difficulty, and category are required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'options must be an array of choices.' }, { status: 400 });
    }

    const normDifficulty = difficulty.toLowerCase().trim();
    if (!VALID_DIFFICULTIES.includes(normDifficulty)) {
      return NextResponse.json(
        { error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (correct_index < 0 || correct_index >= options.length) {
      return NextResponse.json(
        { error: `correct_index must be between 0 and ${options.length - 1}` },
        { status: 400 }
      );
    }

    const mcq = await prisma.battle_mcq_questions.create({
      data: {
        question: question.trim(),
        options_json: options,
        correct_index: Number(correct_index),
        difficulty: normDifficulty,
        category: category.trim(),
      },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'create_mcq_question',
      targetTable: 'battle_mcq_questions',
      targetId: mcq.id,
      newValue: { question: mcq.question, difficulty: mcq.difficulty, category: mcq.category },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, question: mcq }, { status: 201 });
  } catch (err) {
    console.error('[admin/arena/mcq POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
