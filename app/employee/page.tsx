'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmployeeProfile {
  id: string
  name: string
  role: 'EMPLOYEE' | 'ADMIN'
  nik?: string
  bpjs?: string
  phone?: string
  email?: string
  position?: string
  department?: string
  employmentType?: string
  location?: string
  joinDate?: string
}

interface AttendanceState {
  checkIn?: string
  checkOut?: string
  isLate?: boolean
}

interface HistoryRecord {
  id: string
  date: string
  checkIn: string
  checkOut?: string
  isLate?: boolean
}

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  leaveType: 'Cuti' | 'Sakit' | 'Izin'
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  approvedBy?: string
  approvalDate?: string
  rejectionReason?: string
}

interface LeaveQuota {
  employeeId: string
  year: number
  totalQuota: number
  used: number
  remaining: number
}

export default function EmployeePage() {
  const [user, setUser] = useState<any>(null)
  const [attendance, setAttendance] = useState<AttendanceState>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const router = useRouter()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loadingLeaves, setLoadingLeaves] = useState(false)
  const [quota, setQuota] = useState<LeaveQuota | null>(null)
  const [loadingQuota, setLoadingQuota] = useState(false)

  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Cuti' as 'Cuti' | 'Sakit' | 'Izin',
    reason: '',
  })
  const [leaveMessage, setLeaveMessage] = useState('')
  const [submittingLeave, setSubmittingLeave] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('currentUser')
    if (!raw) {
      router.replace('/login')
      return
    }
    const parsed = JSON.parse(raw)
    if (parsed.role !== 'EMPLOYEE') {
      router.replace('/admin')
      return
    }
    setUser(parsed)
  }, [router])

  useEffect(() => {
    if (!user) return
    fetchHistory()
  }, [user])

  const fetchHistory = async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const res = await fetch(
        `/api/attendance/my-history?employeeId=${encodeURIComponent(
          user.id
        )}`
      )
      const data = await res.json()
      if (res.ok) {
        setHistory(data.records || [])
        const today = new Date().toISOString().split('T')[0]
        const todayRecord = (data.records || []).find(
          (r: HistoryRecord) => r.date === today
        )
        if (todayRecord) {
          setAttendance({
            checkIn: todayRecord.checkIn,
            checkOut: todayRecord.checkOut,
            isLate: todayRecord.isLate,
          })
        }
      }
    } catch {
      // optional: set error state
    }
    setLoadingHistory(false)
  }

  const handleCheckIn = async () => {
    if (!user) return
    if (attendance.checkIn) {
      setMessage('Anda sudah check-in hari ini')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          employeeName: user.name,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Gagal check-in')
      } else {
        setAttendance({
          checkIn: data.record.checkIn,
          checkOut: data.record.checkOut,
          isLate: data.record.isLate,
        })
        setMessage(data.message || 'Check-in tercatat di server')
        fetchHistory()
      }
    } catch {
      setMessage('Error koneksi ke server')
    }

    setLoading(false)
  }
    const fetchProfile = async () => {
    if (!user) return
    setLoadingProfile(true)
    try {
      const res = await fetch(
        `/api/employees/me?id=${encodeURIComponent(user.id)}`
      )
      const data = await res.json()
      if (res.ok) {
        setProfile(data.employee)
      }
    } catch {
      // optional: bisa pasang error state
    }
    
    setLoadingProfile(false)
  }
  useEffect(() => {
  if (!user) return
  fetchHistory()
  fetchProfile()
  }, [user])

  const handleCheckOut = async () => {
    if (!user) return

    if (!attendance.checkIn) {
      setMessage('Anda belum check-in')
      return
    }

    if (attendance.checkOut) {
      setMessage('Anda sudah check-out hari ini')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Gagal check-out')
      } else {
        setAttendance((prev) => ({
          ...prev,
          checkOut: data.record.checkOut,
        }))
        setMessage(data.message || 'Check-out tercatat di server')
        fetchHistory()
      }
    } catch {
      setMessage('Error koneksi ke server')
    }

    setLoading(false)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentUser')
    }
    router.replace('/login')
  }

  const fetchLeaves = async () => {
  if (!user) return
  setLoadingLeaves(true)
  try {
    const res = await fetch(
      `/api/leaves?employeeId=${encodeURIComponent(user.id)}`
    )
    const data = await res.json()
    if (res.ok) {
      setLeaves(data.leaves || [])
    }
  } catch {
    // optional
  }
  setLoadingLeaves(false)
}

const fetchQuota = async () => {
  if (!user) return
  setLoadingQuota(true)
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `/api/leaves/quotas?employeeId=${encodeURIComponent(user.id)}&year=${year}`
    )
    const data = await res.json()
    if (res.ok) {
      setQuota(data.quota)
    }
  } catch {
    // optional
  }
  setLoadingQuota(false)
}

