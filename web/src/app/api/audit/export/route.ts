import { exportAuditCsv } from '@/app/audit/actions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const csv = await exportAuditCsv()
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="audit_log.csv"',
      },
    })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 403 })
  }
}
