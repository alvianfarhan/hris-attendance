import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, employeeName } = body

    if (!employeeId || !employeeName) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Cek apakah sudah check-in hari ini
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Anda sudah melakukan check-in hari ini' },
        { status: 400 }
      )
    }

    const checkInTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    // Cek keterlambatan (setelah jam 09:00)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0)

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        employeeName,
        date: now,
        checkIn: checkInTime,
        isLate,
      },
    })

    return NextResponse.json({
      success: true,
      attendance,
      message: isLate ? 'Check-in berhasil (Terlambat)' : 'Check-in berhasil',
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}