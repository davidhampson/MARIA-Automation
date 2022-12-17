<template>
  <input v-model="input" @blur="$emit('update:modelValue', input)">
</template>

<script>
export default {
  name: "UpdateOnBlur",
  props: ['modelValue'],
  emits: ['update:modelValue'],
  data() {
    return {
      input: '',
      focus: false
    }
  },
  created() {
    this.input = this.modelValue;
  },
  watch: {
    modelValue(val) {
      this.input = val;
    },
  }
}
</script>

<style scoped>

</style>