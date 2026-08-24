import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

interface ExerciseInput {
  title?: string;
  instruction?: string;
  problem_text?: string;
  difficulty?: string;
  initialCode?: string;
  starter_code?: string;
  test_cases?: unknown[];
  xp_reward?: number;
}

interface ChapterInput {
  module_number?: number;
  title: string;
  description?: string;
  exercises?: ExerciseInput[];
}

interface CourseInput {
  language_code: string;
  language_name: string;
  chapters?: ChapterInput[];
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    const validationErrors: string[] = [];

    if (rawBody && rawBody.language_code && rawBody.chapters && Array.isArray(rawBody.chapters)) {
      const course = rawBody as CourseInput;
      const langCode = course.language_code.trim().toLowerCase();
      const langName = course.language_name?.trim() || course.language_code.toUpperCase();

      if (!langCode) validationErrors.push('Missing "language_code".');
      if (!course.chapters || course.chapters.length === 0) validationErrors.push('Chapters array is empty.');

      (course.chapters || []).forEach((ch, idx) => {
        if (!ch.title) validationErrors.push(`Chapter #${idx + 1}: missing "title".`);
      });

      if (validationErrors.length > 0) {
        return NextResponse.json({ error: 'Validation failed', details: validationErrors }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        let lang = await tx.languages.findFirst({ where: { code: langCode } });
        if (!lang) {
          lang = await tx.languages.create({
            data: {
              code: langCode,
              name: langName,
              is_active: true,
            },
          });
        }

        let createdModulesCount = 0;
        let createdExercisesCount = 0;

        for (let i = 0; i < (course.chapters || []).length; i++) {
          const ch = course.chapters![i];
          const mod = await tx.modules.create({
            data: {
              language_id: lang.id,
              created_by: auth.user.userId,
              module_number: ch.module_number ?? (i + 1),
              title: ch.title,
              description: ch.description || null,
              is_published: true,
            },
          });
          createdModulesCount++;

          if (ch.exercises && Array.isArray(ch.exercises)) {
            for (let j = 0; j < ch.exercises.length; j++) {
              const ex = ch.exercises[j];
              const problemText = ex.instruction || ex.problem_text || ex.title || '';
              await tx.questions.create({
                data: {
                  module_id: mod.id,
                  created_by: auth.user.userId,
                  problem_text: problemText,
                  difficulty: ex.difficulty || 'easy',
                  question_type: 'code',
                  test_cases_json: (ex.test_cases as object[] | undefined) ?? [],
                  xp_reward: ex.xp_reward || 55,
                  display_order: j + 1,
                },
              });
              createdExercisesCount++;
            }
          }
        }

        return { languageId: lang.id, modulesCount: createdModulesCount, exercisesCount: createdExercisesCount };
      });

      await logAdminActivity({
        actorId: auth.user.userId,
        actorRole: auth.user.role,
        section: 'learning_platform',
        action: 'bulk_import_course',
        targetTable: 'languages',
        targetId: result.languageId,
        newValue: { modulesCount: result.modulesCount, exercisesCount: result.exercisesCount },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({ success: true, ...result });
    }

    if (rawBody && rawBody.module_id && Array.isArray(rawBody.questions)) {
      const { module_id, questions } = rawBody as { module_id: string; questions: Record<string, unknown>[] };
      const mod = await prisma.modules.findUnique({ where: { id: module_id } });
      if (!mod) return NextResponse.json({ error: 'Target module not found' }, { status: 404 });

      if (questions.length === 0) {
        return NextResponse.json({ error: 'Questions array is empty.' }, { status: 400 });
      }

      questions.forEach((q, idx) => {
        if (!q.problem_text && !q.instruction && !q.title) {
          validationErrors.push(`Question #${idx + 1}: missing "problem_text" or "instruction".`);
        }
      });

      if (validationErrors.length > 0) {
        return NextResponse.json({ error: 'Validation failed', details: validationErrors }, { status: 400 });
      }

      const createdQuestions = await prisma.$transaction(async (tx) => {
        const results = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const problemText = (q.instruction as string) || (q.problem_text as string) || (q.title as string) || '';
          const testCases = Array.isArray(q.test_cases) ? (q.test_cases as object[]) : [];
          const created = await tx.questions.create({
            data: {
              module_id,
              created_by: auth.user.userId,
              problem_text: problemText,
              difficulty: (q.difficulty as string) || 'easy',
              question_type: 'code',
              test_cases_json: testCases,
              xp_reward: (q.xp_reward as number) || 55,
              display_order: i + 1,
            },
          });
          results.push(created);
        }
        return results;
      });

      return NextResponse.json({ success: true, count: createdQuestions.length });
    }

    return NextResponse.json(
      {
        error:
          'Invalid JSON format. Expected a course object with "language_code" and "chapters", or a "{ module_id, questions }" batch.',
      },
      { status: 400 }
    );
  } catch (err) {
    console.error('[admin/learning/bulk-json POST] Error:', err);
    return NextResponse.json({ error: 'Failed to process bulk curriculum JSON' }, { status: 500 });
  }
}
