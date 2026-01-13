import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: list semua karyawan
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      where: { active: true },
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST: tambah karyawan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      password,
      role,
      nik,
      bpjs,
      phone,
      email,
      position,
      department,
      employmentType,
      location,
      joinDate,
    } = body

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nama dan password wajib diisi' },
        { status: 400 }
      )
    }

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        password,
        role: role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
        nik: nik || null,
        bpjs: bpjs || null,
        phone: phone || null,
        email: email || null,
        position: position || null,
        department: department || null,
        employmentType: employmentType || null,
        location: location || null,
        joinDate: joinDate ? new Date(joinDate) : null,
      },
    })

    return NextResponse.json(
      { success: true, employee: newEmployee },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add employee error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// PUT: update data karyawan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      role,
      nik,
      bpjs,
      phone,
      email,
      position,
      department,
      employmentType,
      location,
      joinDate,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID wajib diisi' },
        { status: 400 }
      )
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role: role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE' }),
        nik: nik || null,
        bpjs: bpjs || null,
        phone: phone || null,
        email: email || null,
        position: position || null,
        department: department || null,
        employmentType: employmentType || null,
        location: location || null,
        joinDate: joinDate ? new Date(joinDate) : null,
      },
    })

    return NextResponse.json({ success: true, employee: updatedEmployee })
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// DELETE: hapus karyawan (soft delete)
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

    await prisma.employee.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
