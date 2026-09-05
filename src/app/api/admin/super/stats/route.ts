import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalMatches,
      activeMatches,
      totalProblems,
      totalSubmissions,
      recentLogins,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({
        where: { role: { in: ['super_admin', 'learning_admin', 'arena_admin'] } },
      }),
      prisma.battle_matches.count(),
      prisma.battle_matches.count({ where: { status: 'in_progress' } }),
      prisma.battle_problems.count(),
      prisma.battle_submissions.count(),
      prisma.users.count({
        where: {
          last_login_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), 
          },
        },
      }),
    ]);

    let totalBlogs = 0;
    try {
      const blogCountRow = (await prisma.$queryRawUnsafe(
        'SELECT count(*)::int as count FROM blogs;'
      )) as { count: number }[];
      totalBlogs = blogCountRow[0]?.count ?? 0;
    } catch {
      totalBlogs = 0;
    }

    return NextResponse.json({
      totalUsers,
      activeUsers,
      bannedUsers: totalUsers - activeUsers,
      adminUsers,
      totalMatches,
      activeMatches,
      totalProblems,
      totalSubmissions,
      dailyActiveUsers: recentLogins,
      totalBlogs,
    });
  } catch (err) {
    console.error('[admin/super/stats] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
