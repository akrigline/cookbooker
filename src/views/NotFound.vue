<script setup>
defineProps({
  message: {
    type: String,
    default: "The page you're looking for doesn't exist.",
  },
})
</script>

<template>
  <main id="cm-main" class="cm-page-main cm-page-main--compact">
    <h1 class="text-page-title--compact">Not found</h1>
    <p style="margin:0 0 28px; font-size:15px; color:var(--gray-46); line-height:1.5;">{{ message }}</p>
    <router-link to="/" class="btn-primary" style="display:inline-flex; align-items:center; background:var(--gray-20); color:var(--gray-99); border:none; border-radius:8px; padding:11px 20px; font-size:14px; font-weight:600; text-decoration:none;">
      Back to Dashboard
    </router-link>
  </main>
</template>
