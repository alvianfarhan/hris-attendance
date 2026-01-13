import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, password } = body

    // DEBUG: Log input yang diterima
    console.log('===== LOGIN DEBUG =====')
    console.log('Input name:', name)
    console.log('Input password:', password)
    console.log('Input name length:', name?.length)
    console.log('Input password length:', password?.length)

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nama dan password wajib diisi' },
        { status: 400 }
      )
    }

    // DEBUG: Cek semua users di database
    const allUsers = await prisma.employee.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        password: true,
        role: true,
      },
    })
    console.log('All users in DB:', allUsers)

    // Query normal
    const user = await prisma.employee.findFirst({
      where: {
        name: name.trim(),
        password: password.trim(),
        active: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    })

    console.log('User found:', user)
    console.log('===== END DEBUG =====')

    if (!user) {
      return NextResponse.json(
        { error: 'Nama atau password salah' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Server error saat login' },
      { status: 500 }
    )
  }
}