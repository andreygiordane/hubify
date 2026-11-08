import { useEffect } from 'react';

// Altura útil da tela. No celular usa a área visível (descontando o teclado virtual),
// para que o campo de mensagem fique sempre acima do teclado.
// Também guarda a altura do teclado em --kb-height, usada pelo painel de emojis
// para ocupar exatamente o lugar do teclado.
export const useViewportHeight = () => {
  useEffect(() => {
    const vv = window.visualViewport;
    let saved = 0;
    try { saved = parseInt(localStorage.getItem('hubify_kb_height') || '0', 10); } catch {}
    if (saved) document.documentElement.style.setProperty('--kb-height', `${saved}px`);

    const update = () => {
      const height = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);

      const keyboard = window.innerHeight - height;
      if (keyboard > 150) {
        document.documentElement.style.setProperty('--kb-height', `${Math.round(keyboard)}px`);
        try { localStorage.setItem('hubify_kb_height', String(Math.round(keyboard))); } catch {}
      }
      // iOS rola a página ao focar um campo; o app é fixo, então volta ao topo
      if (window.scrollY) window.scrollTo(0, 0);
    };

    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
};
