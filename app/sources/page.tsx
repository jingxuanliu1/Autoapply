'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Source = { id: string; kind: 'github'|'rss'|'api'|'manual'; url: string; active: boolean; created_at: string };

const INGEST_ENDPOINT = process.env.NEXT_PUBLIC_INGEST_ENDPOINT!; // e.g. https://xxx.functions.supabase.co/ingest_github

export default function SourcesPage() {
  const [rows, setRows] = useState<Source[]>([]);
  const [kind, setKind] = useState<'github'|'rss'|'api'|'manual'>('github');
  const [url, setUrl]   = useState('');

  async function load() {
    const { data, error } = await supabase.from('sources').select('*').order('created_at', { ascending: false });
    if (!error) setRows(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addSource() {
    if (!url) return alert('URL required');
    const { error } = await supabase.from('sources').insert({ kind, url, active: true });
    if (error) return alert(error.message);
    setUrl('');
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from('sources').update({ active }).eq('id', id);
    if (error) alert(error.message); else load();
  }

  async function ingestNow(src: Source) {
    // For GitHub README, pass the RAW URL to your edge function
    // Example RAW: https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md
    const readme = src.url;
    const q = new URLSearchParams({ readme }).toString();
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch(`${INGEST_ENDPOINT}?${q}`, { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    if (!r.ok) return alert(`Ingest failed: ${r.status}`);
    alert('Ingest started / done (check Postings).');
  }

  return (
    <div style={{maxWidth: 900}}>
      <h2>Sources</h2>

      <div style={{display:'grid', gridTemplateColumns:'160px 1fr auto', gap:8, alignItems:'end', marginBottom:12}}>
        <div>
          <label>Kind</label>
          <select value={kind} onChange={e=>setKind(e.target.value as any)} style={{width:'100%', padding:8}}>
            <option value="github">GitHub</option>
            <option value="rss">RSS</option>
            <option value="api">API</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label>URL</label>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="RAW README or feed URL" style={{width:'100%', padding:8}} />
        </div>
        <button onClick={addSource}>Add</button>
      </div>

      <table width="100%" cellPadding={8} style={{borderCollapse:'collapse'}}>
        <thead><tr style={{background:'#f8f8f8'}}><th align="left">Kind</th><th align="left">URL</th><th align="left">Active</th><th></th></tr></thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id} style={{borderTop:'1px solid #eee'}}>
              <td>{s.kind}</td>
              <td style={{wordBreak:'break-all'}}><a href={s.url} target="_blank">{s.url}</a></td>
              <td>
                <input type="checkbox" checked={!!s.active} onChange={e=>toggleActive(s.id, e.target.checked)} />
              </td>
              <td>
                <button onClick={()=>ingestNow(s)}>Ingest now</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{marginTop:12,opacity:.8}}>
        Tip: For SimplifyJobs, use the <b>RAW</b> URL: <br/>
        <code>https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md</code>
      </p>
    </div>
  );
}
