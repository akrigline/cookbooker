<script setup>
</script>

<template>
  <div style="min-height:100vh; background:var(--gray-96); font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif; color:var(--gray-20);">
    <a href="#cm-main" class="cm-skip-link" style="position:absolute; left:12px; top:-60px; transform:translateY(-100px); background:var(--gray-20); color:white; padding:10px 16px; border-radius:6px; z-index:100; text-decoration:none; font-size:14px; font-weight:600; transition:transform 0.15s;">Skip to main content</a>
    <header class="cm-app-chrome" style="border-bottom:1px solid var(--gray-88); background:var(--gray-99);">
      <div style="max-width:1280px; margin:0 auto; padding:16px 32px; display:flex; align-items:center; gap:28px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span aria-hidden="true" style="width:28px; height:28px; border-radius:7px; background:var(--gray-20); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-96)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </span>
          <span style="font-family:'Newsreader',Georgia,serif; font-size:20px; font-weight:600; letter-spacing:-0.01em;">Cookbooker</span>
        </div>
        <nav aria-label="Primary" style="display:flex; gap:4px;">
          <router-link to="/" class="nav-link" active-class="nav-active">Cookbooks</router-link>
          <router-link to="/library" class="nav-link" active-class="nav-active">Recipe Library</router-link>
          <router-link to="/settings" class="nav-link" active-class="nav-active">Settings</router-link>
        </nav>
      </div>
    </header>

    <router-view />
  </div>
</template>

<style>
::selection { background: oklch(85% 0.05 250); }
.cm-skip-link:focus { transform: translateY(0) !important; }

.nav-link {
  text-decoration:none; 
  font-size:14px; 
  font-weight:600; 
  padding:8px 12px; 
  border-radius:7px; 
  color:var(--gray-42);
}
.nav-link:hover {
  background:var(--gray-93);
}
.nav-active {
  background:oklch(93% 0.02 250) !important; 
  color:oklch(30% 0.1 250) !important;
}
</style>
