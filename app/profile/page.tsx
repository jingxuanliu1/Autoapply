'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Profile = {
  uid: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: any | null; // { github, website, linkedin }
};

export default function ProfilePage() {
  const [uid, setUid] = useState<string>('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState({ github:'', website:'', linkedin:'' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setUid(user.id);

      // fetch or bootstrap row
      const { data: rows } = await supabase.from('profiles').select('*').eq('uid', user.id).limit(1);
      if (rows && rows[0]) {
        setProfile(rows[0]);
        const l = rows[0].links || {};
        setLinks({ github: l.github||'', website: l.website||'', linkedin: l.linkedin||'' });
      } else {
        // create an empty profile row
        await supabase.from('profiles').insert({ uid: user.id, email: user.email });
        setProfile({ uid: user.id, full_name:'', email:user.email||'', phone:'', location:'', links:{} });
      }
    })();
  }, []);

  async function save() {
    if (!uid || !profile) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      links
    }).eq('uid', uid);
    if (error) alert(error.message);
    else alert('Saved.');
  }

  if (!profile) return <div>Loading…</div>;

  return (
    <div style={{maxWidth:640}}>
      <h2>Profile</h2>
      <label>Name</label>
      <input value={profile.full_name||''} onChange={e=>setProfile({...profile, full_name:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
      <label>Email</label>
      <input value={profile.email||''} onChange={e=>setProfile({...profile, email:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
      <label>Phone</label>
      <input value={profile.phone||''} onChange={e=>setProfile({...profile, phone:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
      <label>Location</label>
      <input value={profile.location||''} onChange={e=>setProfile({...profile, location:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>

      <h3>Links</h3>
      <label>GitHub</label>
      <input value={links.github} onChange={e=>setLinks({...links, github:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
      <label>Website</label>
      <input value={links.website} onChange={e=>setLinks({...links, website:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>
      <label>LinkedIn</label>
      <input value={links.linkedin} onChange={e=>setLinks({...links, linkedin:e.target.value})} style={{width:'100%',margin:'6px 0',padding:8}}/>

      <button onClick={save} style={{marginTop:12}}>Save</button>
    </div>
  );
}