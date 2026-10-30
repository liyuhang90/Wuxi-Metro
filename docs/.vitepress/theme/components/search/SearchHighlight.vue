<script setup lang="ts">
import { computed } from 'vue'
import { highlightParts } from '../../../search/shared'
const props = defineProps<{ text: string; terms: string[] }>()
const parts = computed(() => highlightParts(props.text, props.terms))
</script>

<template>
  <template v-for="(part, index) in parts" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template>
</template>
