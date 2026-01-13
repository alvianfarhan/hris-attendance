import { NextRequest, NextResponse } from 'next/server'
import { getAllEmployees, saveEmployees, EmployeeRecord } from './fileStore'

// GET: list semua karyawan
export async function GET() {
  const employees = await getAllEmployees()
  return NextResponse.json({ employees })
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

    const normalizedRole: 'EMPLOYEE' | 'ADMIN' =
      role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'

    const all = await getAllEmployees()

    const newEmployee: EmployeeRecord = {
      id: `emp${Date.now()}`,
      name,
      password,
      role: normalizedRole,
      nik,
      bpjs,
      phone,
      email,
      position,
      department,
      employmentType,
      location,
      joinDate,
    }

    const updated = [...all, newEmployee]
    await saveEmployees(updated)

    return NextResponse.json(
      { success: true, employee: newEmployee },
      { status: 201 }
    )
  } catch (e) {
    console.error('Add employee error:', e)
    return NextResponse.json(
      { error: 'Server error saat menambah karyawan' },
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
        { error: 'ID karyawan wajib diisi' },
        { status: 400 }
      )
    }

    const all = await getAllEmployees()
    const idx = all.findIndex((e) => e.id === id)

    if (idx === -1) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      )
    }

    const current = all[idx]

    const normalizedRole: 'EMPLOYEE' | 'ADMIN' =
      role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'

    const updatedEmp: EmployeeRecord = {
      ...current,
      name: name ?? current.name,
      role: normalizedRole ?? current.role,
      nik: nik ?? current.nik,
      bpjs: bpjs ?? current.bpjs,
      phone: phone ?? current.phone,
      email: email ?? current.email,
      position: position ?? current.position,
      department: department ?? current.department,
      employmentType: employmentType ?? current.employmentType,
      location: location ?? current.location,
      joinDate: joinDate ?? current.joinDate,
    }

    const updatedAll = [...all]
    updatedAll[idx] = updatedEmp
    await saveEmployees(updatedAll)

    return NextResponse.json({ success: true, employee: updatedEmp })
  } catch (e) {
    console.error('Update employee error:', e)
    return NextResponse.json(
      { error: 'Server error saat mengubah karyawan' },
      { status: 500 }
    )
  }
}

// DELETE: hapus karyawan berdasarkan ID
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID karyawan wajib diisi' },
        { status: 400 }
      )
    }

    const all = await getAllEmployees()
    const exists = all.some((e) => e.id === id)

    if (!exists) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      )
    }

    const filtered = all.filter((e) => e.id !== id)
    await saveEmployees(filtered)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete employee error:', e)
    return NextResponse.json(
      { error: 'Server error saat menghapus karyawan' },
      { status: 500 }
    )
  }
}