'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            router.push('/dashboard');
        } catch {
            setError('Identifiants invalides');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-8 shadow">
                <h1 className="mb-6 text-2xl font-bold text-slate-900">Connexion</h1>
                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                <label className="mb-4 block">
                    <span className="mb-1 block text-sm text-slate-600">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        required
                    />
                </label>
                <label className="mb-6 block">
                    <span className="mb-1 block text-sm text-slate-600">Mot de passe</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                        required
                    />
                </label>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Connexion...' : 'Se connecter'}
                </button>
                <p className="mt-4 text-center text-sm text-slate-600">
                    Pas de compte ?{' '}
                    <Link href="/register" className="text-blue-600 hover:underline">
                        S&apos;inscrire
                    </Link>
                </p>
            </form>
        </main>
    );
}
