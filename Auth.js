'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handle = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) setError(error.message)
    else if (mode === 'signup') setMessage('Zkontroluj email a potvrď registraci!')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 30% 20%, #1A1508 0%, #0C0C0C 60%)',
    }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--accent)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>📅</div>
          <h1 className="serif" style={{ fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>
            Týdenní Plánovač
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>AI asistent pro tvůj produktivní týden</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
        }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg)', borderRadius: 10, padding: 4 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--surface2)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--muted)',
                fontSize: 14, fontFamily: 'inherit', fontWeight: mode === m ? 500 : 400,
                transition: 'all 0.2s',
              }}>
                {m === 'login' ? 'Přihlásit se' : 'Registrovat'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14,
              }}
            />
            <input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14,
              }}
            />

            {error && <p style={{ color: 'var(--high)', fontSize: 13, textAlign: 'center' }}>{error}</p>}
            {message && <p style={{ color: 'var(--low)', fontSize: 13, textAlign: 'center' }}>{message}</p>}

            <button onClick={handle} disabled={loading || !email || !password} style={{
              background: 'var(--accent)', color: '#0C0C0C',
              border: 'none', borderRadius: 10, padding: '13px',
              fontSize: 14, fontFamily: 'inherit', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: !email || !password ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}>
              {loading && <div className="spinner" style={{ borderTopColor: '#0C0C0C' }} />}
              {mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
