import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: get employee leave quota
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const year = url.searchParams.get('year')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID wajib diisi' },
        { status: 400 }
      )
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear()

    const quota = await prisma.leaveQuota.findFirst({
      where: {
        employeeId,
        year: currentYear,
      },
    })

    if (!quota) {
      return NextResponse.json(
        { error: 'Kuota cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quota })
  } catch (error) {
    console.error('Get leave quota error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST: create/update leave quota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, year, totalQuota } = body

    if (!employeeId || !year || !totalQuota) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check if quota exists
    const existingQuota = await prisma.leaveQuota.findFirst({
      where: {
        employeeId,
        year,
      },
    })

    if (existingQuota) {
      // Update existing quota
      const updatedQuota = await prisma.leaveQuota.update({
        where: { id: existingQuota.id },
        data: {
          totalQuota,
          remaining: totalQuota - existingQuota.used,
        },
      })

      return NextResponse.json({ success: true, quota: updatedQuota })
    } else {
      // Create new quota
      const newQuota = await prisma.leaveQuota.create({
        data: {
          employeeId,
          year,
          totalQuota,
          used: 0,
          remaining: totalQuota,
        },
      })

      return NextResponse.json(
        { success: true, quota: newQuota },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Create/update leave quota error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}