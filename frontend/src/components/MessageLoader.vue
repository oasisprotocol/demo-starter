<template>
  <ContentLoader viewBox="0 0 768 35" :speed="2" primaryColor="white" secondaryColor="#e3e3e3">
    <rect x="5" y="10" rx="3" ry="3" width="361" height="28" />
    <circle cx="615" cy="25" r="10" />
    <rect x="640" y="16" rx="0" ry="0" width="110" height="19" />
  </ContentLoader>
</template>

<script setup lang="ts">
import { ContentLoader } from 'vue-content-loader';
</script>

<style scoped lang="postcss"></style>
