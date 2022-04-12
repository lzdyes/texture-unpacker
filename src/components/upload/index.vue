<template lang="pug" src="./index.pug"></template>
<style scoped lang="stylus" src="./index.styl"></style>
<script setup lang="ts">
import type { Plist } from '@/utils'
import { extname, parseFrame, parsePlist, parseSize } from '@/utils'
import { dialog, fs } from '@tauri-apps/api'
import { Dir } from '@tauri-apps/api/fs'
import { ref } from 'vue'

const upload = ref<HTMLDivElement>()
const darging = ref(false)

const onUploadClick = async () => {
  const filePaths = (await dialog.open({ multiple: true, filters: [{ name: '', extensions: ['plist', 'png'] }] })) as Array<string>

  let plist: Plist | undefined, buffer: Uint8Array | undefined

  for (const filePath of filePaths) {
    const extension = extname(filePath)
    switch (extension) {
      case '.plist':
        const str = await fs.readTextFile(filePath)
        plist = parsePlist(str)
        break
      case '.png':
        buffer = await fs.readBinaryFile(filePath)
        break
    }
  }

  if (plist && buffer) {
    cropImages(plist, buffer)
  }
}

const onDragEnter = (e: DragEvent) => {
  e.preventDefault()
  if (upload.value === e.target && !upload.value.contains(e.relatedTarget as Node)) {
    darging.value = true
  }
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  if (upload.value === e.target && !upload.value.contains(e.relatedTarget as Node)) {
    darging.value = false
  }
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const readTextFile = (file: File) => {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onloadend = async ({ target }) => resolve(target?.result as string)
    reader.readAsText(file)
  })
}

const readBinaryFile = (file: File) => {
  return new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader()
    reader.onloadend = async ({ target }) => resolve(target?.result as ArrayBuffer)
    reader.readAsArrayBuffer(file)
  })
}

const onDrop = async (e: DragEvent) => {
  e.preventDefault()
  darging.value = false

  if (e.dataTransfer) {
    const { files } = e.dataTransfer

    let plist: Plist | undefined, buffer: ArrayBuffer | undefined

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const extension = extname(file.name)
      switch (extension) {
        case '.plist':
          const str = await readTextFile(file)
          plist = parsePlist(str)
          break
        case '.png':
          buffer = await readBinaryFile(file)
          break
      }
    }

    if (plist && buffer) {
      cropImages(plist, buffer)
    }
  }
}

const cropImages = async (plist: Plist, buffer: Uint8Array | ArrayBuffer) => {
  const { width, height } = parseSize(plist.metadata.size)
  const blob = new Blob([buffer])
  const imageBitmap = await createImageBitmap(blob)

  const originCanvas = document.createElement('canvas')
  originCanvas.width = width
  originCanvas.height = height

  const originContext = originCanvas.getContext('2d')
  originContext?.drawImage(imageBitmap, 0, 0)

  Object.keys(plist.frames).forEach(async (key) => {
    const { rect, size, offset, rotated } = parseFrame(plist, key)
    const imageData = originContext?.getImageData(rect.x, rect.y, rotated ? rect.height : rect.width, rotated ? rect.width : rect.height)

    const cropCanvas = document.createElement('canvas')
    const cropContext = cropCanvas.getContext('2d')
    cropCanvas.width = rect.width
    cropCanvas.height = rect.height

    if (imageData) {
      const imageBitmap = await createImageBitmap(imageData)
      if (rotated) {
        cropContext?.translate(0, rect.height)
        cropContext?.rotate((-90 * Math.PI) / 180)
      }
      cropContext?.drawImage(imageBitmap, 0, 0)

      const imageData2 = cropContext?.getImageData(0, 0, rect.width, rect.height)
      if (imageData2) {
        cropCanvas.width = size.width
        cropCanvas.height = size.height
        cropContext?.putImageData(imageData2, offset.x, offset.y)

        cropCanvas.toBlob(async (blob) => {
          if (blob) {
            const arrayBuffer = await blob.arrayBuffer()
            const contents = new Uint8Array(arrayBuffer)
            fs.writeBinaryFile({ path: key, contents }, { dir: Dir.Desktop })
          }
        })
      }
    }
  })
}
</script>
