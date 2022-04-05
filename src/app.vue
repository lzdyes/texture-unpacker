<template lang="pug">
Upload
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api/tauri'
import { onMounted } from 'vue'
import Upload from './components/upload/index.vue'

onMounted(() => {
  invoke('close_splashscreen')
})
</script>
