import plist from 'plist'

interface Frames {
  [key: string]: {
    frame: string
    offset: string
    rotated: boolean
    sourceColorRect: string
    sourceSize: string
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

export const cropImage = (buffer: ArrayBuffer | Uint8Array, x: number, y: number, width: number, height: number) => {
  return new Promise<Uint8Array>(async (resolve) => {
    const blob = new Blob([buffer])
    const imageBitmap = await createImageBitmap(blob)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    context?.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height)

    canvas.toBlob(async (blob) => {
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)
        resolve(buffer)
      }
    })
  })
}
