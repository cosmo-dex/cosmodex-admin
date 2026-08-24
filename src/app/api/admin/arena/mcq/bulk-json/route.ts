import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

interface McqInput {
  question: string;
  options: string[];
  correct_index: number;
  difficulty: string;
  category: string;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    let items: McqInput[] = [];

    if (Array.isArray(rawBody)) {
      items = rawBody;
    } else if (rawBody && typeof rawBody === 'object' && Array.isArray(rawBody.questions)) {
      items = rawBody.questions;
    } else if (rawBody && typeof rawBody === 'object' && rawBody.question) {
      items = [rawBody as McqInput];
    } else {
      return NextResponse.json(
        { error: 'Invalid JSON format. Expected an array of questions or an object with a "questions" array.' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No MCQ questions found in the provided JSON.' }, { status: 400 });
    }

    const validationErrors: string[] = [];

    const validatedItems = items.map((item, idx) => {
      const itemNum = idx + 1;
      const question = String(item.question ?? '').trim();
      const options = Array.isArray(item.options) ? item.options.map(String) : [];
      const correctIndex = Number(item.correct_index);
      const rawDiff = String(item.difficulty ?? '').trim().toLowerCase();
      const category = String(item.category ?? 'General').trim();

      if (!question || question.length < 5) {
        validationErrors.push(`Item #${itemNum}: "question" is required (min 5 characters).`);
      }
      if (!Array.isArray(options) || options.length < 2) {
        validationErrors.push(`Item #${itemNum} ("${question.slice(0, 30)}..."): "options" must have at least 2 choices.`);
      }
      if (isNaN(correctIndex) || correctIndex < 0 || (options.length > 0 && correctIndex >= options.length)) {
        validationErrors.push(
          `Item #${itemNum}: "correct_index" must be an integer between 0 and ${options.length - 1} (got ${item.correct_index}).`
        );
      }
      if (!VALID_DIFFICULTIES.includes(rawDiff)) {
        validationErrors.push(
          `Item #${itemNum}: "difficulty" must be one of: ${VALID_DIFFICULTIES.join(', ')} (got "${item.difficulty}").`
        );
      }

      return {
        question,
        options_json: options,
        correct_index: correctIndex,
        difficulty: rawDiff,
        category,
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

    const createdMcqs = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of validatedItems) {
        const mcq = await tx.battle_mcq_questions.create({
          data: {
            question: item.question,
            options_json: item.options_json,
            correct_index: item.correct_index,
            difficulty: item.difficulty,
            category: item.category,
          },
        });
        results.push(mcq);
      }
      return results;
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'bulk_upload_mcq_questions',
      targetTable: 'battle_mcq_questions',
      targetId: 'multiple',
      newValue: { count: createdMcqs.length },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      count: createdMcqs.length,
      questions: createdMcqs,
    });
  } catch (err) {
    console.error('[admin/arena/mcq/bulk-json POST] Error:', err);
    return NextResponse.json({ error: 'Failed to process JSON upload' }, { status: 500 });
  }
}
