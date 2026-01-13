import { promises as fs } from 'fs'
import path from 'path'

export type Role = 'EMPLOYEE' | 'ADMIN'

export interface EmployeeRecord {
  id: string
  name: string
  password: string
  role: Role
  nik?: string
  bpjs?: string
  phone?: string
  email?: string
  position?: string
  department?: string
  location?: string
  employmentType?: string
  joinDate?: string
}

const filePath = path.join(process.cwd(), 'data', 'employees.json')

async function readFile(): Promise<EmployeeRecord[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    if (!content.trim()) return []
    return JSON.parse(content)
  } catch {
    return []
  }
}

async function writeFile(data: EmployeeRecord[]) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getAllEmployees(): Promise<EmployeeRecord[]> {
  return readFile()
}

export async function saveEmployees(records: EmployeeRecord[]): Promise<void> {
  await writeFile(records)
}

