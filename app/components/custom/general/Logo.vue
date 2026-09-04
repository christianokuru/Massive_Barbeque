<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'white',
    validator: (value) => ['white', 'black'].includes(value)
  }
})

const fillColor = computed(() => props.variant === 'black' ? '#FF6B35' : '#FF6B35')
</script>

<template>
  <svg 
    width="200" 
    height="32" 
    viewBox="0 0 200 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    class="h-8"
  >
    <text
      x="0"
      y="24"
      :fill="fillColor"
      font-family="Arial, sans-serif"
      font-size="24"
      font-weight="bold"
      letter-spacing="0.05em"
    >
      MASSIVE BARBEQUE
    </text>
  </svg>
</template>