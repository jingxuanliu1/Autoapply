'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AppRow = {
  id: string;
  site: 'greenhouse'|'lever'|'workday'|'other';
  company: string | null;
  title: string | null;
  url: string;
  status: string;
};

export default function JobsPage() {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [form, setForm] = useState({ site:'greenhouse', company:'', title:'', url:'' });

  async function load() {
    const { data } = await supabase.from('applications')
      .select('id,site,company,title,url,status,created_at')
      .order('created_at', { ascending: false });
    setRows(data || []);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.url) return alert('URL required');
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const { error } = await supabase.from('applications').insert({
      owner_uid: uid,
      site: form.site as any,
      company: form.company || null,
      title: form.title || null,
      url: form.url,
      status: 'queued'
    });
    if (error) alert(error.message); else { setForm({ site:'greenhouse', company:'', title:'', url:'' }); load(); }
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (error) alert(error.message); else load();
  }

  return (
    <div style={{maxWidth:800}}>
      <h2>Jobs</h2>
      <div style={{display:'grid',gridTemplateColumns:'140px 1fr 1fr 1fr auto',gap:8,alignItems:'end',marginBottom:12}}>
        <div>
          <label>Site</label>
          <select value={form.site} onChange={e=>setForm({...form, site:e.target.value})} style={{width:'100%',padding:8}}>
            <option value="greenhouse">Greenhouse</option>
            <option value="lever">Lever</option>
            <option value="workday">Workday</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>Company</label>
          <input value={form.company} onChange={e=>setForm({...form, company:e.target.value})} style={{width:'100%',padding:8}}/>
        </div>
        <div>
          <label>Title</label>
          <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} style={{width:'100%',padding:8}}/>
        </div>
        <div>
          <label>Application URL</label>
          <input value={form.url} onChange={e=>setForm({...form, url:e.target.value})} style={{width:'100%',padding:8}}/>
        </div>
        <button onClick={add}>Add</button>
      </div>

      <table width="100%" cellPadding={8} style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f8f8f8'}}>
            <th align="left">Site</th><th align="left">Company</th><th align="left">Title</th><th align="left">URL</th><th align="left">Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{borderTop:'1px solid #eee'}}>
              <td>{r.site}</td>
              <td>{r.company}</td>
              <td>{r.title}</td>
              <td><a href={r.url} target="_blank">Open</a></td>
              <td>{r.status}</td>
              <td>
                <select value={r.status} onChange={e=>setStatus(r.id, e.target.value)}>
                  {['queued','opened','filled','needs-info','submitted','failed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{marginTop:12,opacity:.8}}>
        Your browser extension can fetch "queued" jobs and open them in batches for review/autofill.
      </p>
    </div>
  );
}