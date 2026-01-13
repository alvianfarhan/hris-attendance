import { promises as fs } from 'fs'
import path from 'path'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut?: string
  isLate?: boolean
}

const filePath = path.join(process.cwd(), 'data', 'attendance.json')

async function readFile(): Promise<AttendanceRecord[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    if (!content.trim()) return []
    return JSON.parse(content)
  } catch {
    // kalau file belum ada / error baca, anggap kosong
    return []
  }
}

async function writeFile(data: AttendanceRecord[]) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  return readFile()
}

export async function saveAttendance(records: AttendanceRecord[]): Promise<void> {
  await writeFile(records)
}