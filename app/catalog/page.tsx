'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Posting = { id: string; site: string|null; company: string|null; title: string|null; location: string|null; url: string; apply_url: string|null; created_at: string };
type User = { id: string };

export default function CatalogPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Posting[]>([]);
  const [q, setQ] = useState('');
  const [site, setSite] = useState<'all'|'greenhouse'|'lever'|'workday'|'other'>('all');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user as any || null);
      await load();
    })();
  }, []);

  async function load() {
    // You can add filters server-side with querystring params using Supabase RPC or PostgREST.
    const { data, error } = await supabase
      .from('postings')
      .select('id,site,company,title,location,url,apply_url,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error) setRows(data || []);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (site !== 'all' && r.site !== site) return false;
      if (!needle) return true;
      const blob = `${r.company||''} ${r.title||''} ${r.location||''} ${r.url}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q, site]);

  async function addToQueue(p: Posting) {
    if (!user) return alert('Sign in first.');

    // 1) Add to user_targets (wanted → queued)
    const { error: e1 } = await supabase.from('user_targets').insert({
      owner_uid: user.id,
      posting_id: p.id,
      status: 'queued'
    });
    if (e1 && !String(e1.message).includes('duplicate')) { // ignore unique conflicts if any
      return alert('Add to user_targets failed: ' + e1.message);
    }

    // 2) Create an applications row the extension will consume
    const appUrl = p.apply_url || p.url;
    const { error: e2 } = await supabase.from('applications').insert({
      owner_uid: user.id,
      site: (p.site || 'other') as any,
      company: p.company,
      title: p.title,
      url: appUrl,
      status: 'queued'
    });
    if (e2 && !String(e2.message).includes('duplicate')) {
      // You may have a unique index (owner_uid, url) — ok to ignore duplicates.
      return alert('Add to applications failed: ' + e2.message);
    }

    alert('Queued ✔️  (extension can open it from Applications)');
  }

  return (
    <div style={{maxWidth: 1100}}>
      <h2>Catalog</h2>

      <div style={{display:'flex', gap:8, margin:'8px 0'}}>
        <input placeholder="Search (company, title, location, url)" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1, padding:8}}/>
        <select value={site} onChange={e=>setSite(e.target.value as any)} style={{padding:8}}>
          <option value="all">All sites</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="workday">Workday</option>
          <option value="other">Other</option>
        </select>
        <select value={String(limit)} onChange={e=>{ setLimit(Number(e.target.value)); load(); }} style={{padding:8}}>
          {[50,100,200,500].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={load}>Reload</button>
      </div>

      <table width="100%" cellPadding={8} style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f8f8f8'}}>
            <th align="left">Site</th>
            <th align="left">Company</th>
            <th align="left">Title</th>
            <th align="left">Location</th>
            <th align="left">Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} style={{borderTop:'1px solid #eee'}}>
              <td>{p.site}</td>
              <td>{p.company}</td>
              <td>{p.title}</td>
              <td>{p.location}</td>
              <td style={{wordBreak:'break-all'}}><a href={p.url} target="_blank">Open</a></td>
              <td><button onClick={()=>addToQueue(p)}>Add to my queue</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{marginTop:10,opacity:.8}}>
        After adding to your queue, open the extension and click <b>Open next N jobs</b>. It will pull from <code>applications</code> with <code>status='queued'</code>, open tabs, autofill, and prompt for missing answers.
      </p>
    </div>
  );
}
