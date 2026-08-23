'use client';

import { useState } from 'react';
import { AdminLayout, type AdminPage } from '@/components/admin/admin-layout';
import { StatsOverview } from '@/components/admin/stats-overview';
import { GenerateBatch } from '@/components/admin/generate-batch';
import { ManageBatches } from '@/components/admin/manage-batches';
import { ManagePhysicalQr } from '@/components/admin/manage-physical-qr';
import { AdminUsers } from '@/components/admin/admin-users';
import { AdminStats } from '@/components/admin/admin-stats';

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState<AdminPage>('overview');

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <StatsOverview />;
      case 'generate':
        return <GenerateBatch />;
      case 'batches':
        return <ManageBatches />;
      case 'physical-qr':
        return <ManagePhysicalQr />;
      case 'users':
        return <AdminUsers />;
      case 'stats':
        return <AdminStats />;
      default:
        return <StatsOverview />;
    }
  };

  return (
    <AdminLayout activePage={activePage} onPageChange={setActivePage}>
      {renderPage()}
    </AdminLayout>
  );
}