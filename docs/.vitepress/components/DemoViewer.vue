<template>
  <div class="demo-viewer-wrapper">
    <div :id="containerId" class="pdf-viewer-container" :style="{ height: height }"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  height: {
    type: String,
    default: '500px'
  }
});

const containerId = `demo-viewer-${Math.random().toString(36).substr(2, 9)}`;
let viewerInstance = null;

onMounted(async () => {
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid SSR issues
      const { PdfViewerKit } = await import('../../../dist/pdfkitviewer.es.js');
      
      // Setup worker
      const pdfjs = await import('pdfjs-dist/build/pdf');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

      // Import styles
      await import('../../../dist/pdf-viewer-kit.css');

      viewerInstance = await PdfViewerKit.load({
        containerId: containerId,
        document: props.src,
        enableTiling: true,
        tileConfig: {
          tileSize: 512,
          progressiveRendering: true
        },
        toolbarOptions: {
          showThumbnail: true,
          showDownload: true,
          showZoom: true,
          showSearch: true
        }
      });
      
      console.log('Demo Viewer initialized');
    } catch (e) {
      console.error('Failed to load demo viewer:', e);
    }
  }
});

onBeforeUnmount(async () => {
  if (viewerInstance) {
    try {
      const { PdfViewerKit } = await import('../../../dist/pdfkitviewer.es.js');
      await PdfViewerKit.unload(viewerInstance.instanceId);
    } catch (e) {
      console.error('Failed to cleanup viewer:', e);
    }
  }
});
</script>

<style scoped>
.demo-viewer-wrapper {
  margin: 2rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background-color: #f4f4f4;
}

.pdf-viewer-container {
  width: 100%;
  background-color: #525659; /* Standard PDF viewer bg color */
  position: relative;
}
</style>
