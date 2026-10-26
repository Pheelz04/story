import { useState } from 'react';
import VideoGrid from '../components/VideoGrid.jsx';
import Avatar from '../components/Avatar.jsx';
import { useAppData } from '../state/AppData.jsx';
import { useToast } from '../components/Toast.jsx';
import { api, compact } from '../api.js';

const TABS = [
  { id: 'mine', label: 'My videos' },
  { id: 'liked', label: 'Liked' }
];

export default function Profile() {
  const { me, setMe } = useAppData();
  const toast = useToast();
  const [tab, setTab] = useState('mine');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '' });

  if (!me) return <div className="page"><div className="skeleton skeleton--banner" /></div>;

  const startEdit = () => { setForm({ name: me.name, bio: me.bio || '' }); setEditing(true); };
  const save = async (e) => {
    e.preventDefault();
    try {
      const u = await api.updateMe(form);
      setMe((m) => ({ ...m, ...u }));
      setEditing(false);
      toast('Profile updated');
    } catch (err) { toast(err.message, 'error'); }
  };

  const stats = [
    ['Videos', me.stats.videos],
    ['Published', me.stats.published],
    ['Likes', me.stats.likes],
    ['Views', me.stats.views],
    ['Credits', me.credits]
  ];

  return (
    <div className="page">
      <section className="profile">
        <div className="profile__banner" aria-hidden="true" />
        <div className="profile__body">
          <Avatar user={me} size={84} />
          {editing ? (
            <form className="profile__form" onSubmit={save}>
              <input className="input" value={form.name} maxLength={40} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Display name" />
              <textarea className="input" value={form.bio} maxLength={160} rows={2} onChange={(e) => setForm({ ...form, bio: e.target.value })} aria-label="Bio" />
              <div className="row">
                <button className="btn btn--primary btn--sm" type="submit">Save</button>
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile__id">
              <h2>{me.name}</h2>
              <p className="muted">@{me.username}</p>
              {me.bio && <p className="profile__bio">{me.bio}</p>}
              <button className="btn btn--ghost btn--sm" onClick={startEdit}>Edit profile</button>
            </div>
          )}
          <dl className="profile__stats">
            {stats.map(([k, v]) => (
              <div key={k}><dd>{compact(v)}</dd><dt>{k}</dt></div>
            ))}
          </dl>
        </div>
      </section>

      <div className="tabs tabs--underline" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <VideoGrid
        key={tab}
        params={{ scope: tab, sort: 'new' }}
        empty={tab === 'liked' ? 'Videos you like will show up here.' : 'You have not generated any videos yet.'}
      />
    </div>
  );
}
