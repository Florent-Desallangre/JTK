import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8">
            <h1 className="text-4xl font-bold text-slate-900">Job Tracker IA</h1>
            <p className="max-w-lg text-center text-slate-600">
                Suivez vos candidatures automatiquement à partir de vos emails.
            </p>
            <div className="flex gap-4">
                <Link href="/login" className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                    Connexion
                </Link>
                <Link href="/register" className="rounded border border-slate-300 px-6 py-2 hover:bg-white">
                    Inscription
                </Link>
            </div>
        </main>
    );
}
