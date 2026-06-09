'use client';

import Link from 'next/link';

export default function SettingsPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-3xl">
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                    ← Retour au dashboard
                </Link>
                <h1 className="mt-4 text-2xl font-bold">Paramètres</h1>
                <p className="mt-2 text-slate-600">Configuration Gmail et notifications — à venir.</p>
            </div>
        </main>
    );
}
