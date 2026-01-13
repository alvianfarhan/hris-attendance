import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: list leave requests
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const status = url.searchParams.get('status')

    const where: any = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (status) {
      where.status = status
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            name: true,
            position: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json({ leaves })
  } catch (error) {
    console.error('Get leaves error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST: create leave request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      employeeId,
      employeeName,
      startDate,
      endDate,
      leaveType,
      reason,
    } = body

    if (!employeeId || !employeeName || !startDate || !endDate || !leaveType) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Hitung jumlah hari
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Cek quota kalau tipe Cuti
    if (leaveType === 'Cuti') {
      const currentYear = new Date().getFullYear()
      const quota = await prisma.leaveQuota.findFirst({
        where: {
          employeeId,
          year: currentYear,
        },
      })

      if (!quota) {
        return NextResponse.json(
          { error: 'Kuota cuti belum tersedia' },
          { status: 400 }
        )
      }

      if (quota.remaining < diffDays) {
        return NextResponse.json(
          { error: `Kuota cuti tidak mencukupi. Sisa: ${quota.remaining} hari` },
          { status: 400 }
        )
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        employeeName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        leaveType,
        reason: reason || null,
        status: 'Pending',
      },
    })

    return NextResponse.json(
      { success: true, leave },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create leave error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// PUT: update leave request (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, approvedBy, rejectionReason } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    // Get leave request
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
    })

    if (!leave) {
      return NextResponse.json(
        { error: 'Pengajuan cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update leave request
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: approvedBy || null,
        approvalDate: new Date(),
        rejectionReason: rejectionReason || null,
      },
    })

    // Update quota kalau approved dan tipe Cuti
    if (status === 'Approved' && leave.leaveType === 'Cuti') {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      const currentYear = new Date().getFullYear()

      const quota = await prisma.leaveQuota.findFirst({
        where: {
          employeeId: leave.employeeId,
          year: currentYear,
        },
      })

      if (quota) {
        await prisma.leaveQuota.update({
          where: { id: quota.id },
          data: {
            used: quota.used + diffDays,
            remaining: quota.remaining - diffDays,
          },
        })
      }
    }

    return NextResponse.json({ success: true, leave: updatedLeave })
  } catch (error) {
    console.error('Update leave error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}