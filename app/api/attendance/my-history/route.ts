import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID wajib diisi' },
        { status: 400 }
      )
    }

    // Get last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ attendances })
  } catch (error) {
    console.error('Get my attendance history error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}