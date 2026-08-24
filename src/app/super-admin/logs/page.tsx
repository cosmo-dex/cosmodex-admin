'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { ShieldAlert } from 'lucide-react';

export default function SuperAdminLogsPage() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-white/40">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-black text-white">Audit Logging Disabled</h1>
        <p className="text-sm text-white/50 max-w-md">
          Audit logging has been removed from the platform as per administrator settings. No log records are tracked or stored.
        </p>
      </div>
    </AdminLayout>
  );
}
