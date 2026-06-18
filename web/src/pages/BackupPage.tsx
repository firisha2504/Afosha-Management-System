import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, LoadingSpinner, btnPrimary, btnSecondary } from '../components/ui';

interface Backup { id: string; filename: string; fileSize: number; type: string; createdAt: string; }

export default function BackupPage() {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    api.get('/settings/backups').then(({ data }) => {
      setBackups(data.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      await api.post('/settings/backups');
      load();
    } finally {
      setCreating(false);
    }
  };

  const restore = async (id: string) => {
    if (!confirm('Restore settings, member balances, and payment records from this backup?')) return;
    const { data } = await api.post(`/settings/backups/${id}/restore`);
    const result = data.data;
    alert(`Restored: ${result.settingsRestored} settings, ${result.membersRestored} members, ${result.paymentsRestored} payments`);
  };

  const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div>
      <PageHeader
        title={t('nav.backup')}
        action={<button className={btnPrimary} onClick={createBackup} disabled={creating}><Database size={16} className="inline mr-1" />{creating ? t('common.loading') : 'Create Backup'}</button>}
      />
      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {backups.map((b) => (
                <tr key={b.id}>
                  <td className="px-6 py-4 text-sm font-mono">{b.filename}</td>
                  <td className="px-6 py-4 text-sm">{b.type}</td>
                  <td className="px-6 py-4 text-sm">{formatSize(b.fileSize)}</td>
                  <td className="px-6 py-4 text-sm">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button className={btnSecondary} onClick={() => restore(b.id)}><RotateCcw size={14} className="inline mr-1" />Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
