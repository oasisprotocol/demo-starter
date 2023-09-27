<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <AppHeader />

  <main class="py-5 px-2 m-auto max-w-screen-md lg:px-0">
    <RouterView el="main" />
  </main>
</template>

<style lang="postcss"></style>
