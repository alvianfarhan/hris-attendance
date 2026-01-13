import { promises as fs } from 'fs'
import { join } from 'path'

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  leaveType: 'Cuti' | 'Sakit' | 'Izin'
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  approvedBy?: string
  approvalDate?: string
  rejectionReason?: string
}

export interface LeaveQuota {
  employeeId: string
  year: number
  totalQuota: number
  used: number
  remaining: number
}

const leaveFilePath = join(process.cwd(), 'data', 'leaves.json')
const quotaFilePath = join(process.cwd(), 'data', 'leave-quotas.json')

export async function getAllLeaves(): Promise<LeaveRequest[]> {
  try {
    const content = await fs.readFile(leaveFilePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function saveLeaves(leaves: LeaveRequest[]): Promise<void> {
  await fs.writeFile(leaveFilePath, JSON.stringify(leaves, null, 2))
}

export async function getAllQuotas(): Promise<LeaveQuota[]> {
  try {
    const content = await fs.readFile(quotaFilePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function saveQuotas(quotas: LeaveQuota[]): Promise<void> {
  await fs.writeFile(quotaFilePath, JSON.stringify(quotas, null, 2))
}

export async function getEmployeeQuota(
  employeeId: string,
  year: number
): Promise<LeaveQuota | null> {
  const quotas = await getAllQuotas()
  return quotas.find((q) => q.employeeId === employeeId && q.year === year) || null
}