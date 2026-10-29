import type { Metadata } from 'next';
import { AdminStudio } from '@/components/admin-studio';

export const metadata: Metadata = {
  title: 'InnStack Studio',
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminPage() {
  return <AdminStudio />;
}
