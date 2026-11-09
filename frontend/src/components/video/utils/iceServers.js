import { SOCKET_URL } from '../../../config';

// Busca STUN/TURN no servidor de sinalização (credenciais TURN são temporárias)

const FALLBACK_ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
];

let cached = null;
let expiresAt = 0;
let pending = null;

export function loadIceServers() {
  if (cached && Date.now() < expiresAt) return Promise.resolve(cached);
  if (pending) return pending;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  pending = fetch(`${SOCKET_URL}/ice-servers`, { signal: controller.signal })
    .then(res => res.json())
    .then(({ iceServers, ttl }) => {
      cached = iceServers;
      // Renova na metade do TTL para não usar credenciais vencidas
      expiresAt = Date.now() + (ttl || 300) * 500;
      const hasTurn = iceServers.some(s => [].concat(s.urls).some(u => u.startsWith('turn')));
      console.log(`[WebRTC] ICE servers carregados (TURN: ${hasTurn ? 'sim' : 'NÃO'})`);
      return cached;
    })
    .catch(err => {
      console.error('[WebRTC] Falha ao buscar ICE servers, usando apenas STUN:', err);
      return FALLBACK_ICE_SERVERS;
    })
    .finally(() => {
      clearTimeout(timeout);
      pending = null;
    });

  return pending;
}

export function getIceServers() {
  return cached || FALLBACK_ICE_SERVERS;
}
