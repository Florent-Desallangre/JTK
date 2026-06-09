'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getAuthToken } from '../../../lib/api';
import { Application, STATUS_LABELS } from '../../../lib/applications';

export default function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        apiFetch<Application>(`/applications/${id}`)
            .then(setApp)
            .catch(() => router.push('/dashboard'));
    }, [id, router]);

    if (!app) {
        return <main className="flex min-h-screen items-center justify-center">Chargement...</main>;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-3xl">
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                    ← Retour au dashboard
                </Link>
                <div className="mt-4 rounded-lg bg-white p-6 shadow">
                    <h1 className="text-2xl font-bold">{app.title}</h1>
                    <p className="mt-2 text-slate-600">{app.company ?? 'Entreprise inconnue'}</p>
                    <p className="mt-4">
                        Statut : <strong>{STATUS_LABELS[app.status]}</strong>
                    </p>
                </div>
            </div>
        </main>
    );
}
