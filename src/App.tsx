import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import type { User } from '@supabase/supabase-js'
import { AudioLines, Plus, Upload, Music2, WandSparkles, SlidersHorizontal, LogOut, FolderOpen, Headphones } from 'lucide-react'

type Project = { id: string; name: string; created_at: string }

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectName, setProjectName] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (user) loadProjects() }, [user])

  async function loadProjects() {
    if (!supabase) return
    const { data, error } = await supabase.from('projects').select('id,name,created_at').order('created_at', { ascending: false })
    if (error) setMessage(error.message)
    else setProjects(data ?? [])
  }

  async function authenticate(mode: 'login' | 'signup') {
    if (!supabase) return
    setBusy(true); setMessage('')
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup') setMessage('Account request submitted. Check your email if confirmation is enabled.')
  }

  async function createProject() {
    if (!supabase || !projectName.trim()) return
    setBusy(true); setMessage('')
    const { data, error } = await supabase.from('projects').insert({ name: projectName.trim() }).select().single()
    setBusy(false)
    if (error) setMessage(error.message)
    else { setProjectName(''); setSelectedProject(data.id); setMessage('Project created.'); loadProjects() }
  }

  async function uploadAudio() {
    if (!supabase || !user || !selectedProject || !file) { setMessage('Choose a project and an audio file first.'); return }
    if (file.size > 50 * 1024 * 1024) { setMessage('This starter currently allows files up to 50 MB.'); return }
    setBusy(true); setMessage('')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${selectedProject}/${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('audio-originals').upload(path, file)
    if (uploadError) { setBusy(false); setMessage(uploadError.message); return }
    const { error: rowError } = await supabase.from('audio_assets').insert({
      project_id: selectedProject, storage_path: path, original_filename: file.name,
      mime_type: file.type || 'application/octet-stream', size_bytes: file.size
    })
    setBusy(false)
    setMessage(rowError ? `File uploaded, but its record could not be saved: ${rowError.message}` : 'Audio uploaded successfully.')
    if (!rowError) setFile(null)
  }

  if (!supabaseConfigured) return <main className="setup"><div className="brand"><span className="brand-icon"><AudioLines /></span><span>Timbrelio</span></div><section className="panel"><h1>Connect your studio</h1><p>Your website files are ready. Add the two Supabase environment variables in Netlify, then redeploy.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code><p className="muted">Do not put your Supabase secret key or database password in the website.</p></section></main>

  if (!user) return <main className="auth-wrap"><div className="brand"><span className="brand-icon"><AudioLines /></span><span>Timbrelio</span></div><section className="panel auth"><div className="eyebrow">YOUR MUSIC. YOUR SPACE.</div><h1>Make room for your sound.</h1><p>Sign in or create an account to start organising your music projects.</p><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" /></label><div className="actions"><button disabled={busy || !email || !password} onClick={()=>authenticate('signup')}>Create account</button><button className="secondary" disabled={busy || !email || !password} onClick={()=>authenticate('login')}>Sign in</button></div>{message && <p className="notice">{message}</p>}<p className="muted small">By continuing, use only audio and voices you own or are authorised to process.</p></section></main>

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-icon"><AudioLines /></span><span>Timbrelio</span></div><div className="nav-label">WORKSPACE</div><div className="nav active"><FolderOpen size={18}/> Projects</div><div className="nav"><Music2 size={18}/> Vocal studio <span className="soon">Soon</span></div><div className="nav"><SlidersHorizontal size={18}/> Mixing & mastering <span className="soon">Soon</span></div><div className="nav"><WandSparkles size={18}/> AI tools <span className="soon">Soon</span></div><div className="sidebar-bottom"><div className="user-email">{user.email}</div><button className="logout" onClick={()=>supabase?.auth.signOut()}><LogOut size={16}/> Sign out</button></div></aside><section className="main"><header><div><div className="eyebrow">MUSIC PRODUCTION WORKSPACE</div><h1>Your studio</h1><p>Bring your ideas, recordings and productions together.</p></div><div className="avatar"><Headphones /></div></header><section className="welcome"><div><span className="eyebrow">WELCOME TO TIMBRELIO</span><h2>Your sound starts here.</h2><p>Create a project and keep your original audio files organised in one private workspace.</p></div><AudioLines className="welcome-art" /></section><div className="section-head"><div><h2>Your projects</h2><p className="muted">Your music workspace</p></div></div><section className="create-row"><input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Name your new project" /><button disabled={busy || !projectName.trim()} onClick={createProject}><Plus size={17}/> New project</button></section>{projects.length === 0 ? <div className="empty"><Music2 size={28}/><h3>No projects yet</h3><p>Create your first project above to get started.</p></div> : <div className="project-grid">{projects.map(p=><button key={p.id} className={`project-card ${selectedProject===p.id?'chosen':''}`} onClick={()=>setSelectedProject(p.id)}><Music2/><strong>{p.name}</strong><span>{new Date(p.created_at).toLocaleDateString()}</span></button>)}</div>}<section className="upload panel"><div><h3><Upload size={18}/> Upload original audio</h3><p className="muted">Choose a project, then upload an audio file (maximum 50 MB in this starter).</p></div><select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}><option value="">Select a project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0] ?? null)}/><button disabled={busy || !file || !selectedProject} onClick={uploadAudio}><Upload size={17}/> Upload audio</button></section>{message && <p className="notice">{message}</p>}<footer>© Timbrelio · Your creative space for sound</footer></section></main>
}