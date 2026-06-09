'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getAuthToken } from '../../lib/api';

interface EmailAccountDto {
    id: string;
    provider: string;
    email: string;
    lastSyncAt: string | null;
}

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState<EmailAccountDto[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        if (searchParams.get('gmail') === 'connected') {
            setMessage('Gmail connecté avec succès !');
        }
        apiFetch<EmailAccountDto[]>('/email-accounts').then(setAccounts).catch(() => router.push('/login'));
    }, [router, searchParams]);

    async function connectGmail() {
        const { url } = await apiFetch<{ url: string }>('/email-accounts/gmail/connect');
        window.location.href = url;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-3xl">
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                    ← Retour au dashboard
                </Link>
                <h1 className="mt-4 text-2xl font-bold">Paramètres</h1>
                {message && <p className="mt-2 text-green-600">{message}</p>}

                <section className="mt-6 rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold">Comptes email</h2>
                    {accounts.length === 0 ? (
                        <p className="mb-4 text-slate-600">Aucun compte connecté</p>
                    ) : (
                        <ul className="mb-4 space-y-2">
                            {accounts.map((a) => (
                                <li key={a.id} className="text-sm">
                                    {a.provider} — {a.email}
                                    {a.lastSyncAt && (
                                        <span className="ml-2 text-slate-400">
                                            (sync: {new Date(a.lastSyncAt).toLocaleString('fr-FR')})
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button
                        onClick={connectGmail}
                        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        Connecter Gmail
                    </button>
                </section>
            </div>
        </main>
    );
}
