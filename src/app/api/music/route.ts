import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET() {
  const musicDir = path.join(process.cwd(), 'public/music')
  const files = fs.readdirSync(musicDir)
  const mp3s = files.filter(f => f.endsWith('.mp3'))
  return NextResponse.json(mp3s)
}
