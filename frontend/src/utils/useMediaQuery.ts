import { onMounted, onUnmounted, ref } from 'vue';

export function useMedia(query: string) {
  let mediaQuery!: MediaQueryList;

  const matches = ref(mediaQuery ? mediaQuery.matches : false);
  function handler(event: MediaQueryListEvent) {
    matches.value = event.matches;
  }

  onMounted(() => {
    if (!mediaQuery) {
      mediaQuery = window.matchMedia(query);
    }

    matches.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', handler, {
      capture: false,
    });
  });

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handler);
  });

  return matches;
}
