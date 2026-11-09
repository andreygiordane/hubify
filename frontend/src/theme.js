import { useEffect, useState } from 'react';

// Tema: 'light' | 'dark' (padrão) | 'system', salvo por navegador
const KEY = 'hubify_theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

const read = () => {
  try { return localStorage.getItem(KEY) || 'dark'; } catch { return 'dark'; }
};

const apply = (pref) => {
  const dark = pref === 'dark' || (pref === 'system' && media.matches);
  document.documentElement.classList.toggle('dark', dark);
};

// Aplica antes do primeiro render para não piscar o tema errado
apply(read());

const listeners = new Set();
media.addEventListener('change', () => { if (read() === 'system') apply('system'); });

export function setTheme(pref) {
  try { localStorage.setItem(KEY, pref); } catch {}
  apply(pref);
  listeners.forEach(fn => fn(pref));
}

export function useTheme() {
  const [theme, setState] = useState(read);
  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);
  return [theme, setTheme];
}
