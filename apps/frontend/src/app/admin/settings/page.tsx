'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/shared/config/api';

type Settings = {
  general?: {
    siteName?: string;
    contacts?: string;
    requisites?: string;
  };
  delivery?: {
    methods?: Array<{ name: string; zones?: string; price?: number }>;
  };
  payments?: {
    methods?: Array<{ name: string; enabled?: boolean }>;
    apiKeys?: Record<string, string>;
  };
  email?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    templates?: Record<string, string>;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    analyticsId?: string;
  };
};

type TabKey = 'general' | 'delivery' | 'payments' | 'email' | 'seo';

export default function AdminSettingsPage() {
  const [active, setActive] = useState<TabKey>('general');
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      const resp = await fetch(`${API_BASE_URL}/api/settings`);
      if (!resp.ok) return;
      const data = await resp.json();
      setSettings(data || {});
    };
    run();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!resp.ok) throw new Error('Не удалось сохранить настройки');
      if (typeof window !== 'undefined' && window.toast) window.toast.success('Настройки сохранены');
    } catch {
      if (typeof window !== 'undefined' && window.toast) window.toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Настройки сайта</h1>

      <div className="flex gap-2 border-b mb-4">
        {(['general', 'delivery', 'payments', 'email', 'seo'] as TabKey[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              active === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-700'
            }`}
          >
            {t === 'general' && 'Общие'}
            {t === 'delivery' && 'Доставка'}
            {t === 'payments' && 'Оплата'}
            {t === 'email' && 'Email'}
            {t === 'seo' && 'SEO'}
          </button>
        ))}
      </div>

      {/* Forms per section */}
      <div className="space-y-6">
        {active === 'general' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Название сайта</label>
              <input
                type="text"
                value={settings.general?.siteName || ''}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, siteName: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Контакты</label>
              <textarea
                value={settings.general?.contacts || ''}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, contacts: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Реквизиты</label>
              <textarea
                value={settings.general?.requisites || ''}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, requisites: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
          </div>
        )}

        {active === 'delivery' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Способы доставки</div>
            <div className="space-y-2">
              {(settings.delivery?.methods || []).map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Название"
                    value={m.name || ''}
                    onChange={(e) => {
                      const next = [...(settings.delivery?.methods || [])];
                      next[idx] = { ...m, name: e.target.value };
                      setSettings({ ...settings, delivery: { ...settings.delivery, methods: next } });
                    }}
                    className="px-3 py-2 border rounded-md border-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Зоны"
                    value={m.zones || ''}
                    onChange={(e) => {
                      const next = [...(settings.delivery?.methods || [])];
                      next[idx] = { ...m, zones: e.target.value };
                      setSettings({ ...settings, delivery: { ...settings.delivery, methods: next } });
                    }}
                    className="px-3 py-2 border rounded-md border-gray-300"
                  />
                  <input
                    type="number"
                    placeholder="Цена"
                    value={m.price ?? 0}
                    onChange={(e) => {
                      const next = [...(settings.delivery?.methods || [])];
                      next[idx] = { ...m, price: Number(e.target.value) };
                      setSettings({ ...settings, delivery: { ...settings.delivery, methods: next } });
                    }}
                    className="px-3 py-2 border rounded-md border-gray-300"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSettings({ ...settings, delivery: { ...settings.delivery, methods: [...(settings.delivery?.methods || []), { name: '', zones: '', price: 0 }] } })}
                className="px-3 py-2 rounded-md bg-blue-600 text-white"
              >
                + Добавить способ
              </button>
            </div>
          </div>
        )}

        {active === 'payments' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Способы оплаты</div>
            <div className="space-y-2">
              {(settings.payments?.methods || []).map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Название"
                    value={m.name || ''}
                    onChange={(e) => {
                      const next = [...(settings.payments?.methods || [])];
                      next[idx] = { ...m, name: e.target.value };
                      setSettings({ ...settings, payments: { ...settings.payments, methods: next } });
                    }}
                    className="px-3 py-2 border rounded-md border-gray-300"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!m.enabled}
                      onChange={(e) => {
                        const next = [...(settings.payments?.methods || [])];
                        next[idx] = { ...m, enabled: e.target.checked };
                        setSettings({ ...settings, payments: { ...settings.payments, methods: next } });
                      }}
                    />
                    Активен
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSettings({ ...settings, payments: { ...settings.payments, methods: [...(settings.payments?.methods || []), { name: '', enabled: false }] } })}
                className="px-3 py-2 rounded-md bg-blue-600 text-white"
              >
                + Добавить способ
              </button>

            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600">API ключи</div>
              {Object.entries(settings.payments?.apiKeys || {}).map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={k}
                    readOnly
                    className="px-3 py-2 border rounded-md border-gray-300 bg-gray-50"
                  />
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, apiKeys: { ...(settings.payments?.apiKeys || {}), [k]: e.target.value } } })}
                    className="px-3 py-2 border rounded-md border-gray-300"
                  />
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {active === 'email' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="SMTP Host"
                value={settings.email?.smtpHost || ''}
                onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpHost: e.target.value } })}
                className="px-3 py-2 border rounded-md border-gray-300"
              />
              <input
                type="number"
                placeholder="SMTP Port"
                value={settings.email?.smtpPort ?? 0}
                onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpPort: Number(e.target.value) } })}
                className="px-3 py-2 border rounded-md border-gray-300"
              />
              <input
                type="text"
                placeholder="SMTP User"
                value={settings.email?.smtpUser || ''}
                onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpUser: e.target.value } })}
                className="px-3 py-2 border rounded-md border-gray-300"
              />
              <input
                type="password"
                placeholder="SMTP Password"
                value={settings.email?.smtpPassword || ''}
                onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpPassword: e.target.value } })}
                className="px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Шаблоны</label>
              <textarea
                value={JSON.stringify(settings.email?.templates || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const obj = JSON.parse(e.target.value);
                    setSettings({ ...settings, email: { ...settings.email, templates: obj } });
                  } catch {}
                }}
                rows={6}
                className="w-full px-3 py-2 border rounded-md border-gray-300 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {active === 'seo' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Meta Title</label>
              <input
                type="text"
                value={settings.seo?.metaTitle || ''}
                onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, metaTitle: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea
                value={settings.seo?.metaDescription || ''}
                onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, metaDescription: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Analytics ID</label>
              <input
                type="text"
                value={settings.seo?.analyticsId || ''}
                onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, analyticsId: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Сохранить настройки
        </button>
      </div>
    </div>
  );
}
