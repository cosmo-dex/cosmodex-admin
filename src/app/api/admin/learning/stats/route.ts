import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

let cachedStats: Record<string, unknown> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10_000;

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin']);
  if ('error' in auth) return auth.error;

  const now = Date.now();
  if (cachedStats && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedStats, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const [
      totalLanguages,
      totalModules,
      totalTopics,
      totalQuestions,
      totalEnrollments,
      totalSubmissions,
      recentCompletions,
      activeLearners,
    ] = await Promise.all([
      prisma.languages.count(),
      prisma.modules.count(),
      prisma.topics.count(),
      prisma.questions.count(),
      prisma.enrollments.count(),
      prisma.submissions.count(),
      prisma.module_completions.count(),
      prisma.users.count({ where: { is_active: true, role: 'student' } }),
    ]);

    const stats = {
      totalLanguages,
      totalModules,
      totalTopics,
      totalQuestions,
      totalEnrollments,
      totalSubmissions,
      recentCompletions,
      activeLearners,
    };

    cachedStats = stats;
    lastCacheTime = now;

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[admin/learning/stats GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
