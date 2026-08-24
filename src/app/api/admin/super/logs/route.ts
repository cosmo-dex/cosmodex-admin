import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  return NextResponse.json({
    logs: [],
    total: 0,
    page: 1,
    pageSize: 30,
    totalPages: 0,
  });
}
