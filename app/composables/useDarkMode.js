// Path: /composables/useDarkMode.js

export const useDarkMode = () => {
  const darkMode = ref(false)

  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value

    if (import.meta.client) {
      localStorage.setItem('kylva-theme', darkMode.value ? 'dark' : 'light')

      if (darkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const initDarkMode = () => {
    if (import.meta.client) {
      const savedTheme = localStorage.getItem('kylva-theme')

      if (savedTheme === 'dark') {
        darkMode.value = true
        document.documentElement.classList.add('dark')
      } else {
        darkMode.value = false
        document.documentElement.classList.remove('dark')
      }
    }
  }

  onMounted(() => {
    initDarkMode()
  })

  return {
    darkMode,
    toggleDarkMode
  }
}