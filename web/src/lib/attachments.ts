import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'uploads')

export function getStoragePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath)
}

export async function savePrivateFile(
  subdir: string,
  originalName: string,
  buffer: Buffer
): Promise<string> {
  const uploadDir = path.join(STORAGE_ROOT, subdir)
  await mkdir(uploadDir, { recursive: true })

  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniqueName = `${Date.now()}-${safeName}`
  const relativePath = path.join('storage', 'uploads', subdir, uniqueName)
  const absolutePath = path.join(process.cwd(), relativePath)

  await writeFile(absolutePath, buffer)
  return relativePath.replace(/\\/g, '/')
}
