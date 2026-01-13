import { NextRequest, NextResponse } from 'next/server'
import { getAllAttendance } from '../fileStore'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId diperlukan' },
        { status: 400 }
      )
    }

    const all = await getAllAttendance()

    const records = all
      .filter((r) => r.employeeId === employeeId)
      .sort((a, b) => {
        if (a.date < b.date) return 1
        if (a.date > b.date) return -1
        return 0
      })

    return NextResponse.json({ records })
  } catch (e) {
    console.error('My history error:', e)
    return NextResponse.json(
      { error: 'Server error saat mengambil riwayat' },
      { status: 500 }
    )
  }
}