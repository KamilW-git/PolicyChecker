import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { canViewRequest } from '@/lib/requestAccess'
import { getStoragePath } from '@/lib/attachments'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const override = await prisma.manualOverride.findUnique({
    where: { id },
    include: { request: true },
  })

  if (!override?.attachmentPath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!canViewRequest(user, override.request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const filePath = override.attachmentPath.startsWith('storage/')
      ? getStoragePath(override.attachmentPath)
      : getStoragePath(`public${override.attachmentPath}`)

    const data = await readFile(filePath)
    const filename = override.attachmentPath.split('/').pop() || 'attachment'
    const headers = new Headers()
    headers.set('Content-Type', 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)

    return new NextResponse(data, { status: 200, headers })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
