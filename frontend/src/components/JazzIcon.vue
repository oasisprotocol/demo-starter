<script lang="ts" setup>
// @ts-expect-error
import createJazzicon from '@metamask/jazzicon';
import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{ address: string; size?: number }>();
const seed = computed(() => Number.parseInt(props.address.slice(2, 10), 16));

const icon = ref(document.createElement('div')) as Ref<HTMLElement>;

watch([icon, seed, props], ([icon, seed, props]) => {
  const jazzicon = createJazzicon(props.size ?? 35, seed);
  icon.innerHTML = '';
  icon.appendChild(jazzicon);
  icon.style.width = jazzicon.style.width;
  icon.style.height = jazzicon.style.height;
});
</script>

<template>
  <div ref="icon" class="inline-block" />
</template>
