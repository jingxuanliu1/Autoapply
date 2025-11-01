import './globals.css';
import AuthGate from '@/components/AuthGate';

export const metadata = { title: 'Apply Assistant' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
        <nav style={{display:'flex',gap:12,padding:12,borderBottom:'1px solid #eee'}}>
          <a href="/">Home</a>
          <a href="/profile">Profile</a>
          <a href="/templates">Templates</a>
          <a href="/jobs">Jobs</a>
          <a href="/sources">Sources</a>
          <a href="/catalog">Catalog</a>
        </nav>
        <AuthGate>
          <main style={{ padding: 16 }}>{children}</main>
        </AuthGate>
      </body>
    </html>
  );
}
