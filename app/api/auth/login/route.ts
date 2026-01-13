import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password wajib diisi' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan password saja
    const user = await prisma.employee.findFirst({
      where: {
        password: password.trim(),
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
        { error: 'Password salah' },
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