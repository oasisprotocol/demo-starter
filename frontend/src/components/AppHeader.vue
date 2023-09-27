<script setup lang="ts">
import AccountPicker from '@/components/AccountPicker.vue';
</script>

<template>
  <header class="sticky top-0">
    <nav class="bg-white border-gray-200 p-2 xl:py-4 xl:px-0">
      <div class="flex flex-wrap justify-between items-center mx-auto max-w-screen-md">
        <RouterLink to="/">
          <img src="@/assets/images/logo.svg" class="h-6 sm:h-9" alt="Oasis logo" />
        </RouterLink>
        <AccountPicker />
      </div>
    </nav>
  </header>
</template>

<style lang="postcss" scoped></style>
