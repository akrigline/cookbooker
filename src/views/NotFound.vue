<script setup>
defineProps({
  message: {
    type: String,
    default: "The page you're looking for doesn't exist.",
  },
})
</script>

<template>
  <main id="cm-main" style="max-width:640px; margin:0 auto; padding:100px 32px; text-align:center;">
    <h1 style="font-family:'Newsreader',Georgia,serif; font-size:32px; font-weight:600; margin:0 0 12px; letter-spacing:-0.01em;">Not found</h1>
    <p style="margin:0 0 28px; font-size:15px; color:var(--gray-46); line-height:1.5;">{{ message }}</p>
    <router-link to="/" class="btn-primary" style="display:inline-flex; align-items:center; background:var(--gray-20); color:var(--gray-99); border:none; border-radius:8px; padding:11px 20px; font-size:14px; font-weight:600; text-decoration:none;">
      Back to Dashboard
    </router-link>
  </main>
</template>
