/* indexcontent.js */
"use strict";

document.addEventListener('DOMContentLoaded', () => {
  loadSitePreferences();  
  loadAbout();
  loadResearch();
  loadPublications();
  loadProjects();
  loadTechnologies();
});

function applyThemeFromPreferences(theme) {
  if (!theme) return;
  const root = document.documentElement;
  const c = theme.colors || {};

  const apply = (keys, vars) => {
    const value = keys.map((key) => c[key]).find(Boolean);
    if (!value) return;
    vars.forEach((cssVar) => root.style.setProperty(cssVar, value));
  };

  // Descriptive keys (preferred) + legacy keys (fallback)
  apply(['pageBg', 'background'], ['--page-bg', '--background-color', '--color-bg']);
  apply(['surface', 'surfaceBg'], ['--surface-color', '--color-surface']);
  apply(['surfaceAlt', 'surfaceAltBg', 'tileBg'], ['--surface-alt-color', '--color-surface-2', '--tile-bg']);
  apply(['textBody', 'default'], ['--text-color', '--default-color', '--color-text']);
  apply(['textHeading', 'heading'], ['--heading-color', '--color-heading']);
  apply(['textMuted', 'mutedText'], ['--text-muted-color', '--muted-text-color', '--color-text-muted']);
  apply(['textSubtle', 'softText'], ['--text-subtle-color', '--soft-text-color', '--color-text-subtle']);
  apply(['border'], ['--border-color', '--color-border']);

  apply(['accent'], ['--accent-color', '--bright-accent']);
  apply(['accentOn', 'contrast'], ['--accent-contrast-color', '--contrast-color', '--color-on-accent']);

  apply(['navText', 'nav'], ['--nav-text-color', '--nav-color']);
  apply(['navTextHover', 'navHover'], ['--nav-text-hover-color', '--nav-hover-color']);
  apply(['navBg', 'navPanelBg', 'navMobileBg'], ['--nav-bg-color', '--nav-bg', '--dark-accent']);
  apply(['navToggleBg'], ['--nav-toggle-bg-color']);

  apply(['footerBg'], ['--footer-bg-color']);
  apply(['sectionAltBg'], ['--section-alt-bg', '--section-alt-bg-color']);

  apply(['badgeBg'], ['--badge-bg']);
  apply(['heroOverlayStart'], ['--hero-overlay-start']);
  apply(['heroOverlayEnd'], ['--hero-overlay-end']);
}

function setSectionHeadings(sections) {
  if (!sections) return;
  const map = {
    mywork: '#mywork .section-title h2',
    projects: '#projects .section-title h2',
    technologies: '#technologies .section-title h2',
    cv: '#cv .section-title h2',
    publications: '#publications .section-title h2',
    resources: '#resources .section-title h2'
  };
  Object.entries(map).forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el && sections[key]) el.textContent = sections[key];
  });
}

function loadSitePreferences() {
  fetch('assets/data/site-preferences.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(prefs => {
      applyThemeFromPreferences(prefs.theme);
      setSectionHeadings(prefs.sections);
    })
    .catch(err => console.error('Failed to load site-preferences.json', err));
}
