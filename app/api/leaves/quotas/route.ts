import { NextRequest, NextResponse } from 'next/server'
import {
  getEmployeeQuota,
  getAllQuotas,
  saveQuotas,
  LeaveQuota,
} from '../fileStore'

// GET: ambil quota karyawan
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const year = url.searchParams.get('year')

    if (!employeeId || !year) {
      return NextResponse.json(
        { error: 'employeeId dan year wajib diisi' },
        { status: 400 }
      )
    }

    const quota = await getEmployeeQuota(employeeId, parseInt(year))

    if (!quota) {
      return NextResponse.json(
        { error: 'Quota tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quota })
  } catch (e) {
    console.error('Get quota error:', e)
    return NextResponse.json(
      { error: 'Server error saat mengambil quota' },
      { status: 500 }
    )
  }
}

// POST: buat/set quota karyawan (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, year, totalQuota } = body

    if (!employeeId || !year || totalQuota === undefined) {
      return NextResponse.json(
        { error: 'Field wajib tidak boleh kosong' },
        { status: 400 }
      )
    }

    const quotas = await getAllQuotas()
    const idx = quotas.findIndex(
      (q) => q.employeeId === employeeId && q.year === year
    )

    const newQuota: LeaveQuota = {
      employeeId,
      year,
      totalQuota,
      used: 0,
      remaining: totalQuota,
    }

    if (idx !== -1) {
      quotas[idx] = newQuota
    } else {
      quotas.push(newQuota)
    }

    await saveQuotas(quotas)

    return NextResponse.json(
      { success: true, quota: newQuota },
      { status: 201 }
    )
  } catch (e) {
    console.error('Post quota error:', e)
    return NextResponse.json(
      { error: 'Server error saat set quota' },
      { status: 500 }
    )
  }
}