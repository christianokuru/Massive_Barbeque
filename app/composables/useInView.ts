export const useInView = (options: IntersectionObserverInit = {}) => {
  const isInView = ref(false)
  const targetRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    if (!targetRef.value) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          isInView.value = true
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px',
      }
    )

    observer.observe(targetRef.value)

    onUnmounted(() => {
      if (targetRef.value) {
        observer.unobserve(targetRef.value)
      }
    })
  })

  return {
    targetRef,
    isInView,
  }
}