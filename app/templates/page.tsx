'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Template = {
  id: string;
  owner_uid: string | null;
  scope: 'private' | 'public';
  site: string;
  question_key: string;
  question_text: string;
  answer_text: string;
};

export default function TemplatesPage() {
  const [mine, setMine] = useState<Template[]>([]);
  const [pub, setPub] = useState<Template[]>([]);
  const [newRow, setNewRow] = useState({ site:'*', question_text:'', answer_text:'' });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      // my private
      const { data: myRows } = await supabase
        .from('qa_templates')
        .select('*')
        .eq('owner_uid', uid)
        .eq('scope', 'private')
        .order('created_at', { ascending: false });
      setMine(myRows || []);

      // public (seeded)
      const { data: pubRows } = await supabase
        .from('qa_templates')
        .select('*')
        .eq('scope', 'public')
        .order('question_key');
      setPub(pubRows || []);
    })();
  }, []);

  async function addTemplate() {
    const key = newRow.question_text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const { error } = await supabase.from('qa_templates').insert({
      owner_uid: uid, scope:'private', site:newRow.site,
      question_key: key, question_text:newRow.question_text, answer_text:newRow.answer_text
    });
    if (error) return alert(error.message);
    setNewRow({ site:'*', question_text:'', answer_text:'' });
    const { data: myRows } = await supabase.from('qa_templates').select('*').eq('owner_uid', uid).eq('scope','private').order('created_at',{ascending:false});
    setMine(myRows || []);
  }

  async function remove(id: string) {
    const { error } = await supabase.from('qa_templates').delete().eq('id', id);
    if (error) alert(error.message);
    setMine(mine.filter(x => x.id !== id));
  }

  return (
    <div style={{display:'grid', gap:24, gridTemplateColumns:'1fr 1fr'}}>
      <div>
        <h2>My Templates (private)</h2>
        <div style={{border:'1px solid #eee', padding:12, borderRadius:8, marginBottom:12}}>
          <label>Site</label>
          <input value={newRow.site} onChange={e=>setNewRow({...newRow, site:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
          <label>Question Text</label>
          <input value={newRow.question_text} onChange={e=>setNewRow({...newRow, question_text:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
          <label>Answer</label>
          <input value={newRow.answer_text} onChange={e=>setNewRow({...newRow, answer_text:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
          <button onClick={addTemplate} style={{marginTop:8}}>Add</button>
        </div>

        {mine.map(t => (
          <div key={t.id} style={{border:'1px solid #eee', padding:8, borderRadius:8, marginBottom:8}}>
            <div><b>[{t.site}]</b> {t.question_text}</div>
            <div style={{opacity:.8}}>Answer: {t.answer_text}</div>
            <button onClick={()=>remove(t.id)} style={{marginTop:6}}>Delete</button>
          </div>
        ))}
      </div>

      <div>
        <h2>Public Templates (read-only)</h2>
        {pub.map(t => (
          <div key={t.id} style={{border:'1px solid #eee', padding:8, borderRadius:8, marginBottom:8}}>
            <div><b>[{t.site}]</b> {t.question_text}</div>
            <div style={{opacity:.8}}>Default answer: {t.answer_text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}