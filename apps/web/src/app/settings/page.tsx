'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailConnectionType, EmailProviderType, FollowupMode } from '@jtk/shared-types';
import { apiFetch, getAuthToken } from '../../lib/api';
import { getSettings, updateSettings } from '../../lib/settings';

interface EmailAccountDto {
    id: string;
    provider: EmailProviderType;
    connectionType: EmailConnectionType;
    email: string;
    lastSyncAt: string | null;
}

type ConnectionMethod = EmailConnectionType;

function EmailProviderSection({
    provider,
    label,
    oauthLabel,
    imapHint,
    accounts,
    onConnected,
}: {
    provider: EmailProviderType;
    label: string;
    oauthLabel: string;
    imapHint: string;
    accounts: EmailAccountDto[];
    onConnected: (message: string) => void;
}) {
    const [method, setMethod] = useState<ConnectionMethod>('oauth');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const providerAccounts = accounts.filter((account) => account.provider === provider);

    async function connectOAuth() {
        setError('');
        try {
            const { url } = await apiFetch<{ url: string }>(`/email-accounts/${provider}/connect`);
            window.location.href = url;
        } catch {
            setError(`Impossible de démarrer la connexion ${label}.`);
        }
    }

    async function connectImap(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiFetch('/email-accounts/imap', {
                method: 'POST',
                body: JSON.stringify({ provider, email, password }),
            });
            setEmail('');
            setPassword('');
            onConnected(`${label} connecté via IMAP !`);
        } catch {
            setError('Connexion IMAP échouée. Vérifiez votre email et votre mot de passe d\'application.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-medium">{label}</h3>

            {providerAccounts.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {providerAccounts.map((account) => (
                        <li key={account.id}>
                            {account.email} — {account.connectionType === 'oauth' ? 'OAuth' : 'IMAP'}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-sm text-slate-500">Aucun compte {label} connecté</p>
            )}

            <div className="mt-4 flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name={`${provider}-method`}
                        checked={method === 'oauth'}
                        onChange={() => setMethod('oauth')}
                    />
                    OAuth
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name={`${provider}-method`}
                        checked={method === 'imap'}
                        onChange={() => setMethod('imap')}
                    />
                    IMAP
                </label>
            </div>

            {method === 'oauth' ? (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={connectOAuth}
                        className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900"
                    >
                        {oauthLabel}
                    </button>
                </div>
            ) : (
                <form onSubmit={connectImap} className="mt-4 space-y-3">
                    <p className="text-xs text-slate-500">{imapHint}</p>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        className="w-full rounded border px-3 py-2 text-sm"
                    />
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe d'application"
                        className="w-full rounded border px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Connexion...' : `Connecter ${label} via IMAP`}
                    </button>
                </form>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
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

    async function loadAccounts() {
        const accs = await apiFetch<EmailAccountDto[]>('/email-accounts');
        setAccounts(accs);
    }

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        if (searchParams.get('gmail') === 'connected') setMessage('Gmail connecté avec succès !');
        if (searchParams.get('outlook') === 'connected') setMessage('Outlook connecté avec succès !');
        Promise.all([loadAccounts(), getSettings()])
            .then(([, settings]) => {
                setFollowupMode(settings.followupMode);
                setFollowupDelayDays(settings.followupDelayDays);
                setTelegramChatId(settings.telegramChatId ?? '');
                setTelegramEnabled(settings.telegramEnabled);
            })
            .catch(() => router.push('/login'));
    }, [router, searchParams]);

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
                <h2 className="mb-2 text-lg font-semibold">Comptes email</h2>
                <p className="mb-4 text-sm text-slate-600">
                    Connectez Gmail ou Outlook via OAuth (recommandé) ou via IMAP avec un mot de passe d&apos;application.
                </p>
                <div className="space-y-4">
                    <EmailProviderSection
                        provider="gmail"
                        label="Gmail"
                        oauthLabel="Connecter via Google"
                        imapHint="Utilisez un mot de passe d'application Google (pas votre mot de passe principal)."
                        accounts={accounts}
                        onConnected={async (msg) => {
                            setMessage(msg);
                            await loadAccounts();
                        }}
                    />
                    <EmailProviderSection
                        provider="outlook"
                        label="Outlook"
                        oauthLabel="Connecter via Microsoft"
                        imapHint="Utilisez un mot de passe d'application Microsoft si l'authentification à deux facteurs est activée."
                        accounts={accounts}
                        onConnected={async (msg) => {
                            setMessage(msg);
                            await loadAccounts();
                        }}
                    />
                </div>
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
