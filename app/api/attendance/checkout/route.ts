import { NextRequest, NextResponse } from 'next/server'
import { getAllAttendance, saveAttendance } from '../fileStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const hour = now.getHours()

    if (hour < 18) {
      return NextResponse.json(
        { error: 'Belum boleh check-out (minimal jam 18:00)' },
        { status: 400 }
      )
    }

    const all = await getAllAttendance()

    const index = all.findIndex(
      (r) => r.employeeId === employeeId && r.date === dateStr
    )

    if (index === -1) {
      return NextResponse.json(
        { error: 'Anda belum check-in hari ini' },
        { status: 400 }
      )
    }

    const existing = all[index]

    if (existing.checkOut) {
      return NextResponse.json(
        { error: 'Anda sudah check-out hari ini' },
        { status: 400 }
      )
    }

    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const updatedRecord = { ...existing, checkOut: timeStr }
    const updatedAll = [...all]
    updatedAll[index] = updatedRecord

    await saveAttendance(updatedAll)

    return NextResponse.json({
      success: true,
      record: updatedRecord,
      message: 'Check-out berhasil',
    })
  } catch (e) {
    console.error('Check-out error:', e)
    return NextResponse.json(
      { error: 'Server error saat check-out' },
      { status: 500 }
    )
  }
}