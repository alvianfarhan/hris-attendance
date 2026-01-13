import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { id, active: true },
      select: {
        id: true,
        name: true,
        role: true,
        nik: true,
        bpjs: true,
        phone: true,
        email: true,
        position: true,
        department: true,
        employmentType: true,
        location: true,
        joinDate: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Get employee detail error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}