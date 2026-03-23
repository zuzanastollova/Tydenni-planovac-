'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
const PRIORITY = {
  high: { color: '#E05A4E', bg: '#E05A4E22', label: 'Vysoká' },
  medium: { color: '#E09A4E', bg: '#E09A4E22', label: 'Střední' },
  low: { color: '#4EAE8A', bg: '#4EAE8A22', label: 'Nízká' },
}

export default function Dashboard({ user }) {
  const [tasks, setTasks] = useState([])
  const [plans, setPlans] = useState([])
  const [activePlan, setActivePlan] = useState(null)
  const [view, setView] = useState('tasks') // 'tasks' | 'week' | 'history'

  // Task form state
  const [taskName, setTaskName] = useState('')
  const [taskHours, setTaskHours] = useState('1')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDeadline, setTaskDeadline] = useState('')

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  // Load tasks and plans
  useEffect(() => {
    loadTasks()
    loadPlans()
  }, [])

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const loadPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) {
      setPlans(data)
      if (data.length > 0) setActivePlan(data[0])
    }
  }

  const addTask = async () => {
    if (!taskName.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      name: taskName.trim(),
      hours: parseFloat(taskHours) || 1,
      priority: taskPriority,
      deadline: taskDeadline || null,
      completed: false,
    }).select()
    if (!error && data) {
      setTasks([data[0], ...tasks])
      setTaskName('')
      setTaskHours('1')
      setTaskDeadline('')
    }
    setLoading(false)
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const completeTask = async (id) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const generatePlan = async () => {
    if (tasks.length === 0) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })
      const data = await res.json()
      if (data.plan) {
        // Save plan to DB
        const { data: saved } = await supabase.from('plans').insert({
          user_id: user.id,
          plan_data: data.plan,
          tip: data.tip || '',
          name: `Plán ${new Date().toLocaleDateString('cs-CZ')}`,
        }).select()
        if (saved) {
          const newPlan = saved[0]
          setPlans([newPlan, ...plans])
          setActivePlan(newPlan)
          setView('week')
        }
      }
    } catch (e) {
      alert('Chyba při generování plánu.')
    }
    setGenerating(false)
  }

  const sharePlan = async () => {
    if (!activePlan) return
    const shareUrl = `${window.location.origin}/plan/${activePlan.share_id || activePlan.id}`
    await navigator.clipboard.writeText(shareUrl)
    setShareMsg('Odkaz zkopírován!')
    setTimeout(() => setShareMsg(''), 2500)
  }

  const logout = () => supabase.auth.signOut()

  const totalHours = tasks.reduce((s, t) => s + (t.hours || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56,
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12,12,12,0.9)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <span className="serif" style={{ fontSize: 18, color: 'var(--accent)' }}>Týdenní Plánovač</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['tasks', 'week', 'history'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? 'var(--surface2)' : 'transparent',
              border: '1px solid ' + (view === v ? 'var(--border)' : 'transparent'),
              color: view === v ? 'var(--text)' : 'var(--muted)',
              borderRadius: 8, padding: '6px 12px', fontSize: 13,
              fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {v === 'tasks' ? 'Úkoly' : v === 'week' ? 'Plán' : 'Historie'}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
          <button onClick={logout} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Odhlásit</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>

        {/* TASKS VIEW */}
        {view === 'tasks' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 26, marginBottom: 4 }}>Tvoje úkoly</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>{tasks.length} úkolů · {totalHours}h celkem</p>
              </div>
            </div>

            {/* Add task */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 20, marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 14 }}>Přidat úkol</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <input
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Co potřebuješ udělat?"
                  style={{
                    flex: '1 1 220px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 9, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
                  }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 9, padding: '8px 12px',
                }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>⏱</span>
                  <input type="number" min="0.5" max="12" step="0.5" value={taskHours}
                    onChange={e => setTaskHours(e.target.value)}
                    style={{ width: 36, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14 }} />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>h</span>
                </div>
                <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 9, padding: '10px 12px', color: taskDeadline ? 'var(--text)' : 'var(--muted)', fontSize: 13,
                  }} />
                <div style={{ display: 'flex', gap: 5 }}>
                  {Object.entries(PRIORITY).map(([key, val]) => (
                    <button key={key} onClick={() => setTaskPriority(key)} style={{
                      background: taskPriority === key ? val.color : 'var(--bg)',
                      border: '1px solid ' + (taskPriority === key ? val.color : 'var(--border)'),
                      color: taskPriority === key ? '#fff' : val.color,
                      borderRadius: 8, padding: '6px 11px', fontSize: 12,
                      fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
                    }}>{val.label}</button>
                  ))}
                </div>
                <button onClick={addTask} disabled={!taskName.trim() || loading} style={{
                  background: 'var(--accent)', color: '#0C0C0C',
                  border: 'none', borderRadius: 9, padding: '10px 18px',
                  fontSize: 14, fontFamily: 'inherit', fontWeight: 600,
                  cursor: 'pointer', opacity: !taskName.trim() ? 0.5 : 1,
                }}>+ Přidat</button>
              </div>
            </div>

            {/* Task list */}
            {tasks.length > 0 ? (
              <>
                <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                  {tasks.map((t, i) => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
                      borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                      background: 'var(--surface)',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                    >
                      <button onClick={() => completeTask(t.id)} style={{
                        width: 18, height: 18, borderRadius: 5, border: '1px solid var(--border)',
                        background: 'transparent', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = PRIORITY[t.priority].color; e.currentTarget.style.borderColor = PRIORITY[t.priority].color }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
                      />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY[t.priority].color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14 }}>{t.name}</span>
                      {t.deadline && (
                        <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6 }}>
                          📅 {new Date(t.deadline).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.hours}h</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: PRIORITY[t.priority].bg, color: PRIORITY[t.priority].color }}>
                        {PRIORITY[t.priority].label}
                      </span>
                      <button onClick={() => deleteTask(t.id)} style={{
                        background: 'none', border: 'none', color: 'var(--muted)',
                        cursor: 'pointer', fontSize: 15, opacity: 0,
                        transition: 'opacity 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                      >✕</button>
                    </div>
                  ))}
                </div>

                <button onClick={generatePlan} disabled={generating} style={{
                  width: '100%', background: generating ? 'var(--surface2)' : 'var(--accent)',
                  color: generating ? 'var(--muted)' : '#0C0C0C',
                  border: 'none', borderRadius: 12, padding: '15px',
                  fontSize: 15, fontFamily: 'inherit', fontWeight: 600,
                  cursor: generating ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}>
                  {generating && <div className="spinner" style={{ borderTopColor: 'var(--muted)' }} />}
                  {generating ? 'AI sestavuje plán…' : '✨ Sestavit týdenní plán'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
                <p className="serif" style={{ fontSize: 20, color: 'var(--text)', fontStyle: 'italic', marginBottom: 8 }}>Žádné úkoly</p>
                <p style={{ fontSize: 14 }}>Přidej první úkol výše a nech AI sestavit tvůj plán</p>
              </div>
            )}
          </div>
        )}

        {/* WEEK VIEW */}
        {view === 'week' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 26, marginBottom: 4 }}>
                  {activePlan ? activePlan.name : 'Týdenní plán'}
                </h2>
                {activePlan?.tip && (
                  <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 500 }}>💡 {activePlan.tip}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {shareMsg && <span style={{ color: 'var(--low)', fontSize: 13, alignSelf: 'center' }}>{shareMsg}</span>}
                <button onClick={sharePlan} disabled={!activePlan} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 9, padding: '8px 14px',
                  fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                }}>🔗 Sdílet</button>
              </div>
            </div>

            {activePlan ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {DAYS.map((day, i) => {
                  const dayTasks = activePlan.plan_data?.[day] || []
                  const isWeekend = day === 'Sobota' || day === 'Neděle'
                  return (
                    <div key={day} className={`fade-up-${Math.min(i + 1, 7)}`} style={{
                      background: 'var(--surface)',
                      border: '1px solid ' + (dayTasks.length ? 'var(--border)' : 'var(--surface2)'),
                      borderRadius: 12, padding: 16,
                      opacity: dayTasks.length === 0 ? 0.45 : 1,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                      onMouseEnter={e => { if (dayTasks.length) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)' } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span className="serif" style={{ fontSize: 16, fontWeight: 700 }}>{day}</span>
                        {isWeekend
                          ? <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>VÍKEND</span>
                          : dayTasks.length > 0 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{dayTasks.length}×</span>}
                      </div>
                      {dayTasks.length === 0
                        ? <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Volno ☀️</p>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {dayTasks.map((name, j) => {
                            const task = tasks.find(t => t.name === name)
                            const color = task ? PRIORITY[task.priority].color : 'var(--muted)'
                            return (
                              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
                                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{name}</span>
                              </div>
                            )
                          })}
                        </div>
                      }
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p className="serif" style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 16, color: 'var(--muted)' }}>Ještě žádný plán</p>
                <button onClick={() => setView('tasks')} style={{
                  background: 'var(--accent)', color: '#0C0C0C', border: 'none',
                  borderRadius: 9, padding: '10px 22px', fontSize: 14, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer',
                }}>Přidat úkoly →</button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && (
          <div className="fade-up">
            <h2 className="serif" style={{ fontSize: 26, marginBottom: 24 }}>Historie plánů</h2>
            {plans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plans.map((p, i) => (
                  <div key={p.id} className={`fade-up-${Math.min(i + 1, 7)}`} style={{
                    background: 'var(--surface)', border: '1px solid ' + (activePlan?.id === p.id ? 'var(--accent)' : 'var(--border)'),
                    borderRadius: 12, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onClick={() => { setActivePlan(p); setView('week') }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(p.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: 18 }}>→</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Zatím žádné plány.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
