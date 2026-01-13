import { NextRequest, NextResponse } from 'next/server'
import { AttendanceRecord, getAllAttendance, saveAttendance } from '../fileStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, employeeName } = body

    if (!employeeId || !employeeName) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const hour = now.getHours()
    const minute = now.getMinutes()

    const all = await getAllAttendance()

    const existing = all.find(
      (r) => r.employeeId === employeeId && r.date === dateStr
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Anda sudah check-in hari ini' },
        { status: 400 }
      )
    }

    let isLate = false
    if (hour > 9 || (hour === 9 && minute > 15)) {
      isLate = true
    }

    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName,
      date: dateStr,
      checkIn: timeStr,
      isLate,
    }

    const updated = [...all, record]
    await saveAttendance(updated)

    return NextResponse.json({
      success: true,
      record,
      message: isLate
        ? 'Check-in berhasil, tetapi Anda terlambat'
        : 'Check-in tepat waktu',
    })
  } catch (e) {
    console.error('Check-in error:', e)
    return NextResponse.json(
      { error: 'Server error saat check-in' },
      { status: 500 }
    )
  }
}