import { NextRequest, NextResponse } from 'next/server'
import {
  getAllLeaves,
  saveLeaves,
  getEmployeeQuota,
  getAllQuotas,
  saveQuotas,
  LeaveRequest,
} from './fileStore'

// GET: list semua leave requests (admin view) atau filter by employeeId
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const status = url.searchParams.get('status')

    const leaves = await getAllLeaves()

    let filtered = leaves

    if (employeeId) {
      filtered = filtered.filter((l) => l.employeeId === employeeId)
    }

    if (status) {
      filtered = filtered.filter((l) => l.status === status)
    }

    // Sort by createdAt descending (terbaru dulu)
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ leaves: filtered })
  } catch (e) {
    console.error('Get leaves error:', e)
    return NextResponse.json(
      { error: 'Server error saat mengambil data cuti' },
      { status: 500 }
    )
  }
}

// POST: ajukan cuti/izin/sakit baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, employeeName, startDate, endDate, leaveType, reason } =
      body

    if (!employeeId || !startDate || !endDate || !leaveType) {
      return NextResponse.json(
        { error: 'Field wajib tidak boleh kosong' },
        { status: 400 }
      )
    }

    // Validasi tanggal
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      return NextResponse.json(
        { error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai' },
        { status: 400 }
      )
    }

    // Check kuota kalau tipe "Cuti"
    if (leaveType === 'Cuti') {
      const year = start.getFullYear()
      const quota = await getEmployeeQuota(employeeId, year)

      if (!quota) {
        return NextResponse.json(
          { error: 'Kuota cuti belum ditetapkan untuk tahun ini' },
          { status: 400 }
        )
      }

      // Hitung jumlah hari yang diajukan
      const diffTime = end.getTime() - start.getTime()
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      if (quota.remaining < daysCount) {
        return NextResponse.json(
          { 
            error: `Kuota cuti tidak cukup. Sisa: ${quota.remaining} hari, diajukan: ${daysCount} hari` 
          },
          { status: 400 }
        )
      }
    }

    const newLeave: LeaveRequest = {
      id: `leave${Date.now()}`,
      employeeId,
      employeeName,
      startDate,
      endDate,
      leaveType,
      reason: reason || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }

    const leaves = await getAllLeaves()
    const updated = [...leaves, newLeave]
    await saveLeaves(updated)

    console.log('New leave request created:', newLeave)

    return NextResponse.json(
      { success: true, leave: newLeave },
      { status: 201 }
    )
  } catch (e) {
    console.error('Post leave error:', e)
    return NextResponse.json(
      { error: 'Server error saat mengajukan cuti' },
      { status: 500 }
    )
  }
}

// PUT: approve/reject leave request (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, approvedBy, rejectionReason } = body

    console.log('PUT request body:', body)

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID dan status wajib diisi' },
        { status: 400 }
      )
    }

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    const leaves = await getAllLeaves()
    const idx = leaves.findIndex((l) => l.id === id)

    if (idx === -1) {
      return NextResponse.json(
        { error: 'Pengajuan cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    const leave = leaves[idx]

    // Cek apakah sudah di-approve/reject sebelumnya
    if (leave.status !== 'Pending' && status !== 'Pending') {
      return NextResponse.json(
        { error: 'Pengajuan ini sudah diproses sebelumnya' },
        { status: 400 }
      )
    }

    const updated = [...leaves]

    updated[idx] = {
      ...leave,
      status,
      approvedBy: status === 'Approved' ? approvedBy : leave.approvedBy,
      approvalDate: status !== 'Pending' ? new Date().toISOString() : leave.approvalDate,
      rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
    }

    console.log('Leave status updated:', updated[idx])

    await saveLeaves(updated)

    // Kalau approved & tipe Cuti, kurangi kuota
    if (status === 'Approved' && leave.leaveType === 'Cuti') {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      const year = start.getFullYear()
      
      const quotas = await getAllQuotas()
      const quotaIdx = quotas.findIndex(
        (q) => q.employeeId === leave.employeeId && q.year === year
      )

      if (quotaIdx !== -1) {
        // Hitung jumlah hari (inklusif start dan end)
        const diffTime = end.getTime() - start.getTime()
        const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

        console.log('Mengurangi kuota:', {
          employeeId: leave.employeeId,
          year,
          daysCount,
          startDate: leave.startDate,
          endDate: leave.endDate,
          quotaBefore: { ...quotas[quotaIdx] },
        })

        quotas[quotaIdx].used += daysCount
        quotas[quotaIdx].remaining -= daysCount

        console.log('Quota setelah update:', quotas[quotaIdx])

        await saveQuotas(quotas)
      } else {
        console.warn('WARNING: Quota tidak ditemukan untuk:', {
          employeeId: leave.employeeId,
          year,
        })
      }
    }

    return NextResponse.json({ success: true, leave: updated[idx] })
  } catch (e) {
    console.error('Put leave error:', e)
    return NextResponse.json(
      { error: 'Server error saat approve/reject cuti' },
      { status: 500 }
    )
  }
}

// DELETE: hapus pengajuan cuti (opsional, untuk admin)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      )
    }

    const leaves = await getAllLeaves()
    const exists = leaves.some((l) => l.id === id)

    if (!exists) {
      return NextResponse.json(
        { error: 'Pengajuan cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    const filtered = leaves.filter((l) => l.id !== id)
    await saveLeaves(filtered)

    console.log('Leave deleted:', id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete leave error:', e)
    return NextResponse.json(
      { error: 'Server error saat menghapus cuti' },
      { status: 500 }
    )
  }
}