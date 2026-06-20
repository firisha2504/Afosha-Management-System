import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/PublicLayout';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';

interface ContentTab {
  slug: string;
  title: string;
  titleOm?: string;
  content: string;
  contentOm?: string;
}

const TAB_SLUGS = ['about-afosha', 'mission-vision', 'heera-danbii', 'contact'] as const;

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const [tabs, setTabs] = useState<ContentTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('about-afosha');
  const [loading, setLoading] = useState(true);
  const isOm = i18n.language === 'om';

  useEffect(() => {
    api.get('/public/about')
      .then((res) => {
        const data = (res.data.data as ContentTab[]) || [];
        setTabs(data);
        if (data.length) setActiveTab(data[0].slug);
      })
      .finally(() => setLoading(false));
  }, []);

  const current = tabs.find((tab) => tab.slug === activeTab);

  const tabLabels: Record<string, { en: string; om: string }> = {
    'about-afosha': { en: 'About Afosha', om: 'Waa\'ee Afosha' },
    'mission-vision': { en: 'Mission & Vision', om: 'Ergaa fi Mul\'ata' },
    'heera-danbii': { en: 'Rules & Regulations', om: 'Heera fi Danbii' },
    contact: { en: 'Contact', om: 'Quunnamtii' },
  };

  return (
    <PublicLayout>

      {/* Hero banner */}
      <div className="py-16 text-center" style={{
        background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)',
      }}>
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-3">{t('public.about')}</h1>
          <p className="text-lg italic" style={{ color: '#bbf7d0' }}>
            "{t('public.motto')}"
          </p>
          <div className="w-20 h-1 rounded-full mx-auto mt-4"
            style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* Horizontal tab buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TAB_SLUGS.map((slug) => {
                const label = tabLabels[slug];
                const isActive = activeTab === slug;
                return (
                  <button
                    key={slug}
                    onClick={() => setActiveTab(slug)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #166534, #15803d)'
                        : 'white',
                      color: isActive ? 'white' : '#374151',
                      border: isActive ? 'none' : '1px solid #e5e7eb',
                      boxShadow: isActive ? '0 2px 8px rgba(22,101,52,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                    {isOm ? label.om : label.en}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            {current && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                {/* Tab header */}
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                    {(isOm && current.titleOm ? current.titleOm : current.title)[0]}
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: '#14532d' }}>
                    {isOm && current.titleOm ? current.titleOm : current.title}
                  </h2>
                </div>

                {/* Content body */}
                <div className="whitespace-pre-line text-gray-700 leading-relaxed text-sm">
                  {isOm && current.contentOm ? current.contentOm : current.content}
                </div>

                {/* Gold accent for Heera fi Danbii */}
                {activeTab === 'heera-danbii' && (
                  <div className="mt-8 p-5 rounded-xl" style={{
                    background: 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(245,158,11,0.12))',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#d97706' }}>
                      {isOm ? 'Moto Keenya' : 'Our Motto'}
                    </p>
                    <p className="text-lg font-bold italic" style={{ color: '#14532d' }}>
                      {isOm ? '"Tokkummaan Ciminaa fi Milkaayina"' : '"Unity is Strength and Success"'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
