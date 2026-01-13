import { NextRequest, NextResponse } from 'next/server'
import { getAllAttendance } from '../fileStore'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date')

  const all = await getAllAttendance()

  let data = all
  if (date) {
    data = data.filter((r) => r.date === date)
  }

  const sorted = [...data].sort((a, b) => {
    if (a.date < b.date) return 1
    if (a.date > b.date) return -1
    return 0
  })

  return NextResponse.json({ records: sorted })
}
