import React, { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Play, Pause, RotateCcw, Check, ChevronRight, Plus, Calendar, TrendingUp, Dumbbell, Users, X, ClipboardList, Volume2, VolumeX, Pencil, Trash2 } from "lucide-react";

// ---- Áudio (síntese de voz em pt-BR) ----
function speak(text, enabled) {
  if (!enabled) return;
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.error("speech error", e);
  }
}

// ---- Personagem cartoon (ilustração esquemática amigável, não é vídeo real) ----
function CartoonCharacter({ variant = "generic", active }) {
  const skin = "#E8B48C";
  const shirt = "#2F6F62";
  const shorts = "#3A3A38";
  const shoe = "#1F2E2B";
  return (
    <div style={{ width: 140, height: 160, margin: "0 auto" }}>
      <style>{`
        @keyframes cc-legraise { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-38deg); } }
        @keyframes cc-bridge { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes cc-armrot { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(55deg); } }
        @keyframes cc-bounce { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        @keyframes cc-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .cc-leg { transform-origin: 55px 95px; animation: ${active ? "cc-legraise 2.4s ease-in-out infinite" : "none"}; }
        .cc-hip { animation: ${active && variant === "bridge" ? "cc-bridge 2.4s ease-in-out infinite" : "none"}; }
        .cc-arm { transform-origin: 78px 62px; animation: ${active && variant === "arm" ? "cc-armrot 2.4s ease-in-out infinite" : "none"}; }
        .cc-body { animation: ${active && variant === "generic" ? "cc-bounce 2.4s ease-in-out infinite" : "cc-breathe 3s ease-in-out infinite"}; }
      `}</style>
      <svg viewBox="0 0 140 160" width="140" height="160">
        <g className="cc-body">
          <g className="cc-hip">
            {/* pernas */}
            <g className="cc-leg">
              <line x1="55" y1="95" x2="40" y2="130" stroke={shorts} strokeWidth="12" strokeLinecap="round" />
              <ellipse cx="36" cy="136" rx="10" ry="6" fill={shoe} />
            </g>
            <line x1="65" y1="95" x2="80" y2="130" stroke={shorts} strokeWidth="12" strokeLinecap="round" />
            <ellipse cx="84" cy="136" rx="10" ry="6" fill={shoe} />
            {/* tronco */}
            <rect x="42" y="55" width="36" height="45" rx="16" fill={shirt} />
            {/* braços */}
            <line x1="78" y1="62" x2="100" y2="85" className="cc-arm" stroke={skin} strokeWidth="10" strokeLinecap="round" />
            <line x1="42" y1="62" x2="20" y2="85" stroke={skin} strokeWidth="10" strokeLinecap="round" />
          </g>
          {/* cabeça */}
          <circle cx="60" cy="30" r="20" fill={skin} />
          <path d="M 41 24 Q 60 4 79 24" fill="#4A3324" />
          <circle cx="53" cy="30" r="2.4" fill="#1F2E2B" />
          <circle cx="67" cy="30" r="2.4" fill="#1F2E2B" />
          <path d="M 52 37 Q 60 42 68 37" stroke="#1F2E2B" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}


/*
  DESIGN TOKENS
  Color: bg #F6F5F1 (warm clinical white) | ink #1F2E2B (deep pine-teal, near-black but warm)
         primary #2F6F62 (clinical teal, trust/recovery) | primary-soft #DCEAE5
         accent #C97A3A (clay amber — motivation/progress, distinct from default terracotta)
         accent-soft #F3E1CC | line #E1DED4 | danger #B5493A
  Type: Display = 'Fraunces' (warm serif, humanist, medical-but-caring) at restrained weights
        Body = 'Inter' | Numerals/timer = 'IBM Plex Mono' (tabular, clinical stopwatch feel)
  Signature: the circular stopwatch ring with tabular mono numerals — the exercise timer
             is the single moment of visual boldness; everything else is quiet and orderly.
*/

const FONTS_LINK_ID = "hep-fonts";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONTS_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONTS_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ---- Ajuda para converter arquivos enviados em imagem/vídeo para uso no app ----
function compressImageToDataUrl(file, maxWidth = 420, quality = 0.68) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function getYouTubeEmbedId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? m[1] : null;
}
function getGoogleDriveFileId(url) {
  if (!url) return null;
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const WEEKDAYS = [
  { key: "dom", label: "Domingo", short: "Dom" },
  { key: "seg", label: "Segunda-feira", short: "Seg" },
  { key: "ter", label: "Terça-feira", short: "Ter" },
  { key: "qua", label: "Quarta-feira", short: "Qua" },
  { key: "qui", label: "Quinta-feira", short: "Qui" },
  { key: "sex", label: "Sexta-feira", short: "Sex" },
  { key: "sab", label: "Sábado", short: "Sáb" },
];
function todayKey() {
  return WEEKDAYS[new Date().getDay()].key;
}
function emptyWeek() {
  const w = {};
  WEEKDAYS.forEach((d) => { w[d.key] = []; });
  return w;
}

const DEFAULT_LIBRARY = [
  { id: uid(), name: "Bombeamento de tornozelo", category: "Tornozelo/Pé", steps: "Deitado ou sentado, mova o pé para cima e para baixo lentamente, como se estivesse pisando em um pedal.", sets: 3, reps: 15, holdSeconds: 0, restSeconds: 30, variant: "generic", videoUrl: null },
  { id: uid(), name: "Isometria de quadríceps", category: "Joelho", steps: "Deitado com a perna esticada, contraia a coxa empurrando o joelho contra a maca, como se fosse achatar uma toalha embaixo dele.", sets: 3, reps: 10, holdSeconds: 6, restSeconds: 30, variant: "generic", videoUrl: null },
  { id: uid(), name: "Elevação da perna estendida", category: "Joelho", steps: "Deitado, mantenha o joelho esticado e eleve a perna cerca de 30 cm, segure e desça devagar.", sets: 3, reps: 10, holdSeconds: 3, restSeconds: 45, variant: "legraise", videoUrl: null },
  { id: uid(), name: "Ponte (bridging)", category: "Quadril/Lombar", steps: "Deitado, joelhos dobrados, eleve o quadril até formar uma linha reta dos ombros aos joelhos.", sets: 3, reps: 12, holdSeconds: 3, restSeconds: 45, variant: "bridge", videoUrl: null },
  { id: uid(), name: "Abdução de quadril deitado", category: "Quadril", steps: "Deitado de lado, eleve a perna de cima mantendo o quadril alinhado, sem rodar o tronco.", sets: 3, reps: 12, holdSeconds: 2, restSeconds: 30, variant: "legraise", videoUrl: null },
  { id: uid(), name: "Rotação externa de ombro com faixa", category: "Ombro", steps: "Cotovelo colado ao corpo em 90°, gire o antebraço para fora contra a resistência da faixa.", sets: 3, reps: 12, holdSeconds: 0, restSeconds: 30, variant: "arm", videoUrl: null },
  { id: uid(), name: "Alongamento de cadeia posterior", category: "Flexibilidade", steps: "Sentado, incline o tronco à frente com a coluna reta até sentir alongamento atrás da coxa.", sets: 2, reps: 1, holdSeconds: 30, restSeconds: 20, variant: "generic", videoUrl: null },
  { id: uid(), name: "Marcha estacionária", category: "Equilíbrio/Geral", steps: "Em pé, alterne elevar os joelhos como se estivesse marchando no lugar, em ritmo controlado.", sets: 3, reps: 20, holdSeconds: 0, restSeconds: 30, variant: "legraise", videoUrl: null },
];

const DEFAULT_PATIENTS = [
  {
    id: uid(),
    name: "Maria Oliveira",
    condition: "Pós-operatório de LCA — joelho direito",
    weeklyPlan: emptyWeek(),
    sessions: [],
    appointments: [],
    painLogs: [],
  },
];

async function loadShared(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveShared(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("storage error", e);
    return false;
  }
}

function PainChart({ painLogs }) {
  const data = [...(painLogs || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((l) => ({ date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), dor: l.value }));
  if (data.length === 0) {
    return <p style={{ color: "#6B6558", fontSize: 14 }}>Ainda sem registros de dor (EVA) deste paciente.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid stroke="#E1DED4" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6558" }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#6B6558" }} />
        <Tooltip />
        <Line type="monotone" dataKey="dor" stroke="#C97A3A" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CircularTimer({ totalSeconds, secondsLeft, label, color = "#2F6F62" }) {
  const size = 220;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const offset = c * (1 - pct);
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E1DED4" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 44, fontWeight: 600, color: "#1F2E2B", fontVariantNumeric: "tabular-nums" }}>
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </div>
        <div style={{ fontSize: 13, color: "#6B6558", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      </div>
    </div>
  );
}

function ExercisePlayer({ patient, onFinish, onClose }) {
  const list = patient.assigned;
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(1);
  const [phase, setPhase] = useState("work"); // work | rest | done
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [completedLog, setCompletedLog] = useState([]);
  const [audioOn, setAudioOn] = useState(true);
  const intervalRef = useRef(null);

  const current = list[exIdx];

  function announcePhase(ex, ph, currentSet) {
    if (!ex) return;
    if (ph === "work") {
      const detalhe = ex.holdSeconds > 0
        ? `Segure por ${ex.holdSeconds} segundos.`
        : `Faça ${ex.reps} repetições.`;
      speak(`${ex.name}. Série ${currentSet} de ${ex.sets}. ${ex.steps} ${detalhe}`, audioOn);
    } else if (ph === "rest") {
      speak("Descanso. Respire e relaxe.", audioOn);
    }
  }

  useEffect(() => {
    if (!current) return;
    const dur = phase === "work" ? Math.max(current.holdSeconds, 3) : current.restSeconds;
    setSecondsLeft(dur);
    setRunning(false);
    if (phase !== "done") announcePhase(current, phase, setIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIdx, setIdx, phase]);

  useEffect(() => {
    if (phase === "done") {
      speak("Rotina concluída. Parabéns por completar todos os exercícios hoje.", audioOn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          handlePhaseComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function handlePhaseComplete() {
    if (!current) return;
    if (phase === "work") {
      if (setIdx < current.sets) {
        setPhase("rest");
      } else {
        finishExercise();
      }
    } else if (phase === "rest") {
      setSetIdx((n) => n + 1);
      setPhase("work");
    }
  }

  function finishExercise() {
    setCompletedLog((log) => [...log, current.id]);
    if (exIdx < list.length - 1) {
      setExIdx((i) => i + 1);
      setSetIdx(1);
      setPhase("work");
    } else {
      setPhase("done");
    }
  }

  function skipPhase() {
    clearInterval(intervalRef.current);
    setRunning(false);
    handlePhaseComplete();
  }

  if (!current || list.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6B6558" }}>
        Nenhum exercício atribuído ainda.
        <div style={{ marginTop: 16 }}>
          <button onClick={onClose} style={btnSecondary}>Voltar</button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#DCEAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color="#2F6F62" />
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: "#1F2E2B", margin: "0 0 8px" }}>Rotina concluída</h2>
        <p style={{ color: "#6B6558", marginBottom: 24 }}>{list.length} exercício(s) realizados hoje. Isso foi registrado para seu fisioterapeuta acompanhar.</p>
        <button
          onClick={() => onFinish(completedLog)}
          style={btnPrimary}
        >
          Concluir e voltar
        </button>
      </div>
    );
  }

  const totalForPhase = phase === "work" ? Math.max(current.holdSeconds, 3) : current.restSeconds;

  return (
    <div style={{ padding: "8px 4px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "#6B6558" }}>
          Exercício {exIdx + 1} de {list.length}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setAudioOn((a) => !a)}
            aria-label={audioOn ? "Desativar áudio" : "Ativar áudio"}
            style={{ background: audioOn ? "#DCEAE5" : "#F0EEE7", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#2F6F62" }}
          >
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6558" }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {current.videoUrl && getYouTubeEmbedId(current.videoUrl) ? (
        <iframe
          src={`https://www.youtube.com/embed/${getYouTubeEmbedId(current.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeEmbedId(current.videoUrl)}`}
          style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, marginBottom: 12, border: "none" }}
          allow="autoplay"
          title="Demonstração do exercício"
        />
      ) : current.videoUrl && getGoogleDriveFileId(current.videoUrl) ? (
        <iframe
          src={`https://drive.google.com/file/d/${getGoogleDriveFileId(current.videoUrl)}/preview`}
          style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, marginBottom: 12, border: "none" }}
          allow="autoplay"
          title="Demonstração do exercício"
        />
      ) : current.videoUrl ? (
        <video src={current.videoUrl} controls autoPlay loop muted style={{ width: "100%", borderRadius: 12, marginBottom: 12 }} />
      ) : current.imageUrl ? (
        <img src={current.imageUrl} alt={current.name} style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginBottom: 12 }} />
      ) : (
        <div style={{ background: "#F6F5F1", borderRadius: 12, padding: "12px 0 4px", marginBottom: 8 }}>
          <CartoonCharacter variant={current.variant} active={running} />
          <p style={{ textAlign: "center", fontSize: 11.5, color: "#8A8574", margin: "2px 0 0" }}>Demonstração esquemática do movimento</p>
        </div>
      )}

      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#1F2E2B", margin: "4px 0 2px" }}>{current.name}</h2>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20 }}>
        <p style={{ color: "#6B6558", fontSize: 14, lineHeight: 1.5, margin: 0, flex: 1 }}>{current.steps}</p>
        <button
          onClick={() => announcePhase(current, phase, setIdx)}
          aria-label="Ouvir instruções"
          style={{ background: "#DCEAE5", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#2F6F62", flexShrink: 0 }}
        >
          <Volume2 size={16} />
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <CircularTimer
          totalSeconds={totalForPhase}
          secondsLeft={secondsLeft}
          label={phase === "work" ? `Série ${setIdx} de ${current.sets} · ${current.reps}x` : "Descanso"}
          color={phase === "work" ? "#2F6F62" : "#C97A3A"}
        />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setRunning((r) => !r)} style={btnPrimary}>
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pausar" : "Iniciar"}
        </button>
        <button onClick={skipPhase} style={btnSecondary}>
          <ChevronRight size={18} /> Próxima
        </button>
      </div>
    </div>
  );
}

const btnPrimary = {
  background: "#2F6F62",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 20px",
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "'Inter', sans-serif",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
};
const btnSecondary = {
  background: "#fff",
  color: "#1F2E2B",
  border: "1px solid #E1DED4",
  borderRadius: 10,
  padding: "12px 20px",
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "'Inter', sans-serif",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
};

function AdherenceChart({ sessions }) {
  const byWeek = {};
  sessions.forEach((s) => {
    const d = new Date(s.date);
    const week = `${d.getFullYear()}-S${Math.ceil(d.getDate() / 7)}/${d.getMonth() + 1}`;
    if (!byWeek[week]) byWeek[week] = { total: 0, done: 0 };
    byWeek[week].total += s.assignedCount;
    byWeek[week].done += s.completed.length;
  });
  const data = Object.entries(byWeek).map(([week, v]) => ({
    week,
    adesao: v.total ? Math.round((v.done / v.total) * 100) : 0,
  }));
  if (data.length === 0) {
    return <p style={{ color: "#6B6558", fontSize: 14 }}>Ainda sem sessões registradas para gerar o gráfico de evolução.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid stroke="#E1DED4" strokeDasharray="3 3" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B6558" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B6558" }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Line type="monotone" dataKey="adesao" stroke="#2F6F62" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function App() {
  useFonts();
  const [role, setRole] = useState("fisio");
  const [library, setLibrary] = useState(DEFAULT_LIBRARY);
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [loaded, setLoaded] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [tab, setTab] = useState("pacientes"); // fisio: pacientes | biblioteca
  const [playing, setPlaying] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [patientViewDay, setPatientViewDay] = useState(todayKey());
  const [storageWarning, setStorageWarning] = useState("");

  useEffect(() => {
    (async () => {
      const lib = await loadShared("hep-library", DEFAULT_LIBRARY);
      const patsRaw = await loadShared("hep-patients", DEFAULT_PATIENTS);
      // migração: pacientes salvos antes da agenda semanal tinham uma lista única "assigned"
      const pats = patsRaw.map((p) => {
        let next = p;
        if (!next.weeklyPlan) {
          const week = emptyWeek();
          if (Array.isArray(next.assigned)) {
            WEEKDAYS.forEach((d) => { week[d.key] = next.assigned.map((a) => ({ ...a })); });
          }
          const { assigned, ...rest } = next;
          next = { ...rest, weeklyPlan: week };
        }
        if (!Array.isArray(next.painLogs)) next = { ...next, painLogs: [] };
        return next;
      });
      setLibrary(lib);
      setPatients(pats);
      setSelectedPatientId(pats[0]?.id ?? null);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveShared("hep-patients", patients).then((ok) => {
      if (!ok) setStorageWarning("Não foi possível salvar as últimas alterações — provavelmente uma foto ou vídeo anexado é grande demais para o armazenamento do navegador. Tente remover o arquivo e usar um link em vez disso.");
    });
  }, [patients, loaded]);
  useEffect(() => {
    if (!loaded) return;
    saveShared("hep-library", library).then((ok) => {
      if (!ok) setStorageWarning("Não foi possível salvar as últimas alterações — provavelmente uma foto ou vídeo anexado é grande demais para o armazenamento do navegador. Tente remover o arquivo e usar um link em vez disso.");
    });
  }, [library, loaded]);

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  function assignExercise(dayKey, exerciseId, params) {
    setPatients((ps) =>
      ps.map((p) =>
        p.id === patient.id
          ? { ...p, weeklyPlan: { ...p.weeklyPlan, [dayKey]: [...p.weeklyPlan[dayKey], { ...params, exerciseId, instanceId: uid() }] } }
          : p
      )
    );
  }

  function removeAssigned(dayKey, instanceId) {
    setPatients((ps) =>
      ps.map((p) =>
        p.id === patient.id
          ? { ...p, weeklyPlan: { ...p.weeklyPlan, [dayKey]: p.weeklyPlan[dayKey].filter((a) => a.instanceId !== instanceId) } }
          : p
      )
    );
  }

  function addPatient(name, condition) {
    const newPatient = { id: uid(), name, condition, weeklyPlan: emptyWeek(), sessions: [], appointments: [], painLogs: [] };
    setPatients((ps) => [...ps, newPatient]);
    setSelectedPatientId(newPatient.id);
  }

  function editPatient(id, name, condition) {
    setPatients((ps) => ps.map((p) => (p.id === id ? { ...p, name, condition } : p)));
  }

  function deletePatient(id) {
    setPatients((ps) => {
      const next = ps.filter((p) => p.id !== id);
      if (id === selectedPatientId) setSelectedPatientId(next[0]?.id ?? null);
      return next;
    });
  }

  function addLibraryExercise(exerciseData) {
    setLibrary((lib) => [...lib, { id: uid(), ...exerciseData }]);
  }

  function editLibraryExercise(id, data) {
    setLibrary((lib) => lib.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }

  function deleteLibraryExercise(id) {
    setLibrary((lib) => lib.filter((e) => e.id !== id));
  }

  function addAppointment(dateStr, timeStr, notes) {
    setPatients((ps) =>
      ps.map((p) =>
        p.id === patient.id
          ? { ...p, appointments: [...p.appointments, { id: uid(), date: dateStr, time: timeStr, notes }] }
          : p
      )
    );
  }

  function logSession(completedInstanceIds) {
    setPatients((ps) =>
      ps.map((p) =>
        p.id === patient.id
          ? {
              ...p,
              sessions: [
                ...p.sessions,
                {
                  id: uid(),
                  date: new Date().toISOString(),
                  assignedCount: p.weeklyPlan[patientViewDay].length,
                  completed: completedInstanceIds,
                },
              ],
            }
          : p
      )
    );
    setPlaying(false);
  }

  function recordPain(value) {
    const dateKey = new Date().toISOString().slice(0, 10);
    setPatients((ps) =>
      ps.map((p) => {
        if (p.id !== patient.id) return p;
        const others = (p.painLogs || []).filter((l) => l.dateKey !== dateKey);
        return { ...p, painLogs: [...others, { id: uid(), dateKey, date: new Date().toISOString(), value }] };
      })
    );
  }

  function buildFullList(dayList) {
    return (dayList || [])
      .map((a) => {
        const ex = library.find((e) => e.id === a.exerciseId);
        if (!ex) return null;
        return { ...ex, ...a, id: a.instanceId };
      })
      .filter(Boolean);
  }

  const fisioAssignedFull = patient ? buildFullList(patient.weeklyPlan[selectedDay]) : [];
  const patientDayAssignedFull = patient ? buildFullList(patient.weeklyPlan[patientViewDay]) : [];

  if (!loaded) {
    return <div style={{ padding: 40, fontFamily: "'Inter', sans-serif", color: "#6B6558" }}>Carregando…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F6F5F1", fontFamily: "'Inter', sans-serif", color: "#1F2E2B" }}>
      <header style={{ padding: "20px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, margin: 0 }}>Casa & Movimento</h1>
        </div>
        <p style={{ fontSize: 13, color: "#6B6558", margin: "2px 0 16px" }}>Exercícios domiciliares acompanhados</p>
        <div style={{ display: "flex", background: "#EAE8E0", borderRadius: 10, padding: 4 }}>
          {[
            { key: "fisio", label: "Fisioterapeuta" },
            { key: "paciente", label: "Paciente" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => { setRole(r.key); setPlaying(false); }}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                background: role === r.key ? "#2F6F62" : "transparent",
                color: role === r.key ? "#fff" : "#6B6558",
                transition: "all 0.15s",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {storageWarning && (
        <div style={{ maxWidth: 480, margin: "12px auto 0", padding: "0 20px" }}>
          <div style={{ background: "#FBEBE6", border: "1px solid #E3B7A6", borderRadius: 10, padding: 12, fontSize: 13, color: "#8A3F2A", display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span>{storageWarning}</span>
            <button onClick={() => setStorageWarning("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A3F2A", flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 60px" }}>
        {role === "fisio" ? (
          <FisioView
            tab={tab}
            setTab={setTab}
            patients={patients}
            patient={patient}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            library={library}
            assignedFull={fisioAssignedFull}
            setShowAssign={setShowAssign}
            removeAssigned={removeAssigned}
            setShowSchedule={setShowSchedule}
            setShowAddPatient={setShowAddPatient}
            setShowAddExercise={setShowAddExercise}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onEditPatient={(p) => { setEditingPatient(p); setShowAddPatient(true); }}
            onDeletePatient={deletePatient}
            onEditExercise={(ex) => { setEditingExercise(ex); setShowAddExercise(true); }}
            onDeleteExercise={deleteLibraryExercise}
          />
        ) : (
          <PacienteView
            patients={patients}
            patient={patient}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            assignedFull={patientDayAssignedFull}
            playing={playing}
            setPlaying={setPlaying}
            logSession={logSession}
            viewDay={patientViewDay}
            setViewDay={setPatientViewDay}
            recordPain={recordPain}
          />
        )}
      </main>

      {showAssign && patient && (
        <AssignModal
          library={library}
          dayLabel={WEEKDAYS.find((d) => d.key === selectedDay)?.label}
          onClose={() => setShowAssign(false)}
          onAssign={(exId, params) => {
            assignExercise(selectedDay, exId, params);
            setShowAssign(false);
          }}
        />
      )}
      {showSchedule && patient && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onSave={(d, t, n) => {
            addAppointment(d, t, n);
            setShowSchedule(false);
          }}
        />
      )}
      {showAddPatient && (
        <AddPatientModal
          initial={editingPatient}
          onClose={() => { setShowAddPatient(false); setEditingPatient(null); }}
          onSave={(name, condition) => {
            if (editingPatient) editPatient(editingPatient.id, name, condition);
            else addPatient(name, condition);
            setShowAddPatient(false);
            setEditingPatient(null);
          }}
        />
      )}
      {showAddExercise && (
        <AddExerciseModal
          initial={editingExercise}
          onClose={() => { setShowAddExercise(false); setEditingExercise(null); }}
          onSave={(data) => {
            if (editingExercise) editLibraryExercise(editingExercise.id, data);
            else addLibraryExercise(data);
            setShowAddExercise(false);
            setEditingExercise(null);
          }}
        />
      )}
    </div>
  );
}

const iconBtnStyle = {
  background: "#F6F5F1",
  border: "1px solid #E1DED4",
  borderRadius: 8,
  padding: 7,
  cursor: "pointer",
  color: "#6B6558",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E1DED4", borderRadius: 14, padding: 18, marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function FisioView({ tab, setTab, patients, patient, selectedPatientId, setSelectedPatientId, library, assignedFull, setShowAssign, removeAssigned, setShowSchedule, setShowAddPatient, setShowAddExercise, selectedDay, setSelectedDay, onEditPatient, onDeletePatient, onEditExercise, onDeleteExercise }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "pacientes", label: "Pacientes", icon: Users },
          { key: "biblioteca", label: "Biblioteca", icon: Dumbbell },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              border: tab === t.key ? "1px solid #2F6F62" : "1px solid #E1DED4",
              background: tab === t.key ? "#DCEAE5" : "#fff",
              color: tab === t.key ? "#2F6F62" : "#6B6558",
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "pacientes" && patient && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: "#6B6558", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paciente</label>
              <button onClick={() => setShowAddPatient(true)} style={{ ...btnSecondary, padding: "5px 10px", fontSize: 12.5 }}>
                <Plus size={13} /> Novo paciente
              </button>
            </div>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid #E1DED4", fontSize: 15, fontFamily: "'Inter', sans-serif" }}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
              <p style={{ fontSize: 13, color: "#6B6558", margin: 0 }}>{patient.condition}</p>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => onEditPatient(patient)} aria-label="Editar paciente" style={iconBtnStyle}>
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Remover "${patient.name}"? Isso apaga toda a rotina e o histórico dele.`)) onDeletePatient(patient.id);
                  }}
                  aria-label="Remover paciente"
                  style={{ ...iconBtnStyle, color: "#B5493A" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17 }}>Rotina da semana</h3>
              <button onClick={() => setShowAssign(true)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13 }}>
                <Plus size={15} /> Adicionar
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
              {WEEKDAYS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  style={{
                    flexShrink: 0, padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    border: selectedDay === d.key ? "1px solid #2F6F62" : "1px solid #E1DED4",
                    background: selectedDay === d.key ? "#2F6F62" : "#fff",
                    color: selectedDay === d.key ? "#fff" : "#6B6558",
                  }}
                >
                  {d.short}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "#8A8574", margin: "-6px 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {WEEKDAYS.find((d) => d.key === selectedDay)?.label}
            </p>
            {assignedFull.length === 0 ? (
              <p style={{ color: "#6B6558", fontSize: 14 }}>Nenhum exercício atribuído para este dia.</p>
            ) : (
              assignedFull.map((ex) => (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F0EEE7" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{ex.name}</div>
                    <div style={{ fontSize: 12.5, color: "#6B6558" }}>{ex.sets}x{ex.reps} · descanso {ex.restSeconds}s</div>
                  </div>
                  <button onClick={() => removeAssigned(selectedDay, ex.id)} style={{ background: "none", border: "none", color: "#B5493A", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
                    Remover
                  </button>
                </div>
              ))
            )}
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <TrendingUp size={16} color="#2F6F62" />
              <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17 }}>Evolução / adesão</h3>
            </div>
            <AdherenceChart sessions={patient.sessions} />
            <div style={{ marginTop: 8, fontSize: 13, color: "#6B6558" }}>
              {patient.sessions.length} sessão(ões) registrada(s) no total.
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <TrendingUp size={16} color="#C97A3A" />
              <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17 }}>Escala de dor (EVA)</h3>
            </div>
            <PainChart painLogs={patient.painLogs} />
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color="#2F6F62" />
                <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17 }}>Agenda de atendimento</h3>
              </div>
              <button onClick={() => setShowSchedule(true)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13 }}>
                <Plus size={15} /> Marcar
              </button>
            </div>
            {patient.appointments.length === 0 ? (
              <p style={{ color: "#6B6558", fontSize: 14 }}>Nenhum horário marcado.</p>
            ) : (
              patient.appointments
                .sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time))
                .map((a) => (
                  <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid #F0EEE7", fontSize: 14 }}>
                    <strong>{new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR")}</strong> às {a.time}
                    {a.notes && <div style={{ fontSize: 12.5, color: "#6B6558" }}>{a.notes}</div>}
                  </div>
                ))
            )}
          </Card>
        </>
      )}

      {tab === "biblioteca" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17 }}>Biblioteca de exercícios</h3>
              <p style={{ fontSize: 13, color: "#6B6558", marginTop: 4, marginBottom: 0 }}>Exercícios prontos para atribuir a qualquer paciente.</p>
            </div>
            <button onClick={() => setShowAddExercise(true)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, flexShrink: 0 }}>
              <Plus size={15} /> Novo
            </button>
          </div>
          {library.map((ex) => (
            <div key={ex.id} style={{ padding: "10px 0", borderBottom: "1px solid #F0EEE7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: "#2F6F62", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ex.category}</div>
                  <div style={{ fontSize: 13, color: "#6B6558", marginTop: 4 }}>{ex.steps}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onEditExercise(ex)} aria-label="Editar exercício" style={iconBtnStyle}>
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Remover "${ex.name}" da biblioteca? Ele será retirado das rotinas onde estiver atribuído.`)) onDeleteExercise(ex.id);
                    }}
                    aria-label="Remover exercício"
                    style={{ ...iconBtnStyle, color: "#B5493A" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function EvaScaleCard({ patient, recordPain }) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const todayLog = (patient.painLogs || []).find((l) => l.dateKey === dateKey);
  const [value, setValue] = useState(todayLog ? todayLog.value : 5);
  const [editing, setEditing] = useState(!todayLog);

  const faceColor = (v) => {
    if (v <= 2) return "#4E8F73";
    if (v <= 5) return "#C9A227";
    if (v <= 7) return "#D9822B";
    return "#B5493A";
  };

  return (
    <Card>
      <h3 style={{ margin: "0 0 4px", fontFamily: "'Fraunces', serif", fontSize: 17 }}>Escala de dor (EVA)</h3>
      <p style={{ fontSize: 13, color: "#6B6558", marginTop: 2, marginBottom: 12 }}>Marque de 0 (sem dor) a 10 (pior dor possível) como você está agora.</p>
      {!editing && todayLog ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 32, fontWeight: 600, color: faceColor(todayLog.value) }}>{todayLog.value}</span>
            <span style={{ fontSize: 13, color: "#6B6558" }}>/ 10 registrado hoje</span>
          </div>
          <button onClick={() => setEditing(true)} style={{ ...btnSecondary, padding: "7px 12px", fontSize: 12.5 }}>
            <Pencil size={13} /> Editar
          </button>
        </div>
      ) : (
        <div>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 40, fontWeight: 600, color: faceColor(value) }}>{value}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value}
            onChange={(e) => setValue(+e.target.value)}
            style={{ width: "100%", accentColor: faceColor(value) }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A8574", marginTop: 4 }}>
            <span>Sem dor</span>
            <span>Pior dor possível</span>
          </div>
          <button
            onClick={() => { recordPain(value); setEditing(false); }}
            style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 14 }}
          >
            Salvar registro de hoje
          </button>
        </div>
      )}
    </Card>
  );
}

function PacienteView({ patients, patient, selectedPatientId, setSelectedPatientId, assignedFull, playing, setPlaying, logSession, viewDay, setViewDay, recordPain }) {
  if (playing) {
    return (
      <Card style={{ padding: 8 }}>
        <ExercisePlayer patient={{ ...patient, assigned: assignedFull }} onFinish={logSession} onClose={() => setPlaying(false)} />
      </Card>
    );
  }
  const isToday = viewDay === todayKey();
  return (
    <div>
      <Card>
        <label style={{ fontSize: 12, color: "#6B6558", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Meu perfil</label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid #E1DED4", fontSize: 15, fontFamily: "'Inter', sans-serif" }}
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Card>

      <EvaScaleCard patient={patient} recordPain={recordPain} />

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <ClipboardList size={16} color="#2F6F62" />
          <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 18 }}>Minha rotina</h3>
        </div>
        <p style={{ fontSize: 12, color: "#8A8574", margin: "0 0 8px" }}>
          Não conseguiu fazer num dia? Escolha outro dia da semana para fazer a rotina dele agora.
        </p>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
          {WEEKDAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => setViewDay(d.key)}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: viewDay === d.key ? "1px solid #2F6F62" : "1px solid #E1DED4",
                background: viewDay === d.key ? "#2F6F62" : "#fff",
                color: viewDay === d.key ? "#fff" : "#6B6558",
              }}
            >
              {d.short}{d.key === todayKey() ? " •" : ""}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#8A8574", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {WEEKDAYS.find((d) => d.key === viewDay)?.label}{isToday ? " · hoje" : ""}
        </p>
        <p style={{ fontSize: 13.5, color: "#6B6558", marginTop: 4 }}>
          {assignedFull.length} exercício(s) prescrito(s) pelo seu fisioterapeuta.
        </p>
        {assignedFull.map((ex) => (
          <div key={ex.id} style={{ padding: "8px 0", borderBottom: "1px solid #F0EEE7", fontSize: 14 }}>
            <strong>{ex.name}</strong> — {ex.sets}x{ex.reps}
          </div>
        ))}
        <button
          onClick={() => setPlaying(true)}
          disabled={assignedFull.length === 0}
          style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 14, opacity: assignedFull.length === 0 ? 0.5 : 1 }}
        >
          <Play size={18} /> Iniciar sessão
        </button>
      </Card>

      <Card>
        <h3 style={{ margin: "0 0 8px", fontFamily: "'Fraunces', serif", fontSize: 17 }}>Histórico</h3>
        {patient.sessions.length === 0 ? (
          <p style={{ color: "#6B6558", fontSize: 14 }}>Nenhuma sessão realizada ainda.</p>
        ) : (
          [...patient.sessions].reverse().map((s) => (
            <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid #F0EEE7", fontSize: 14, display: "flex", justifyContent: "space-between" }}>
              <span>{new Date(s.date).toLocaleDateString("pt-BR")}</span>
              <span style={{ color: "#2F6F62", fontWeight: 600 }}>{s.completed.length}/{s.assignedCount} concluídos</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function AssignModal({ library, onClose, onAssign, dayLabel }) {
  const [exId, setExId] = useState(library[0]?.id);
  const ex = library.find((e) => e.id === exId);
  const [sets, setSets] = useState(ex?.sets ?? 3);
  const [reps, setReps] = useState(ex?.reps ?? 10);
  const [holdSeconds, setHoldSeconds] = useState(ex?.holdSeconds ?? 0);
  const [restSeconds, setRestSeconds] = useState(ex?.restSeconds ?? 30);

  useEffect(() => {
    const e = library.find((x) => x.id === exId);
    if (e) {
      setSets(e.sets); setReps(e.reps); setHoldSeconds(e.holdSeconds); setRestSeconds(e.restSeconds);
    }
  }, [exId, library]);

  return (
    <ModalShell title={`Atribuir exercício${dayLabel ? " · " + dayLabel : ""}`} onClose={onClose}>
      <label style={labelStyle}>Exercício</label>
      <select value={exId} onChange={(e) => setExId(e.target.value)} style={inputStyle}>
        {library.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Séries</label>
          <input type="number" min={1} value={sets} onChange={(e) => setSets(+e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Repetições</label>
          <input type="number" min={1} value={reps} onChange={(e) => setReps(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Segurar (s)</label>
          <input type="number" min={0} value={holdSeconds} onChange={(e) => setHoldSeconds(+e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Descanso (s)</label>
          <input type="number" min={0} value={restSeconds} onChange={(e) => setRestSeconds(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <button
        onClick={() => onAssign(exId, { sets, reps, holdSeconds, restSeconds })}
        style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 18 }}
      >
        Atribuir ao paciente
      </button>
    </ModalShell>
  );
}

function AddPatientModal({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  return (
    <ModalShell title={initial ? "Editar paciente" : "Novo paciente"} onClose={onClose}>
      <label style={labelStyle}>Nome do paciente</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Carlos" style={inputStyle} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Condição / diagnóstico</label>
      <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Ex: Pós-operatório de LCA" style={inputStyle} />
      <button
        disabled={!name.trim()}
        onClick={() => onSave(name.trim(), condition.trim())}
        style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 18, opacity: !name.trim() ? 0.5 : 1 }}
      >
        {initial ? "Salvar alterações" : "Criar paciente"}
      </button>
    </ModalShell>
  );
}

function AddExerciseModal({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [steps, setSteps] = useState(initial?.steps ?? "");
  const [sets, setSets] = useState(initial?.sets ?? 3);
  const [reps, setReps] = useState(initial?.reps ?? 10);
  const [holdSeconds, setHoldSeconds] = useState(initial?.holdSeconds ?? 0);
  const [restSeconds, setRestSeconds] = useState(initial?.restSeconds ?? 30);
  const [variant, setVariant] = useState(initial?.variant ?? "generic");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? null);
  const initialVideoIsLink = initial?.videoUrl && !initial.videoUrl.startsWith("data:");
  const [videoLink, setVideoLink] = useState(initialVideoIsLink ? initial.videoUrl : "");
  const [videoFileData, setVideoFileData] = useState(initial?.videoUrl && !initialVideoIsLink ? initial.videoUrl : null);
  const [videoError, setVideoError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setImageUrl(await compressImageToDataUrl(file));
    } catch {
      window.alert("Não foi possível carregar essa imagem.");
    }
    setBusy(false);
  }

  async function handleVideoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setVideoError(`Esse arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB — grande demais para salvar com segurança. Use um link (YouTube não listado ou Google Drive) em vez disso.`);
      e.target.value = "";
      return;
    }
    setVideoError("");
    setBusy(true);
    try {
      setVideoFileData(await fileToDataUrl(file));
    } catch {
      window.alert("Não foi possível carregar esse vídeo.");
    }
    setBusy(false);
  }

  const finalVideoUrl = videoLink.trim() ? videoLink.trim() : videoFileData;

  return (
    <ModalShell title={initial ? "Editar exercício" : "Novo exercício na biblioteca"} onClose={onClose}>
      <label style={labelStyle}>Nome do exercício</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Agachamento na parede" style={inputStyle} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Categoria</label>
      <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Joelho" style={inputStyle} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Como fazer (instruções)</label>
      <textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Descreva o movimento passo a passo" style={{ ...inputStyle, minHeight: 70, fontFamily: "'Inter', sans-serif", resize: "vertical" }} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Animação do personagem</label>
      <select value={variant} onChange={(e) => setVariant(e.target.value)} style={inputStyle}>
        <option value="generic">Movimento geral</option>
        <option value="legraise">Elevação de perna</option>
        <option value="bridge">Ponte / quadril</option>
        <option value="arm">Braço / ombro</option>
      </select>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Séries</label>
          <input type="number" min={1} value={sets} onChange={(e) => setSets(+e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Repetições</label>
          <input type="number" min={1} value={reps} onChange={(e) => setReps(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Segurar (s)</label>
          <input type="number" min={0} value={holdSeconds} onChange={(e) => setHoldSeconds(+e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Descanso (s)</label>
          <input type="number" min={0} value={restSeconds} onChange={(e) => setRestSeconds(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <label style={{ ...labelStyle, marginTop: 16 }}>Foto de demonstração (opcional)</label>
      {imageUrl && (
        <div style={{ marginBottom: 8 }}>
          <img src={imageUrl} alt="Prévia" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8 }} />
          <button type="button" onClick={() => setImageUrl(null)} style={{ ...btnSecondary, marginTop: 6, fontSize: 12.5, padding: "5px 10px" }}>
            Remover foto
          </button>
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleImageChange} style={inputStyle} />

      <label style={{ ...labelStyle, marginTop: 16 }}>Vídeo de demonstração (opcional)</label>
      <input
        type="text"
        value={videoLink}
        onChange={(e) => setVideoLink(e.target.value)}
        placeholder="Cole um link (YouTube, Google Drive, etc.)"
        style={inputStyle}
      />
      <p style={{ fontSize: 12, color: "#8A8574", margin: "8px 0 6px" }}>ou envie um arquivo de vídeo bem curto e leve (até 2MB):</p>
      <input type="file" accept="video/*" onChange={handleVideoFileChange} style={inputStyle} disabled={!!videoLink.trim()} />
      {videoError && <p style={{ fontSize: 12.5, color: "#B5493A", marginTop: 6 }}>{videoError}</p>}
      {videoFileData && !videoLink.trim() && (
        <button type="button" onClick={() => setVideoFileData(null)} style={{ ...btnSecondary, marginTop: 8, fontSize: 12.5, padding: "5px 10px" }}>
          Remover vídeo enviado
        </button>
      )}
      <p style={{ fontSize: 11.5, color: "#8A8574", marginTop: 6 }}>
        Se não enviar foto nem vídeo, o app mostra uma animação simples do personagem durante o exercício.
      </p>

      <button
        disabled={!name.trim() || !steps.trim() || busy}
        onClick={() => onSave({ name: name.trim(), category: category.trim() || "Geral", steps: steps.trim(), sets, reps, holdSeconds, restSeconds, variant, imageUrl, videoUrl: finalVideoUrl })}
        style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 18, opacity: !name.trim() || !steps.trim() || busy ? 0.5 : 1 }}
      >
        {busy ? "Carregando arquivo…" : initial ? "Salvar alterações" : "Adicionar à biblioteca"}
      </button>
    </ModalShell>
  );
}

function ScheduleModal({ onClose, onSave }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <ModalShell title="Marcar atendimento" onClose={onClose}>
      <label style={labelStyle}>Data</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Horário</label>
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
      <label style={{ ...labelStyle, marginTop: 12 }}>Observações</label>
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: reavaliação de ADM" style={inputStyle} />
      <button
        disabled={!date || !time}
        onClick={() => onSave(date, time, notes)}
        style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 18, opacity: !date || !time ? 0.5 : 1 }}
      >
        Salvar horário
      </button>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(31,46,43,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 19 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} color="#6B6558" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "#6B6558", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #E1DED4", fontSize: 15, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" };

export { App };
