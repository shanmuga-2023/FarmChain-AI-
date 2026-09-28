// ============================================
// FarmChain — Theme Management System
// Robust Dark / Light Mode with SVG Icon Sync
// ============================================

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') ||
         localStorage.getItem('farmchain-theme') ||
         'light';
}

export function updateAllThemeIcons() {
  const isDark = getCurrentTheme() === 'dark';
  
  // Update all sun icons (visible in dark mode to switch to light)
  document.querySelectorAll('#theme-icon-sun, .theme-icon-sun').forEach(sun => {
    sun.style.display = isDark ? 'block' : 'none';
  });

  // Update all moon icons (visible in light mode to switch to dark)
  document.querySelectorAll('#theme-icon-moon, .theme-icon-moon').forEach(moon => {
    moon.style.display = isDark ? 'none' : 'block';
  });

  // Also update any theme toggle buttons with aria-pressed / title
  document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn, [data-action="toggle-theme"]').forEach(btn => {
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
}

export function initTheme() {
  const savedTheme = localStorage.getItem('farmchain-theme');
  const theme = savedTheme === 'dark' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', theme);
  if (document.body) {
    document.body.setAttribute('data-theme', theme);
  }
  
  if (!savedTheme) {
    localStorage.setItem('farmchain-theme', 'light');
  }

  // Ensure icons reflect initial state once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAllThemeIcons);
  } else {
    updateAllThemeIcons();
  }
}

export function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', newTheme);
  }
  localStorage.setItem('farmchain-theme', newTheme);
  
  updateAllThemeIcons();
  
  // Re-render any active components that rely on js-theme logic
  window.dispatchEvent(new CustomEvent('farmchain:theme_changed', { detail: { theme: newTheme } }));
  
  return newTheme;
}
