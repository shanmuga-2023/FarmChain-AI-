// Theme Management System
export function initTheme() {
  const savedTheme = localStorage.getItem("farmchain-theme");
  
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    // Default to light
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem("farmchain-theme", "light");
  }
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem("farmchain-theme", newTheme);
  
  // Re-render any active components that rely on js-theme logic (e.g. charts if they need it)
  // Usually CSS variables handle everything automatically.
  return newTheme;
}
