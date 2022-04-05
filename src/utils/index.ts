import plist from 'plist'

interface Frames {
  [key: string]: {
    /** format 2 */
    frame: string
    offset: string
    rotated: boolean
    sourceColorRect: string
    sourceSize: string

    /** format 3 */
    aliases: Array<string>
    spriteOffset: string
    spriteSize: string
    spriteSourceSize: string
    textureRect: string
    textureRotated: boolean
  }
}

interface Metadata {
  format: number
  size: string
  smartupdate: string
  realTextureFileName: string
  textureFileName: string
}

export interface Plist {
  frames: Frames
  metadata: Metadata
}

export const parsePlist = (str: string) => {
  return plist.parse(str) as unknown as Plist
}

export const parseRect = (frame: string) => {
  const str = frame.replace(/{/g, '[').replace(/}/g, ']')
  const [[x, y], [width, height]] = JSON.parse(str)
  return { x, y, width, height }
}

export const parseSize = (size: string) => {
  const str = size.replace(/{/g, '[').replace(/}/g, ']')
  const [width, height] = JSON.parse(str)
  return { width, height }
}

export const parseOffset = (offset: string) => {
  const str = offset.replace(/{/g, '[').replace(/}/g, ']')
  const [x, y] = JSON.parse(str)
  return { x, y }
}

export const parseFrame = (plist: Plist, key: string) => {
  let rect = { x: 0, y: 0, width: 0, height: 0 }
  let size = { width: 0, height: 0 }
  let offset = { x: 0, y: 0 }
  let rotated = false

  switch (plist.metadata.format) {
    case 2:
      {
        const { frame, rotated: _rotated, sourceColorRect, sourceSize } = plist.frames[key]
        rect = parseRect(frame)
        size = parseSize(sourceSize)
        offset = parseRect(sourceColorRect)
        rotated = _rotated
      }
      break
    case 3:
      {
        const { textureRect, textureRotated, spriteSourceSize, spriteOffset } = plist.frames[key]
        rect = parseRect(textureRect)
        size = parseSize(spriteSourceSize)
        offset = parseOffset(spriteOffset)
        rotated = textureRotated
      }
      break
  }

  return { rect, size, offset, rotated }
}
