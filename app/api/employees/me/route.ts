import { NextRequest, NextResponse } from 'next/server'
import { getAllEmployees } from '../fileStore'

export async function GET(request: NextRequest) {
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
    const emp = all.find((e) => e.id === id)

    if (!emp) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      )
    }

    // jangan kirim password ke client
    const { password, ...safe } = emp

    return NextResponse.json({ employee: safe })
  } catch (e) {
    console.error('Get me error:', e)
    return NextResponse.json(
      { error: 'Server error saat mengambil profil' },
      { status: 500 }
    )
  }
}