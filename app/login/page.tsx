'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Untuk login dengan password saja, kita perlu modifikasi logic
      // Ambil semua employees dan cari yang match password
      const res = await fetch('/api/employees')
      const data = await res.json()

      if (res.ok && data.employees) {
        const found = data.employees.find((emp: any) => emp.password === password.trim())

        if (!found) {
          setError('Password salah')
          setLoading(false)
          return
        }

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'currentUser',
            JSON.stringify({
              id: found.id,
              name: found.name,
              role: found.role,
            })
          )
        }

        if (found.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/employee')
        }
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Error koneksi saat login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF5F7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#B32748] bg-opacity-10 mb-3">
            <span className="text-xl font-bold text-[#B32748]">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Absensi Kantor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Masuk menggunakan password karyawan Anda.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-[#F3C3D0] px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-[#F3C3D0] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-xs text-[#B32748] bg-[#FCE3EB] border border-[#F3C3D0] rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-[#B32748] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#8d1f3a] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memuat...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-[11px] text-center text-slate-400">
          Prototype internal • Data tersimpan di Neon PostgreSQL
        </p>
      </div>
    </div>
  )
}