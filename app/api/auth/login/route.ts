import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, password } = body

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nama dan password wajib diisi' },
        { status: 400 }
      )
    }

    const user = await prisma.employee.findFirst({
      where: {
        name,
        password,
        active: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    })

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