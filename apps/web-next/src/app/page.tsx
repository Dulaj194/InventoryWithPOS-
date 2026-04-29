import Link from 'next/link';
import { fetchHealth } from '../lib/api';

export default async function HomePage() {
  let apiStatus = 'Disconnected';

  try {
    const health = await fetchHealth();
    apiStatus = health?.success ? 'Connected' : 'Unknown';
  } catch {
    apiStatus = 'Disconnected';
  }

  return (
    <main>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h1>myPosSystem</h1>
        <p className="small">
          Enterprise-ready SaaS POS + Inventory starter based on NestJS, Prisma, MySQL, Redis, and Next.js.
        </p>
      </div>

      <div className="grid two">
        <section className="card">
          <h2>System Status</h2>
          <p>API: <strong>{apiStatus}</strong></p>
          <p className="small">System health and connection status.</p>
        </section>

        <section className="card">
          <h2>Super Admin Access</h2>
          <p>
            <Link href="/super-admin/login">Super Admin Login</Link>
          </p>
          <p className="small">Access tenant approval and system management.</p>
        </section>
      </div>
    </main>
  );
}
