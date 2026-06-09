'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FollowupMode } from '@jtk/shared-types';
import { apiFetch, getAuthToken } from '../../lib/api';
import { getSettings, updateSettings } from '../../lib/settings';

interface EmailAccountDto {
    id: string;
    provider: string;
    email: string;
    lastSyncAt: string | null;
}

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState<EmailAccountDto[]>([]);
    const [message, setMessage] = useState('');
    const [followupMode, setFollowupMode] = useState<FollowupMode>('manual');
    const [followupDelayDays, setFollowupDelayDays] = useState(7);
    const [telegramChatId, setTelegramChatId] = useState('');
    const [telegramEnabled, setTelegramEnabled] = useState(false);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        if (searchParams.get('gmail') === 'connected') setMessage('Gmail connecté avec succès !');
        Promise.all([apiFetch<EmailAccountDto[]>('/email-accounts'), getSettings()])
            .then(([accs, settings]) => {
                setAccounts(accs);
                setFollowupMode(settings.followupMode);
                setFollowupDelayDays(settings.followupDelayDays);
                setTelegramChatId(settings.telegramChatId ?? '');
                setTelegramEnabled(settings.telegramEnabled);
            })
            .catch(() => router.push('/login'));
    }, [router, searchParams]);

    async function connectGmail() {
        const { url } = await apiFetch<{ url: string }>('/email-accounts/gmail/connect');
        window.location.href = url;
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        await updateSettings({
            followupMode,
            followupDelayDays,
            telegramChatId: telegramChatId || undefined,
            telegramEnabled,
        });
        setMessage('Paramètres enregistrés');
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
                ← Retour au dashboard
            </Link>
            <h1 className="mt-4 text-2xl font-bold">Paramètres</h1>
            {message && <p className="mt-2 text-green-600">{message}</p>}

            <section className="mt-6 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Comptes email</h2>
                {accounts.length === 0 ? <p className="mb-4 text-slate-600">Aucun compte connecté</p> : (
                    <ul className="mb-4 space-y-2">
                        {accounts.map((a) => (
                            <li key={a.id} className="text-sm">{a.provider} — {a.email}</li>
                        ))}
                    </ul>
                )}
                <button onClick={connectGmail} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                    Connecter Gmail
                </button>
            </section>

            <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold">Relances</h2>
                <label className="block">
                    <span className="text-sm text-slate-600">Mode</span>
                    <select
                        value={followupMode}
                        onChange={(e) => setFollowupMode(e.target.value as FollowupMode)}
                        className="mt-1 w-full rounded border px-3 py-2"
                    >
                        <option value="manual">Manuel (suggestion uniquement)</option>
                        <option value="assisted">Assisté (validation requise)</option>
                        <option value="automatic">Automatique</option>
                    </select>
                </label>
                <label className="block">
                    <span className="text-sm text-slate-600">Délai avant relance (jours)</span>
                    <input
                        type="number"
                        min={1}
                        max={90}
                        value={followupDelayDays}
                        onChange={(e) => setFollowupDelayDays(Number(e.target.value))}
                        className="mt-1 w-full rounded border px-3 py-2"
                    />
                </label>

                <h2 className="pt-2 text-lg font-semibold">Notifications Telegram</h2>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} />
                    Activer Telegram
                </label>
                <label className="block">
                    <span className="text-sm text-slate-600">Chat ID Telegram</span>
                    <input
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="123456789"
                    />
                </label>

                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Enregistrer
                </button>
            </form>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <Suspense fallback={<p>Chargement...</p>}>
                <SettingsContent />
            </Suspense>
        </main>
    );
}
