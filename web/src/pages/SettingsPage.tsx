import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { PageHeader, LoadingSpinner, inputClass, btnPrimary } from '../components/ui';

interface Setting { key: string; value: string; label?: string; labelOm?: string; }

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setSettings(data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { settings: settings.map(({ key, value }) => ({ key, value })) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={t('nav.settings')} action={<button className={btnPrimary} onClick={save} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button>} />
      <div className="bg-white rounded-xl border divide-y">
        {settings.map((s) => (
          <div key={s.key} className="p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <label className="md:w-1/3 text-sm font-medium text-gray-700">{s.label || s.key}</label>
            <input className={`${inputClass} md:flex-1`} value={s.value} onChange={(e) => update(s.key, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}
