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

  const attachment = await prisma.requestAttachment.findUnique({
    where: { id },
    include: { request: true },
  })

  if (!attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!canViewRequest(user, attachment.request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const filePath = attachment.path.startsWith('storage/')
      ? getStoragePath(attachment.path)
      : getStoragePath(pathJoinLegacy(attachment.path))

    const data = await readFile(filePath)
    const headers = new Headers()
    headers.set('Content-Type', attachment.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`)

    return new NextResponse(data, { status: 200, headers })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

function pathJoinLegacy(publicPath: string): string {
  if (publicPath.startsWith('/uploads/')) {
    return `public${publicPath}`
  }
  return publicPath
}
