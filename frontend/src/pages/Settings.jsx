import React, { useEffect, useRef, useState } from 'react';
import { User, Lock, Mic, Palette, Bell, LogOut, ChevronLeft, ChevronRight, X, Video, Volume2, Sun, Moon, Monitor, Check, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../theme';
import { usePrefs, audioConstraints, videoConstraints, canChooseOutput } from '../media/prefs';
import SettingsProfile from './SettingsProfile';

const SECTIONS = [
  { group: 'Usuário', items: [
    { id: 'profile', label: 'Meu perfil', icon: User },
    { id: 'security', label: 'Senha e segurança', icon: Lock },
  ] },
  { group: 'Aplicativo', items: [
    { id: 'voice', label: 'Voz e vídeo', icon: Mic },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ] },
];
const ALL = SECTIONS.flatMap(s => s.items);

export default function Settings() {
  const { logout } = useAuth();
  const { setView } = useChat();
  const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;
  const [section, setSection] = useState(() => (isDesktop() ? 'profile' : null));
  const current = ALL.find(s => s.id === section);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isDesktop()) setView('chat'); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-surface">
      {/* Menu de seções */}
      <nav className={`w-full md:w-[260px] lg:w-[300px] shrink-0 bg-subtle ${section && !isDesktop() ? 'hidden' : 'flex'} flex-col md:items-end`}>
        <div className="w-full md:w-[220px] px-3 md:px-2 py-4 md:py-14 overflow-y-auto custom-scrollbar pb-24 md:pb-6">
          <h1 className="md:hidden text-xl font-bold text-ink px-2 mb-4">Configurações</h1>
          {SECTIONS.map(group => (
            <div key={group.group} className="mb-4">
              <p className="px-2.5 mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-3">{group.group}</p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 md:py-1.5 rounded-md text-[15px] md:text-sm font-medium transition-colors ${section === item.id ? 'bg-hover text-ink' : 'text-ink-2 hover:bg-hover/60 hover:text-ink'}`}
                >
                  <item.icon className="w-4 h-4 md:hidden" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className="w-4 h-4 md:hidden text-ink-3" />
                </button>
              ))}
            </div>
          ))}
          <div className="h-px bg-line mx-2 my-2" />
          <button onClick={logout} className="w-full flex items-center justify-between px-2.5 py-2 md:py-1.5 rounded-md text-sm font-medium text-danger hover:bg-danger-soft">
            Sair da conta <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className={`flex-1 min-w-0 overflow-y-auto custom-scrollbar ${section ? 'block' : 'hidden md:block'}`}>
        <div className="flex">
          <div className="flex-1 max-w-[740px] px-4 md:px-10 pt-4 md:pt-14 pb-24 md:pb-16">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setSection(null)} className="md:hidden icon-btn w-9 h-9 -ml-2" aria-label="Voltar"><ChevronLeft className="w-6 h-6" /></button>
              <h2 className="text-xl font-bold text-ink">{current?.label}</h2>
            </div>
            {section === 'profile' && <SettingsProfile section="profile" />}
            {section === 'security' && <SettingsProfile section="security" />}
            {section === 'voice' && <VoiceVideoSettings />}
            {section === 'appearance' && <AppearanceSettings />}
            {section === 'notifications' && <NotificationSettings />}
          </div>
          <div className="hidden md:block pt-14 pr-6">
            <button onClick={() => setView('chat')} className="flex flex-col items-center gap-1 text-ink-3 hover:text-ink group" title="Fechar (Esc)">
              <span className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center"><X className="w-5 h-5" /></span>
              <span className="text-[11px] font-semibold">ESC</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- Componentes auxiliares ---------- */

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-4 py-4 border-b border-line cursor-pointer select-none">
      <span className="flex-1">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {description && <span className="block text-sm text-ink-2 mt-0.5">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${checked ? 'bg-success' : 'bg-ink-3/50'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center transition-transform ${checked ? 'translate-x-4' : ''}`}>
          {checked ? <Check className="w-3 h-3 text-success" strokeWidth={3} /> : <X className="w-3 h-3 text-ink-3" strokeWidth={3} />}
        </span>
      </button>
    </label>
  );
}

function Select({ label, value, onChange, options, icon: Icon }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-2 mb-2">{label}</span>
      <span className="relative block">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-10 rounded-md bg-app text-ink text-sm outline-none appearance-none pr-8 focus:ring-2 focus:ring-brand/60 ${Icon ? 'pl-9' : 'pl-3'}`}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-ink-3 pointer-events-none" />
      </span>
    </label>
  );
}

const Section = ({ title, children }) => (
  <section className="mb-10">
    {title && <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-2 mb-3">{title}</h3>}
    {children}
  </section>
);

/* ---------- Voz e vídeo ---------- */

function VoiceVideoSettings() {
  const [prefs, setPrefs] = usePrefs();
  const [devices, setDevices] = useState({ audioinput: [], audiooutput: [], videoinput: [] });
  const [permission, setPermission] = useState('pending'); // pending | granted | denied
  const [micTesting, setMicTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const micStreamRef = useRef(null);
  const camStreamRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(null);

  const loadDevices = async () => {
    const list = await navigator.mediaDevices.enumerateDevices();
    const group = (kind, fallback) => list.filter(d => d.kind === kind).map((d, i) => ({ value: d.deviceId, label: d.label || `${fallback} ${i + 1}` }));
    setDevices({ audioinput: group('audioinput', 'Microfone'), audiooutput: group('audiooutput', 'Alto-falante'), videoinput: group('videoinput', 'Câmera') });
  };

  // Pede permissão uma vez para conseguir os nomes dos aparelhos
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => navigator.mediaDevices.getUserMedia({ audio: true }));
        s.getTracks().forEach(t => t.stop());
        if (!cancelled) setPermission('granted');
      } catch {
        if (!cancelled) setPermission('denied');
      }
      if (!cancelled) loadDevices();
    })();
    navigator.mediaDevices.addEventListener?.('devicechange', loadDevices);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener?.('devicechange', loadDevices);
      stopMic();
      stopCamera();
    };
  }, []);

  const stopMic = () => {
    cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    setLevel(0);
  };

  const startMic = async (p = prefs) => {
    stopMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints(p) });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 64));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      stream.getTracks()[0].addEventListener('ended', () => ctx.close());
    } catch {
      setMicTesting(false);
    }
  };

  const stopCamera = () => {
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    camStreamRef.current = null;
  };

  const startCamera = async (p = prefs) => {
    stopCamera();
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints(p) });
      camStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError('Não foi possível abrir a câmera. Verifique se outro aplicativo está usando ou se o acesso foi bloqueado.');
      setCameraOn(false);
    }
  };

  useEffect(() => { if (micTesting) startMic(prefs); else stopMic(); }, [micTesting, prefs.audioInputId, prefs.noiseSuppression, prefs.echoCancellation, prefs.autoGainControl]);
  useEffect(() => { if (cameraOn) startCamera(prefs); else stopCamera(); }, [cameraOn, prefs.videoInputId]);

  const withDefault = (list, label) => [{ value: '', label: `Padrão do sistema` }, ...list.filter(d => d.value && d.value !== 'default' && d.value !== 'communications')];
  const bars = 32;

  return (
    <div>
      {permission === 'denied' && (
        <div className="mb-6 p-3 rounded-md bg-warning/15 text-ink text-sm border border-warning/30">
          O navegador bloqueou o acesso à câmera ou ao microfone. Libere nas permissões do site (ícone de cadeado ao lado do endereço) e volte aqui.
        </div>
      )}

      <Section title="Configurações de voz">
        <div className={`grid gap-4 ${canChooseOutput ? 'md:grid-cols-2' : ''}`}>
          <Select label="Microfone" icon={Mic} value={prefs.audioInputId} onChange={(v) => setPrefs({ audioInputId: v })} options={withDefault(devices.audioinput)} />
          {canChooseOutput && (
            <Select label="Alto-falante / fone" icon={Volume2} value={prefs.audioOutputId} onChange={(v) => setPrefs({ audioOutputId: v })} options={withDefault(devices.audiooutput)} />
          )}
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-2 mb-2">Teste do microfone</p>
          <p className="text-sm text-ink-2 mb-3">Fale algo: as barras mostram o volume que os outros vão receber.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setMicTesting(v => !v)} className={micTesting ? 'btn-secondary h-9' : 'btn-primary h-9'}>
              {micTesting ? 'Parar teste' : 'Vamos testar'}
            </button>
            <div className="flex-1 flex items-center gap-[3px] h-6" aria-label="Nível do microfone">
              {Array.from({ length: bars }).map((_, i) => (
                <span key={i} className={`flex-1 h-full rounded-sm transition-colors duration-75 ${micTesting && i / bars < level ? (i / bars > 0.8 ? 'bg-warning' : 'bg-success') : 'bg-ink-3/25'}`} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Processamento de voz">
        <Toggle
          checked={prefs.noiseSuppression}
          onChange={(v) => setPrefs({ noiseSuppression: v })}
          label="Supressão de ruído"
          description="Reduz sons de fundo como teclado, ventilador e trânsito."
        />
        <Toggle
          checked={prefs.echoCancellation}
          onChange={(v) => setPrefs({ echoCancellation: v })}
          label="Cancelamento de eco"
          description="Evita que os outros escutem a própria voz saindo do seu alto-falante."
        />
        <Toggle
          checked={prefs.autoGainControl}
          onChange={(v) => setPrefs({ autoGainControl: v })}
          label="Ajuste automático de volume"
          description="Equilibra o volume da sua voz se você se afastar ou aproximar do microfone."
        />
        <p className="text-xs text-ink-3 mt-3">As mudanças valem a partir da próxima chamada.</p>
      </Section>

      <Section title="Configurações de vídeo">
        <div className="rounded-lg bg-app overflow-hidden aspect-video max-w-xl flex items-center justify-center relative">
          {cameraOn ? (
            <video ref={(el) => { videoRef.current = el; if (el && camStreamRef.current) el.srcObject = camStreamRef.current; }} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          ) : (
            <div className="text-center px-6">
              <Video className="w-10 h-10 text-ink-3 mx-auto mb-3" strokeWidth={1.5} />
              <button onClick={() => setCameraOn(true)} className="btn-primary h-9">Testar vídeo</button>
              {cameraError && <p className="text-sm text-danger mt-3">{cameraError}</p>}
            </div>
          )}
          {cameraOn && (
            <button onClick={() => setCameraOn(false)} className="absolute bottom-3 right-3 btn-secondary h-8">Parar vídeo</button>
          )}
        </div>
        <div className="max-w-xl mt-4">
          <Select label="Câmera" icon={Video} value={prefs.videoInputId} onChange={(v) => setPrefs({ videoInputId: v })} options={withDefault(devices.videoinput)} />
        </div>
      </Section>
    </div>
  );
}

/* ---------- Aparência ---------- */

function AppearanceSettings() {
  const [theme, setTheme] = useTheme();
  const options = [
    { id: 'dark', label: 'Escuro', icon: Moon, preview: ['#1e1f22', '#2b2d31', '#313338', '#6773f5'] },
    { id: 'light', label: 'Claro', icon: Sun, preview: ['#e3e5e8', '#f8f9fa', '#ffffff', '#5865f2'] },
    { id: 'system', label: 'Sistema', icon: Monitor, preview: null },
  ];
  return (
    <Section title="Tema">
      <div className="grid grid-cols-3 gap-3 max-w-xl">
        {options.map(o => (
          <button key={o.id} onClick={() => setTheme(o.id)} className={`rounded-lg border-2 p-2 text-left transition-colors ${theme === o.id ? 'border-brand' : 'border-line hover:border-ink-3'}`}>
            <span className="block aspect-[4/3] rounded-md overflow-hidden mb-2">
              {o.preview ? (
                <span className="flex h-full" style={{ background: o.preview[2] }}>
                  <span className="w-1/5 h-full" style={{ background: o.preview[0] }} />
                  <span className="w-1/3 h-full" style={{ background: o.preview[1] }} />
                  <span className="flex-1 p-2 space-y-1.5">
                    <span className="block h-1.5 w-3/4 rounded" style={{ background: o.preview[3] }} />
                    <span className="block h-1.5 w-1/2 rounded opacity-40" style={{ background: o.preview[3] }} />
                  </span>
                </span>
              ) : (
                <span className="flex h-full"><span className="flex-1" style={{ background: '#313338' }} /><span className="flex-1" style={{ background: '#ffffff' }} /></span>
              )}
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-ink"><o.icon className="w-4 h-4" /> {o.label}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-2 mt-3">"Sistema" acompanha o tema claro/escuro do seu computador ou celular.</p>
    </Section>
  );
}

/* ---------- Notificações ---------- */

function NotificationSettings() {
  const [prefs, setPrefs] = usePrefs();
  const playTest = () => { const a = new Audio('/audio/notificacao.mp3'); a.play().catch(() => {}); };
  return (
    <Section>
      <Toggle
        checked={prefs.notificationSound}
        onChange={(v) => setPrefs({ notificationSound: v })}
        label="Som de novas mensagens"
        description="Toca um aviso sonoro quando chega mensagem em uma conversa que não está silenciada."
      />
      <button onClick={playTest} className="btn-secondary h-9 mt-4"><Play className="w-4 h-4" /> Ouvir o som</button>
      <p className="text-sm text-ink-2 mt-6">Para silenciar só uma conversa, use o menu dela no Chat → <b className="text-ink">Silenciar</b>.</p>
    </Section>
  );
}
