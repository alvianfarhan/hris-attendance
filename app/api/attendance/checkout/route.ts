import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID wajib diisi' },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Cari attendance hari ini
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Anda belum check-in hari ini' },
        { status: 400 }
      )
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: 'Anda sudah check-out hari ini' },
        { status: 400 }
      )
    }

    const checkOutTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: checkOutTime },
    })

    return NextResponse.json({
      success: true,
      attendance: updatedAttendance,
      message: 'Check-out berhasil',
    })
  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}