const handleSubmitLeave = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!user) return
  setLeaveMessage('')
  setSubmittingLeave(true)

  try {
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: user.id,
        employeeName: user.name,
        ...leaveForm,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setLeaveMessage(data.error || 'Gagal mengajukan cuti')
    } else {
      setLeaveMessage('Pengajuan cuti berhasil dikirim')
      setLeaveForm({
        startDate: '',
        endDate: '',
        leaveType: 'Cuti',
        reason: '',
      })
      fetchLeaves()
      fetchQuota()
    }
  } catch {
    setLeaveMessage('Error koneksi ke server')
  }

  setSubmittingLeave(false)
}
  useEffect(() => {
  if (!user) return
  fetchHistory()
  fetchProfile()
  fetchLeaves()
  fetchQuota()
}, [user])


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF5F7]">
        <span className="text-sm text-slate-500">Memuat...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF5F7] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Karyawan
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">
              Halo, <span className="text-[#B32748]">{user.name}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Lakukan check-in dan check-out sesuai jam kerja.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center rounded-full border border-[#F3C3D0] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Keluar
          </button>
        </header>

        {/* Card Absensi Hari Ini */}
        <section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Absensi hari ini
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check-in maksimal 09.15 • Check-out mulai 18.00
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCheckIn}
              disabled={loading || !!attendance.checkIn}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#B32748] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#8d1f3a] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={
                loading || !attendance.checkIn || !!attendance.checkOut
              }
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-[#B32748] px-4 py-2.5 text-sm font-medium text-[#B32748] bg-white hover:bg-[#B32748] hover:text-white active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Out
            </button>
          </div>

          {message && (
            <div className="text-xs md:text-sm text-[#B32748] bg-[#FCE3EB] border border-[#F3C3D0] rounded-xl px-3 py-2">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs md:text-sm">
            <div className="col-span-1 sm:col-span-1 border border-[#F3C3D0] rounded-xl px-3 py-2.5 bg-[#FFF9FB]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Check In
              </p>
              <p className="mt-1.5 font-medium text-slate-900">
                {attendance.checkIn || '-'}
              </p>
            </div>
            <div className="col-span-1 sm:col-span-1 border border-[#F3C3D0] rounded-xl px-3 py-2.5 bg-[#FFF9FB]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Check Out
              </p>
              <p className="mt-1.5 font-medium text-slate-900">
                {attendance.checkOut || '-'}
              </p>
            </div>
            <div className="col-span-1 border border-[#F3C3D0] rounded-xl px-3 py-2.5 bg-[#FFF9FB]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Status
              </p>
              <p className="mt-1.5 font-medium text-slate-900">
                {!attendance.checkIn
                  ? '-'
                  : attendance.checkOut
                  ? attendance.isLate
                    ? 'Selesai (Telat)'
                    : 'Selesai'
                  : attendance.isLate
                  ? 'Hadir (Telat)'
                  : 'Hadir (Tepat Waktu)'}
              </p>
            </div>
          </div>
        </section>

        {/* History Absensi */}
        <section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Riwayat absensi
            </h2>
            {history.length > 0 && (
              <span className="text-[11px] text-slate-400">
                {history.length} hari tercatat
              </span>
            )}
          </div>

          {loadingHistory ? (
            <p className="text-xs text-slate-500">Memuat riwayat...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-500">
              Belum ada riwayat absensi yang tercatat.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border border-[#F3C3D0] rounded-xl px-3 py-2.5 bg-[#FFF9FB]"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-slate-900">
                      {new Date(r.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      In: {r.checkIn} • Out: {r.checkOut || '-'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${
                      r.checkOut
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {r.checkOut
                      ? r.isLate
                        ? 'Selesai (Telat)'
                        : 'Selesai'
                      : r.isLate
                      ? 'Hadir (Telat)'
                      : 'Hadir'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* Profil Karyawan */}
<section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-5 space-y-3 mt-4">
  <h2 className="text-sm font-semibold text-slate-900">
    Profil karyawan
  </h2>

  {loadingProfile ? (
    <p className="text-xs text-slate-500">Memuat profil...</p>
  ) : !profile ? (
    <p className="text-xs text-slate-500">
      Data profil tidak tersedia.
    </p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] md:text-xs">
      <div className="space-y-1">
        <p className="text-slate-500">Nama</p>
        <p className="font-medium text-slate-900">
          {profile.name}
        </p>
        <p className="text-[10px] text-slate-400">
          ID: {profile.id} • Role: {profile.role}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-slate-500">Posisi & Departemen</p>
        <p className="font-medium text-slate-900">
          {profile.position || '-'}
        </p>
        <p className="text-[10px] text-slate-400">
          {profile.department || '-'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-slate-500">Lokasi & Status</p>
        <p className="font-medium text-slate-900">
          {profile.location || '-'}
        </p>
        <p className="text-[10px] text-slate-400">
          Tipe: {profile.employmentType || '-'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-slate-500">Data legal</p>
        <p className="text-[10px] text-slate-400">
          NIK: {profile.nik || '-'}
        </p>
        <p className="text-[10px] text-slate-400">
          BPJS: {profile.bpjs || '-'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-slate-500">Kontak</p>
        <p className="text-[10px] text-slate-400">
          HP: {profile.phone || '-'}
        </p>
        <p className="text-[10px] text-slate-400">
          Email: {profile.email || '-'}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-slate-500">Tanggal masuk</p>
        <p className="font-medium text-slate-900">
          {profile.joinDate
            ? new Date(profile.joinDate).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '-'}
        </p>
      </div>
    </div>
  )}
</section>
      {/* Kuota Cuti */}
<section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-5 space-y-3">
  <h2 className="text-sm font-semibold text-slate-900">
    Kuota cuti tahunan
  </h2>

  {loadingQuota ? (
    <p className="text-xs text-slate-500">Memuat kuota...</p>
  ) : !quota ? (
    <p className="text-xs text-slate-500">
      Kuota belum ditetapkan oleh admin.
    </p>
  ) : (
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
          Total
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {quota.totalQuota} hari
        </p>
      </div>
      <div className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
          Terpakai
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {quota.used} hari
        </p>
      </div>
      <div className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
          Sisa
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {quota.remaining} hari
        </p>
      </div>
    </div>
  )}
</section>

{/* Form Ajukan Cuti */}
<section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-5 space-y-3">
  <h2 className="text-sm font-semibold text-slate-900">
    Ajukan cuti / izin
  </h2>

  <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">
          Tanggal mulai
        </label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
          value={leaveForm.startDate}
          onChange={(e) =>
            setLeaveForm((f) => ({ ...f, startDate: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">
          Tanggal selesai
        </label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
          value={leaveForm.endDate}
          onChange={(e) =>
            setLeaveForm((f) => ({ ...f, endDate: e.target.value }))
          }
          required
        />
      </div>
    </div>

    <div>
      <label className="block text-[11px] text-slate-500 mb-1">
        Jenis
      </label>
      <select
        className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
        value={leaveForm.leaveType}
        onChange={(e) =>
          setLeaveForm((f) => ({
            ...f,
            leaveType: e.target.value as 'Cuti' | 'Sakit' | 'Izin',
          }))
        }
      >
        <option value="Cuti">Cuti</option>
        <option value="Sakit">Sakit</option>
        <option value="Izin">Izin</option>
      </select>
    </div>

    <div>
      <label className="block text-[11px] text-slate-500 mb-1">
        Alasan
      </label>
      <textarea
        className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
        rows={3}
        placeholder="Jelaskan alasan cuti/izin"
        value={leaveForm.reason}
        onChange={(e) =>
          setLeaveForm((f) => ({ ...f, reason: e.target.value }))
        }
        required
      />
    </div>

    <div className="flex items-center justify-between pt-1">
      <button
        type="submit"
        disabled={submittingLeave}
        className="inline-flex items-center rounded-xl bg-[#B32748] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#8d1f3a] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submittingLeave ? 'Mengirim...' : 'Kirim pengajuan'}
      </button>
      {leaveMessage && (
        <span className="text-[10px] text-[#B32748]">{leaveMessage}</span>
      )}
    </div>
  </form>
</section>

{/* Riwayat Pengajuan Cuti */}
<section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-5 py-5 space-y-3">
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-slate-900">
      Riwayat pengajuan cuti
    </h2>
    {leaves.length > 0 && (
      <span className="text-[11px] text-slate-400">
        {leaves.length} pengajuan
      </span>
    )}
  </div>

  {loadingLeaves ? (
    <p className="text-xs text-slate-500">Memuat riwayat...</p>
  ) : leaves.length === 0 ? (
    <p className="text-xs text-slate-500">
      Belum ada pengajuan cuti.
    </p>
  ) : (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className="border border-[#F3C3D0] rounded-xl px-3 py-2.5 bg-[#FFF9FB]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-900">
                  {leave.leaveType}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    leave.status === 'Approved'
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : leave.status === 'Rejected'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}
                >
                  {leave.status === 'Approved'
                    ? 'Disetujui'
                    : leave.status === 'Rejected'
                    ? 'Ditolak'
                    : 'Menunggu'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {new Date(leave.startDate).toLocaleDateString('id-ID')} -{' '}
                {new Date(leave.endDate).toLocaleDateString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-600">{leave.reason}</p>
              {leave.rejectionReason && (
                <p className="text-[10px] text-red-600">
                  Alasan ditolak: {leave.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
      </div>
    </div>
  )
}