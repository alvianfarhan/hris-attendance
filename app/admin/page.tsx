'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut?: string
  isLate?: boolean
}

interface EmployeeRecord {
  id: string
  name: string
  password: string
  role: 'EMPLOYEE' | 'ADMIN'
  nik?: string
  bpjs?: string
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

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [addForm, setAddForm] = useState({
    name: '',
    password: '',
    role: 'EMPLOYEE',
    nik: '',
    bpjs: '',
    phone: '',
    email: '',
    position: '',
    department: '',
    location: '',
    employmentType: '',
    joinDate: '',
  })
  const [addMessage, setAddMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'EMPLOYEE',
    nik: '',
    bpjs: '',
  })
  const [editMessage, setEditMessage] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
const [loadingLeaves, setLoadingLeaves] = useState(false)
const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null)

const [quotaForm, setQuotaForm] = useState({
  employeeId: '',
  year: new Date().getFullYear(),
  totalQuota: 12,
})
const [quotaMessage, setQuotaMessage] = useState('')
const [settingQuota, setSettingQuota] = useState(false)


  // Auth admin
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('currentUser')
    if (!raw) {
      router.replace('/login')
      return
    }
    const parsed = JSON.parse(raw)
    if (parsed.role !== 'ADMIN') {
      router.replace('/employee')
      return
    }
    setUser(parsed)
  }, [router])

  // Load data absensi + karyawan
  useEffect(() => {
    if (!user) return
    fetchHistory()
    fetchEmployees()
  }, [user])

  const fetchHistory = async (date?: string) => {
    setLoading(true)
    try {
      const url = date
        ? `/api/attendance/history?date=${encodeURIComponent(date)}`
        : '/api/attendance/history'
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setRecords(data.records || [])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (res.ok) {
        setEmployees(data.employees || [])
      }
    } catch {
      // ignore
    }
    setLoadingEmployees(false)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentUser')
    }
    router.replace('/login')
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateFilter(value)
    fetchHistory(value || undefined)
  }

  // Tambah karyawan
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddMessage('')
    setAdding(true)

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddMessage(data.error || 'Gagal menambah karyawan')
      } else {
        setAddMessage('Karyawan berhasil ditambahkan')
        setAddForm({
        name: '',
        password: '',
        role: 'EMPLOYEE',
        nik: '',
        bpjs: '',
        phone: '',
        email: '',
        position: '',
        department: '',
        location: '',
        employmentType: '',
        joinDate: '',
      })

        fetchEmployees()
      }
    } catch {
      setAddMessage('Error koneksi ke server')
    }

    setAdding(false)
  }

  // Edit karyawan
  const startEdit = (emp: EmployeeRecord) => {
    setEditingId(emp.id)
    setEditForm({
      name: emp.name,
      role: emp.role,
      nik: emp.nik || '',
      bpjs: emp.bpjs || '',
    })
    setEditMessage('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditMessage('')
  }

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setEditMessage('')

    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...editForm,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditMessage(data.error || 'Gagal mengubah karyawan')
      } else {
        setEditMessage('Perubahan disimpan')
        setEditingId(null)
        fetchEmployees()
      }
    } catch {
      setEditMessage('Error koneksi ke server')
    }
  }

  // Hapus karyawan
  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Yakin ingin menghapus karyawan ini?')) return
    setDeletingId(id)
    setAddMessage('')

    try {
      const res = await fetch(`/api/employees?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setAddMessage(data.error || 'Gagal menghapus karyawan')
      } else {
        setAddMessage('Karyawan berhasil dihapus')
        fetchEmployees()
      }
    } catch {
      setAddMessage('Error koneksi ke server')
    }

    setDeletingId(null)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const fetchLeaves = async () => {
  setLoadingLeaves(true)
  try {
    const res = await fetch('/api/leaves')
    const data = await res.json()
    if (res.ok) {
      setLeaves(data.leaves || [])
    }
  } catch {
    // optional
  }
  setLoadingLeaves(false)
}

const handleApproveLeave = async (leaveId: string) => {
  if (!confirm('Setujui pengajuan cuti ini?')) return
  setProcessingLeaveId(leaveId)

  try {
    const res = await fetch('/api/leaves', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: leaveId,
        status: 'Approved',
        approvedBy: user.name,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      fetchLeaves()
    } else {
      alert(data.error || 'Gagal approve')
    }
  } catch {
    alert('Error koneksi ke server')
  }

  setProcessingLeaveId(null)
}

const handleRejectLeave = async (leaveId: string) => {
  const reason = prompt('Alasan menolak (opsional):')
  if (reason === null) return // user cancel

  setProcessingLeaveId(leaveId)

  try {
    const res = await fetch('/api/leaves', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: leaveId,
        status: 'Rejected',
        rejectionReason: reason || 'Tidak ada alasan',
      }),
    })
    const data = await res.json()
    if (res.ok) {
      fetchLeaves()
    } else {
      alert(data.error || 'Gagal reject')
    }
  } catch {
    alert('Error koneksi ke server')
  }

  setProcessingLeaveId(null)
}

const handleSetQuota = async (e: React.FormEvent) => {
  e.preventDefault()
  setQuotaMessage('')
  setSettingQuota(true)

  try {
    const res = await fetch('/api/leaves/quotas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotaForm),
    })
    const data = await res.json()
    if (!res.ok) {
      setQuotaMessage(data.error || 'Gagal set kuota')
    } else {
      setQuotaMessage('Kuota berhasil ditetapkan')
      setQuotaForm({
        employeeId: '',
        year: new Date().getFullYear(),
        totalQuota: 12,
      })
    }
  } catch {
    setQuotaMessage('Error koneksi ke server')
  }

  setSettingQuota(false)
}
  useEffect(() => {
  if (!user) return
  fetchHistory()
  fetchEmployees()
  fetchLeaves()
}, [user])


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF5F7]">
        <span className="text-sm text-slate-500">Memuat...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF5F7] p-3 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Admin / HR
            </p>
            <h1 className="text-lg md:text-2xl font-semibold text-slate-900">
              Dashboard Absensi
            </h1>
            <p className="text-[11px] md:text-xs text-slate-500">
              Monitoring kehadiran dan data karyawan.
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex flex-col items-start sm:items-end text-[11px]">
              <span className="text-slate-500">Masuk sebagai</span>
              <span className="font-medium text-slate-900">
                {user.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-[#F3C3D0] px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Ringkasan & filter */}
        <section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-4 py-4 md:px-5 md:py-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Ringkasan absensi
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gunakan filter tanggal untuk fokus ke hari tertentu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">Tanggal:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={handleFilterChange}
                className="rounded-lg border border-[#F3C3D0] bg-white px-3 py-1.5 text-[11px] md:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1 transition"
              />
              <button
                type="button"
                onClick={() => {
                  setDateFilter('')
                  fetchHistory()
                }}
                className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 text-xs">
            <div className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Total record
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {records.length}
              </p>
            </div>
            <div className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Selesai (check-out)
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {records.filter((r) => r.checkOut).length}
              </p>
            </div>
            <div className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Telat
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {records.filter((r) => r.isLate).length}
              </p>
            </div>
          </div>
        </section>

        {/* Tabel absensi */}
        <section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-4 py-4 md:px-5 md:py-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Detail absensi karyawan
            </h2>
            {dateFilter && (
              <span className="text-[10px] text-slate-400">
                Filter: {dateFilter}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-slate-500">Memuat data...</p>
          ) : records.length === 0 ? (
            <p className="text-xs text-slate-500">
              Belum ada data absensi untuk kriteria ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-[11px] md:text-sm">
                <thead>
                  <tr className="bg-[#B32748] text-white">
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap rounded-tl-xl">
                      Tanggal
                    </th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      Nama
                    </th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      Check In
                    </th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      Check Out
                    </th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap rounded-tr-xl">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-[#F3C3D0] ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FFF9FB]'
                      }`}
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="px-3 py-2 align-top min-w-[140px]">
                        <p className="font-medium text-slate-900">
                          {r.employeeName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ID: {r.employeeId}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-100">
                          {r.checkIn || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {r.checkOut ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                            {r.checkOut}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            r.checkOut
                              ? r.isLate
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : r.isLate
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-50 text-slate-600 border border-slate-100'
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Data karyawan & CRUD */}
        <section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-4 py-4 md:px-5 md:py-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Data karyawan
            </h2>
            <p className="text-[11px] text-slate-500">
              Simpan dan kelola data karyawan (NIK, BPJS, role, dll).
            </p>
          </div>

          {/* Form tambah */}
            <form
              onSubmit={handleAddEmployee}
              className="space-y-3 text-[11px] md:text-xs"
            >
              {/* Baris 1: Nama + Role + Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama karyawan"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
                <div className="flex gap-2">
                  <select
                    className="w-1/3 rounded-xl border border-[#E2E8F0] bg-white px-2 py-2 text-slate-800 text-[11px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        role: e.target.value === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
                      }))
                    }
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <input
                    type="password"
                    placeholder="Password login"
                    className="w-2/3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, password: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Baris 2: Kontak (HP, Email) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nomor HP"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.phone || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
                <input
                  type="email"
                  placeholder="Email (opsional)"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.email || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>

              {/* Baris 3: Posisi, Departemen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Posisi / Jabatan"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.position || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, position: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Departemen / Divisi"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.department || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, department: e.target.value }))
                  }
                />
              </div>

              {/* Baris 4: Lokasi, Tipe kontrak, Tanggal masuk */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Lokasi / Cabang"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.location || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
                <select
                  className="rounded-xl border border-[#E2E8F0] bg-white px-2 py-2 text-slate-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.employmentType || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, employmentType: e.target.value }))
                  }
                >
                  <option value="">Tipe kontrak</option>
                  <option value="Tetap">Tetap</option>
                  <option value="Kontrak">Kontrak</option>
                  <option value="Magang">Magang</option>
                  <option value="Paruh waktu">Paruh waktu</option>
                </select>
                <input
                  type="date"
                  placeholder="Tanggal masuk"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.joinDate || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, joinDate: e.target.value }))
                  }
                />
              </div>

              {/* Baris 5: NIK, BPJS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="NIK (opsional)"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.nik}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, nik: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="BPJS (opsional)"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
                  value={addForm.bpjs}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, bpjs: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={adding}
                  className="inline-flex items-center rounded-xl bg-[#B32748] px-4 py-2 text-[11px] font-medium text-white shadow-sm hover:bg-[#8d1f3a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {adding ? 'Menyimpan...' : 'Tambah karyawan'}
                </button>
                {addMessage && (
                  <span className="text-[10px] text-[#B32748]">{addMessage}</span>
                )}
              </div>
            </form>

          {/* List karyawan + Edit/Hapus */}
          <div className="mt-2 border-t border-[#F3C3D0] pt-3">
            {loadingEmployees ? (
              <p className="text-[11px] text-slate-500">
                Memuat data karyawan...
              </p>
            ) : employees.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Belum ada data karyawan tersimpan.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="border border-[#F3C3D0] rounded-xl px-3 py-2 bg-[#FFF9FB] space-y-1"
                  >
                    {editingId === emp.id ? (
                      <form
                        onSubmit={handleUpdateEmployee}
                        className="space-y-2 text-[11px]"
                      >
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#B32748]"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Nama"
                            required
                          />
                          <select
                            className="w-28 rounded-xl border border-[#E2E8F0] bg-white px-2 py-1.5 text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#B32748]"
                            value={editForm.role}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                role:
                                  e.target.value === 'ADMIN'
                                    ? 'ADMIN'
                                    : 'EMPLOYEE',
                              }))
                            }
                          >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="NIK"
                            className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#B32748]"
                            value={editForm.nik}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                nik: e.target.value,
                              }))
                            }
                          />
                          <input
                            type="text"
                            placeholder="BPJS"
                            className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#B32748]"
                            value={editForm.bpjs}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                bpjs: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-xl bg-[#B32748] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#8d1f3a] transition"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                              Batal
                            </button>
                          </div>
                          {editMessage && (
                            <span className="text-[10px] text-[#B32748]">
                              {editMessage}
                            </span>
                          )}
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-slate-900">
                            {emp.name}{' '}
                            <span className="text-[10px] text-slate-400">
                              ({emp.role})
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            NIK: {emp.nik || '-'} • BPJS: {emp.bpjs || '-'}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            ID: {emp.id}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(emp)}
                            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp.id)}
                            disabled={deletingId === emp.id}
                            className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {deletingId === emp.id ? 'Hapus...' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
       {/* Manajemen Cuti - Pengajuan Pending */}
<section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-4 py-4 md:px-5 md:py-5 space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-sm font-semibold text-slate-900">
        Pengajuan cuti karyawan
      </h2>
      <p className="text-[11px] text-slate-500 mt-0.5">
        Review dan approve/reject pengajuan cuti.
      </p>
    </div>
    <span className="text-[11px] text-slate-400">
      {leaves.filter((l) => l.status === 'Pending').length} pending
    </span>
  </div>

  {loadingLeaves ? (
    <p className="text-xs text-slate-500">Memuat pengajuan...</p>
  ) : leaves.length === 0 ? (
    <p className="text-xs text-slate-500">
      Belum ada pengajuan cuti.
    </p>
  ) : (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className={`border rounded-xl px-3 py-2.5 ${
            leave.status === 'Pending'
              ? 'border-amber-200 bg-amber-50'
              : leave.status === 'Approved'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-900">
                  {leave.employeeName}
                </span>
                <span className="text-[10px] text-slate-500">
                  ({leave.leaveType})
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    leave.status === 'Approved'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : leave.status === 'Rejected'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  {leave.status === 'Approved'
                    ? 'Disetujui'
                    : leave.status === 'Rejected'
                    ? 'Ditolak'
                    : 'Menunggu'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {new Date(leave.startDate).toLocaleDateString('id-ID')} -{' '}
                {new Date(leave.endDate).toLocaleDateString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-700">
                Alasan: {leave.reason}
              </p>
              {leave.rejectionReason && (
                <p className="text-[10px] text-red-600">
                  Alasan ditolak: {leave.rejectionReason}
                </p>
              )}
              {leave.approvedBy && (
                <p className="text-[10px] text-green-600">
                  Disetujui oleh: {leave.approvedBy}
                </p>
              )}
            </div>
            {leave.status === 'Pending' && (
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleApproveLeave(leave.id)}
                  disabled={processingLeaveId === leave.id}
                  className="inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {processingLeaveId === leave.id ? 'Proses...' : 'Setujui'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectLeave(leave.id)}
                  disabled={processingLeaveId === leave.id}
                  className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {processingLeaveId === leave.id ? 'Proses...' : 'Tolak'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</section>

{/* Set Kuota Cuti Karyawan */}
<section className="bg-white/90 backdrop-blur border border-[#F3C3D0] rounded-2xl shadow-sm px-4 py-4 md:px-5 md:py-5 space-y-3">
  <div>
    <h2 className="text-sm font-semibold text-slate-900">
      Tetapkan kuota cuti
    </h2>
    <p className="text-[11px] text-slate-500 mt-0.5">
      Set kuota cuti tahunan untuk setiap karyawan.
    </p>
  </div>

  <form
    onSubmit={handleSetQuota}
    className="space-y-2 text-[11px] md:text-xs"
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <select
        className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
        value={quotaForm.employeeId}
        onChange={(e) =>
          setQuotaForm((f) => ({ ...f, employeeId: e.target.value }))
        }
        required
      >
        <option value="">Pilih karyawan</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name} ({emp.id})
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Tahun"
        className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
        value={quotaForm.year}
        onChange={(e) =>
          setQuotaForm((f) => ({ ...f, year: parseInt(e.target.value) }))
        }
        required
      />

      <input
        type="number"
        placeholder="Jumlah hari"
        className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B32748] focus:ring-offset-1"
        value={quotaForm.totalQuota}
        onChange={(e) =>
          setQuotaForm((f) => ({
            ...f,
            totalQuota: parseInt(e.target.value),
          }))
        }
        required
      />
    </div>

    <div className="flex items-center justify-between pt-1">
      <button
        type="submit"
        disabled={settingQuota}
        className="inline-flex items-center rounded-xl bg-[#B32748] px-4 py-2 text-[11px] font-medium text-white shadow-sm hover:bg-[#8d1f3a] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {settingQuota ? 'Menyimpan...' : 'Tetapkan kuota'}
      </button>
      {quotaMessage && (
        <span className="text-[10px] text-[#B32748]">{quotaMessage}</span>
      )}
    </div>
  </form>
</section> 
      </div>
    </div>
  )
}