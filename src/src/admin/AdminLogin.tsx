import { useState } from 'react'
import { useAuth } from '../shared/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/admin/calendar')
    } catch {
      setError('Nesprávný e-mail nebo heslo')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">✂️ Salon Admin</h1>
        <p className="text-gray-400 text-sm mb-8">Přihlaste se do administrace</p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black transition"
          />
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black transition"
          />
        </div>

        {error && (
          <div className="mt-3 text-red-500 text-sm">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 bg-black text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? 'Přihlašuji...' : 'Přihlásit se'}
        </button>
      </div>
    </div>
  )
}