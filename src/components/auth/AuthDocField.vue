<script setup>
import { computed } from 'vue'
import dottedLine from '@/assets/auth/dotted-line.svg'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
  maskPassword: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const isMaskedPassword = computed(() => props.maskPassword && props.type === 'password')
</script>

<template>
  <label
    :for="id"
    class="flex w-full flex-col gap-0.5"
    :class="disabled ? 'pointer-events-none opacity-50' : ''"
  >
    <span class="font-serif text-[9px] text-[var(--auth-doc-label)]">{{ label }}</span>
    <div class="relative min-h-[28px] w-full">
      <input
        v-if="isMaskedPassword"
        :id="id"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        required
        class="auth-doc-field__password w-full bg-transparent font-mono text-[14px] font-bold leading-none tracking-[0.12em] text-[var(--auth-hand)] caret-[var(--auth-hand)] outline-none placeholder:opacity-35 disabled:cursor-not-allowed"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <template v-else>
        <input
          :id="id"
          :type="type"
          :value="modelValue"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :disabled="disabled"
          required
          class="absolute inset-0 z-10 w-full bg-transparent font-serif text-[20px] font-bold leading-none text-transparent caret-[var(--auth-hand)] outline-none disabled:cursor-not-allowed"
          @input="$emit('update:modelValue', $event.target.value)"
        />
        <span
          class="pointer-events-none block font-serif text-[20px] font-bold leading-none text-[var(--auth-hand)]"
          :class="modelValue ? '' : 'opacity-35'"
          aria-hidden="true"
        >
          {{ modelValue || placeholder }}
        </span>
      </template>
      <img :src="dottedLine" alt="" class="mt-0.5 block h-px w-full max-w-none" />
    </div>
  </label>
</template>

<style scoped>
.auth-doc-field__password {
  -webkit-text-security: disc;
  text-security: disc;
}
</style>
