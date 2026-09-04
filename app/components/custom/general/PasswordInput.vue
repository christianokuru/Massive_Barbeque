<script setup lang="ts">
import { Eye, EyeOff } from "lucide-vue-next";

interface Props {
  id?: string;
  required?: boolean;
  minlength?: number | string;
  placeholder?: string;
  autocomplete?: string;
}

withDefaults(defineProps<Props>(), {
  autocomplete: "current-password",
});

const model = defineModel<string>({ required: true });
const visible = ref(false);
</script>

<template>
  <span class="relative block">
    <input
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :id="id"
      :required="required"
      :minlength="minlength"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      class="w-full rounded border border-gray-300 px-3 py-2 pr-10"
    />
    <button
      type="button"
      @click="visible = !visible"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-800"
    >
      <EyeOff v-if="visible" class="h-5 w-5" />
      <Eye v-else class="h-5 w-5" />
    </button>
  </span>
</template>
