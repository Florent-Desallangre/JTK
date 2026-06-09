'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApplicationStatus } from '@jtk/shared-types';
import { getAuthToken } from '../../lib/api';
import { getMe, logout } from '../../lib/auth';
import {
    Application,
    STATUS_LABELS,
    createApplication,
    deleteApplication,
    listApplications,
} from '../../lib/applications';
import { FollowupSuggestion, approveFollowup, listFollowupSuggestions } from '../../lib/followups';
import { DashboardStats, getStats } from '../../lib/stats';

const ALL_STATUSES: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected', 'archived'];

export default function DashboardPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [followups, setFollowups] = useState<FollowupSuggestion[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const load = useCallback(async () => {
        try {
            const [apps, user, suggestions, dashboardStats] = await Promise.all([
                listApplications(),
                getMe(),
                listFollowupSuggestions().catch(() => []),
                getStats().catch(() => null),
            ]);
            setApplications(apps);
            setUserEmail(user.email);
            setFollowups(suggestions);
            setStats(dashboardStats);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        load();
    }, [load, router]);

    const filtered = useMemo(() => {
        return applications.filter((app) => {
            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
            const query = search.toLowerCase();
            const matchesSearch =
                !query ||
                app.title.toLowerCase().includes(query) ||
                (app.company?.toLowerCase().includes(query) ?? false);
            return matchesStatus && matchesSearch;
        });
    }, [applications, search, statusFilter]);

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        try {
            const created = await createApplication({ title, company: company || undefined });
            setApplications((prev) => [created, ...prev]);
            setTitle('');
            setCompany('');
            setShowForm(false);
        } catch {
            setError('Impossible de créer la candidature');
        }
    }

    async function handleDelete(id: string) {
        await deleteApplication(id);
        setApplications((prev) => prev.filter((a) => a.id !== id));
    }

    function handleLogout() {
        logout();
        router.push('/login');
    }

    if (loading) {
        return <main className="flex min-h-screen items-center justify-center">Chargement...</main>;
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b bg-white px-6 py-4">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-900">Job Tracker IA</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">{userEmail}</span>
                        <Link href="/settings" className="text-sm text-blue-600 hover:underline">
                            Paramètres
                        </Link>
                        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <input
                        type="search"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded border border-slate-300 px-3 py-2"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
                        className="rounded border border-slate-300 px-3 py-2"
                    >
                        <option value="all">Tous les statuts</option>
                        {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="ml-auto rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        + Nouvelle candidature
                    </button>
                </div>

                {error && <p className="mb-4 text-red-600">{error}</p>}

                {stats && (
                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow">
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <p className="text-sm text-slate-500">Taux de réponse</p>
                            <p className="text-2xl font-bold">{stats.responseRate}%</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <p className="text-sm text-slate-500">Entretiens</p>
                            <p className="text-2xl font-bold">{stats.byStatus['interview'] ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <p className="text-sm text-slate-500">Relances en attente</p>
                            <p className="text-2xl font-bold">{stats.pendingFollowups}</p>
                        </div>
                    </div>
                )}

                {showForm && (
                    <form onSubmit={handleCreate} className="mb-6 rounded-lg bg-white p-4 shadow">
                        <h2 className="mb-4 font-semibold">Ajouter une candidature</h2>
                        <div className="flex flex-wrap gap-4">
                            <input
                                placeholder="Intitulé du poste"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 rounded border px-3 py-2"
                                required
                            />
                            <input
                                placeholder="Entreprise"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="flex-1 rounded border px-3 py-2"
                            />
                            <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white">
                                Créer
                            </button>
                        </div>
                    </form>
                )}

                {followups.length > 0 && (
                    <section className="mb-6 rounded-lg bg-amber-50 p-4 shadow">
                        <h2 className="mb-3 font-semibold text-amber-900">Relances en attente</h2>
                        {followups.map((f) => (
                            <div key={f.id} className="mb-3 rounded bg-white p-4">
                                <p className="font-medium">{f.subject}</p>
                                <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{f.body}</pre>
                                <button
                                    onClick={async () => {
                                        await approveFollowup(f.id);
                                        setFollowups((prev) => prev.filter((x) => x.id !== f.id));
                                    }}
                                    className="mt-2 rounded bg-green-600 px-3 py-1 text-sm text-white"
                                >
                                    Approuver et envoyer
                                </button>
                            </div>
                        ))}
                    </section>
                )}

                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">Poste</th>
                                <th className="px-4 py-3">Entreprise</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        Aucune candidature trouvée
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((app) => (
                                    <tr key={app.id} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/applications/${app.id}`} className="text-blue-600 hover:underline">
                                                {app.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">{app.company ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                                                {STATUS_LABELS[app.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('fr-FR') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(app.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
