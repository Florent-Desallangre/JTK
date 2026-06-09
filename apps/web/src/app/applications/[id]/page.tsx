'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getAuthToken } from '../../../lib/api';
import { Application, STATUS_LABELS } from '../../../lib/applications';

interface TimelineEntry {
    type: 'email' | 'status_change' | 'event';
    at: string;
    title: string;
    description?: string;
}

export default function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        Promise.all([
            apiFetch<Application>(`/applications/${id}`),
            apiFetch<TimelineEntry[]>(`/applications/${id}/timeline`),
        ])
            .then(([application, entries]) => {
                setApp(application);
                setTimeline(entries);
            })
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

                <section className="mt-6 rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
                    {timeline.length === 0 ? (
                        <p className="text-slate-500">Aucun événement</p>
                    ) : (
                        <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
                            {timeline.map((entry, i) => (
                                <li key={i} className="relative">
                                    <span className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full bg-blue-500" />
                                    <p className="text-xs text-slate-400">
                                        {new Date(entry.at).toLocaleString('fr-FR')}
                                    </p>
                                    <p className="font-medium">{entry.title}</p>
                                    {entry.description && <p className="text-sm text-slate-600">{entry.description}</p>}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </main>
    );
}
