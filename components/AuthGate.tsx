'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }
  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email to confirm.');
  }
  async function signOut() { await supabase.auth.signOut(); }

  if (!sessionReady) return <div style={{padding:20}}>Loading…</div>;

  if (!session) {
    return (
      <div style={{ padding: 20, maxWidth: 420 }}>
        <h2>Apply Assistant — Sign In</h2>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',margin:'8px 0',padding:8}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',margin:'8px 0',padding:8}}/>
        <div style={{display:'flex',gap:8}}>
          <button onClick={signIn}>Sign In</button>
          <button onClick={signUp}>Sign Up</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{padding:10,background:'#f4f4f4',display:'flex',justifyContent:'space-between'}}>
        <div>Signed in</div>
        <button onClick={signOut}>Sign Out</button>
      </div>
      {children}
    </div>
  );
}