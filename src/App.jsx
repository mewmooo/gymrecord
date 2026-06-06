import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight, Clock, BookOpen, PenTool, CheckSquare, Heart, MoonStar,
  Home, Timer, Trophy, BarChart2, Crown, Play, Pause, Droplets, Battery, BatteryCharging, BatteryFull
} from 'lucide-react';

// --- FUNGSI EKSTRAK YOUTUBE ID ---
const getYouTubeId = (url) => {
  if (!url) return null;
  if (url.length === 11 && !url.includes('/')) return url; 
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// --- KALKULATOR 1RM ---
const calculate1RM = (weight, reps, rpe = 10) => {
  const repsInReserve = 10 - rpe; 
  const effectiveReps = reps + repsInReserve;
  return weight * (1 + effectiveReps / 30);
};

const getMuscleById = (id, data) => {
  for (const tab in data) {
    const found = data[tab].find(ex => ex.id === id);
    if (found) return found.muscle;
  }
  return 'Umum';
};

// --- DATA MASTER ---
const INITIAL_EXERCISE_DATA = {
  Push: [
    { id: 'p1', name: 'Chest Press', muscle: 'Dada', videoId: '0GjpPFOx1uQ', targetSets: 3 },
    { id: 'p2', name: 'Chest Fly', muscle: 'Dada', videoId: 'eGjt4jcEA_E', targetSets: 3 },
    { id: 'p3', name: 'Shoulder Press', muscle: 'Bahu Depan', videoId: 'WvLMauqrnK8', targetSets: 3 },
    { id: 'p4', name: 'Lateral Raise', muscle: 'Bahu Samping', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'p5', name: 'Tricep Pushdown', muscle: 'Trisep', videoId: '2-LAMcpzODU', targetSets: 3 },
  ],
  Pull: [
    { id: 'pu1', name: 'Lat Pulldown', muscle: 'Punggung (Lats)', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'pu2', name: 'Rowing', muscle: 'Punggung Tengah', videoId: 'GZbfZ033f74', targetSets: 3 },
    { id: 'pu3', name: 'Face Pull', muscle: 'Bahu Belakang', videoId: null, targetSets: 3 }, 
    { id: 'pu4', name: 'Bicep Curl', muscle: 'Bisep', videoId: 'in7PaeYIYfw', targetSets: 3 },
    { id: 'pu5', name: 'Hammer Curl', muscle: 'Bisep Brachialis', videoId: null, targetSets: 2 },
  ],
  Legs: [
    { id: 'l1', name: 'Hack Squat', muscle: 'Paha Depan & Bokong', videoId: '0tn5K9NlCfo', targetSets: 3 },
    { id: 'l2', name: 'Leg Press', muscle: 'Paha Depan', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'l3', name: 'Leg Extension', muscle: 'Paha Depan Isolasi', videoId: 'YyvSfVjQeL0', targetSets: 3 },
    { id: 'l4', name: 'Leg Curl', muscle: 'Paha Belakang', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'l5', name: 'Calf Raise', muscle: 'Betis', videoId: '-M4-G8p8fmc', targetSets: 4 },
  ],
  Upper: [
    { id: 'u1', name: 'Chest Press', muscle: 'Dada', videoId: '0GjpPFOx1uQ', targetSets: 3 },
    { id: 'u2', name: 'Lat Pulldown', muscle: 'Punggung (Lats)', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'u3', name: 'Shoulder Press', muscle: 'Bahu Depan', videoId: 'WvLMauqrnK8', targetSets: 2 },
    { id: 'u4', name: 'Lateral Raise', muscle: 'Bahu Samping', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'u5', name: 'Bicep Curl', muscle: 'Bisep', videoId: 'in7PaeYIYfw', targetSets: 2 },
    { id: 'u6', name: 'Tricep Pushdown', muscle: 'Trisep', videoId: '2-LAMcpzODU', targetSets: 2 },
  ],
  'Legs & Core': [
    { id: 'lc1', name: 'Leg Press', muscle: 'Paha Depan', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'lc2', name: 'Leg Curl', muscle: 'Paha Belakang', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'lc3', name: 'Calf Raise', muscle: 'Betis', videoId: '-M4-G8p8fmc', targetSets: 4 },
    { id: 'lc4', name: 'Abs / Crunch', muscle: 'Perut (Core)', videoId: null, targetSets: 3 },
  ]
};

const getTodaySplit = () => {
  const day = new Date().getDay(); 
  if (day === 1) return 'Push';
  if (day === 2) return 'Pull';
  if (day === 3) return 'Legs';
  if (day === 4) return 'Rest'; 
  if (day === 5) return 'Upper';
  if (day === 6) return 'Legs & Core';
  return 'Rest'; 
};

const getHariIndonesia = () => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[new Date().getDay()];
};

// --- FUNGSI API GEMINI (FALLBACK SYSTEM) ---
const callGeminiAPI = async (prompt, isRaw = false) => {
  let apiKey = "";
  try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    apiKey = env.VITE_GEMINI_API_KEY || "";
  } catch (e) { apiKey = ""; }
  
  if (!apiKey) {
    console.error("API Key tidak ditemukan!");
    return "Konfigurasi API Key belum lengkap di Vercel.";
  }
  
  const combinedPrompt = isRaw 
    ? prompt 
    : "Anda adalah Pelatih Kebugaran Profesional tingkat lanjut. Jawab dalam Bahasa Indonesia, gunakan nada profesional, asik, namun suportif. Ringkas maksimal 3-5 kalimat. Analisis data secara harfiah.\n\n" + prompt;

  const modelsToTry = [
    'gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro',
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
    'gemma-4-31b', 'gemma-4-26b', 'gemma-3-2b',
    'gemini-2-flash', 'gemini-1.5-flash'
  ];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: combinedPrompt }] }] })
      });
      if (response.ok) {
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons.";
      }
    } catch (error) {
      console.error(`Error pada model ${modelName}:`, error);
    }
  }
  return null; 
};

// --- KOMPONEN: MUSCLE RECOVERY READINESS ---
const MuscleRecovery = ({ logs, exerciseData }) => {
  const [recoveryData, setRecoveryData] = useState([]);

  useEffect(() => {
    const now = Date.now();
    const muscleLogs = {};
    
    logs.filter(l => (now - l.timestamp) <= 72 * 60 * 60 * 1000).forEach(l => {
       const muscle = getMuscleById(l.exerciseId, exerciseData);
       if (!muscleLogs[muscle] || l.timestamp > muscleLogs[muscle]) {
           muscleLogs[muscle] = l.timestamp;
       }
    });

    const statusList = Object.entries(muscleLogs).map(([muscle, timestamp]) => {
      const hoursAgo = (now - timestamp) / (1000 * 60 * 60);
      let status = 'ready';
      if (hoursAgo < 24) status = 'tired';
      else if (hoursAgo < 48) status = 'recovering';
      return { muscle, status, hoursAgo };
    });

    setRecoveryData(statusList.sort((a,b) => a.hoursAgo - b.hoursAgo));
  }, [logs, exerciseData]);

  if (recoveryData.length === 0) return null;

  return (
    <div className="mb-6 animate-in slide-in-from-top-2">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1 flex items-center">
        <Activity size={12} className="mr-1.5 text-indigo-500"/> Status Otot (72 Jam Terakhir)
      </h4>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 px-1">
        {recoveryData.map((item, idx) => {
          let styles = "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400";
          let Icon = BatteryFull;
          let label = "Siap";
          
          if (item.status === 'tired') {
             styles = "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400";
             Icon = Battery;
             label = "Lelah";
          } else if (item.status === 'recovering') {
             styles = "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400";
             Icon = BatteryCharging;
             label = "Pemulihan";
          }

          return (
            <div key={idx} className={`flex items-center flex-shrink-0 px-3 py-2 rounded-2xl border ${styles} shadow-sm transition-all`}>
               <Icon size={14} className="mr-2" />
               <div className="flex flex-col">
                 <span className="text-[11px] font-bold leading-tight">{item.muscle}</span>
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{label}</span>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// --- KOMPONEN: KARTU LATIHAN (TRACK) ---
const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, onUpdateExerciseVideo, activeTab }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState('Normal'); 
  const [tempSubSets, setTempSubSets] = useState([]); 
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState('list'); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [prModal, setPrModal] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', sets: '', reps: '' });

  // AI & Video States
  const [showVideo, setShowVideo] = useState(false);
  const [aiTip, setAiTip] = useState(null);
  const [isAiTipLoading, setIsAiTipLoading] = useState(false);
  const [aiAlt, setAiAlt] = useState(null);
  const [isAiAltLoading, setIsAiAltLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(null);
  const [isAiProgressLoading, setIsAiProgressLoading] = useState(false);
  const [isAIVideoLoading, setIsAIVideoLoading] = useState(false);

  // Edit Exercise State
  const [isEditingEx, setIsEditingEx] = useState(false);
  const [exEditForm, setExEditForm] = useState({ 
    name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3,
    videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : ''
  });

  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setShowVideo(false); setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Berikan satu tips biomekanik singkat terkait postur (form) dan mind-muscle connection untuk memaksimalkan gerakan ${exercise.name}.`);
    setAiTip(response || "Gagal menghubungi AI."); setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setShowVideo(false); setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Berikan 1 alternatif gerakan mesin/dumbbell/cable terbaik yang identik dengan ${exercise.name}. Sebutkan alasannya singkat, DAN jelaskan langkah-langkah cara melakukan gerakan alternatif tersebut secara ringkas.`);
    setAiAlt(response || "Gagal menghubungi AI."); setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setShowVideo(false); setIsAiProgressLoading(true);
    const chronologicalHistory = [...history].slice(0, 4).reverse();
    const recentTrend = chronologicalHistory.map((l, idx) => `Sesi ${idx+1}: ${l.weight}kg (${l.sets}x${l.reps}) RPE:${l.rpe||'-'}`).join(' ➔ ');
    const targetSetContext = exercise.targetSets ? `\nCatatan Penting: Target program untuk gerakan ini adalah ${exercise.targetSets} SET.` : '';
    const prompt = `Histori (terlama ➔ terbaru) ${exercise.name}:\n[ ${recentTrend} ]${targetSetContext}\n\nEvaluasi tren beban dan RPE. Berikan saran beban/rep untuk sesi berikutnya (progressive overload). Evaluasi apakah jumlah set memenuhi target ${exercise.targetSets} set.`;
    const response = await callGeminiAPI(prompt);
    setAiProgress(response || "Gagal menghubungi AI."); setIsAiProgressLoading(false);
  };

  const handleToggleVideo = async () => {
    if (showVideo) { setShowVideo(false); return; }
    setAiTip(null); setAiAlt(null); setShowVideo(true);
    
    if (!exercise.videoId) {
      setIsAIVideoLoading(true);
      const prompt = `Carikan video tutorial cara melakukan gerakan gym "${exercise.name}". Kembalikan HANYA 11 karakter ID video YouTube yang paling populer dan akurat, contohnya: "dQw4w9WgXcQ". JANGAN balas dengan kalimat apapun selain 11 karakter ID tersebut.`;
      const response = await callGeminiAPI(prompt, true);
      const match = response ? response.match(/[a-zA-Z0-9_-]{11}/) : null;
      if (match) {
        onUpdateExerciseVideo(activeTab, exercise.id, match[0]);
      } else {
        alert("Maaf, AI gagal menemukan video tutorial untuk gerakan ini. Silakan cari manual di YouTube.");
        setShowVideo(false);
      }
      setIsAIVideoLoading(false);
    }
  };

  const getCurrentMax1RM = () => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(l => l.oneRepMax || calculate1RM(l.weight, l.reps, l.rpe||10)));
  };

  const handleAddSubSet = () => {
    if (!weight || !reps) return;
    setTempSubSets([...tempSubSets, { weight: parseFloat(weight), reps: parseInt(reps), rpe: parseInt(rpe) || null }]);
    setWeight(''); setReps(''); setRpe('');
  };

  const handleSetTypeChange = (type) => { setSetType(type); if (type === 'Normal') setTempSubSets([]); };

  const handleSubmit = () => {
    let logData;
    let w, r, rpeVal, new1RM;

    if (setType === 'Normal') {
      if (!weight || !sets || !reps) return;
      w = parseFloat(weight); r = parseInt(reps); rpeVal = rpe ? parseInt(rpe) : 10;
      new1RM = calculate1RM(w, r, rpeVal);
      logData = { exerciseId: exercise.id, weight: w, sets: parseInt(sets), reps: r, rpe: rpeVal, setType: setType, oneRepMax: parseFloat(new1RM.toFixed(1)) };
    } else {
      if (tempSubSets.length === 0) return;
      w = tempSubSets[0].weight; r = tempSubSets[0].reps; rpeVal = tempSubSets[0].rpe || 10;
      new1RM = calculate1RM(w, r, rpeVal);
      logData = { exerciseId: exercise.id, weight: w, sets: tempSubSets.length, reps: r, rpe: rpeVal, setType: setType, subSets: tempSubSets, oneRepMax: parseFloat(new1RM.toFixed(1)) };
    }

    const max1RM = getCurrentMax1RM();
    if (history.length > 0 && new1RM > max1RM) {
      logData.isPR = true;
      setPrModal(true);
      setTimeout(() => setPrModal(false), 4000);
    } else {
      logData.isPR = false;
    }

    onLog(logData);
    setWeight(''); setSets(''); setReps(''); setRpe(''); setTempSubSets([]);
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2500);
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (setType === 'Normal') handleSubmit();
    else if (weight && reps) handleAddSubSet();
  };

  const startEdit = (log) => { setEditingId(log.id); setEditForm({ weight: log.weight, sets: log.sets, reps: log.reps }); };
  const saveEdit = (id) => {
    if (!editForm.weight || !editForm.sets || !editForm.reps) return;
    const w = parseFloat(editForm.weight); const r = parseInt(editForm.reps);
    onEditLog(id, { weight: w, sets: parseInt(editForm.sets), reps: r, oneRepMax: parseFloat(calculate1RM(w,r).toFixed(1)) });
    setEditingId(null);
  };
  
  const handleSaveExEdit = () => {
    if (!exEditForm.name) return;
    const extractedVideoId = getYouTubeId(exEditForm.videoUrl);
    onEditExercise(activeTab, exercise.id, exEditForm.name, exEditForm.muscle, parseInt(exEditForm.targetSets), extractedVideoId);
    setIsEditingEx(false);
  };

  const ChartView = () => {
    if (history.length === 0) return <p className="text-xs text-gray-500 text-center py-4">Belum ada data untuk grafik.</p>;
    const chartData = [...history].slice(0, 7).reverse();
    const max1RM = Math.max(...chartData.map(d => d.oneRepMax || 0));
    const upperBound = max1RM > 0 ? max1RM * 1.2 : 10;

    return (
      <div className="pt-2 pb-2 animate-in fade-in h-48 flex gap-2">
        <div className="flex flex-col justify-between text-[9px] font-bold text-gray-400 pb-5 pt-4 border-r border-gray-200 dark:border-gray-800 pr-2">
          <span>{Math.round(upperBound)}</span>
          <span>{Math.round(upperBound / 2)}</span>
          <span>0</span>
        </div>
        <div className="flex-1 relative flex items-end justify-around h-full gap-1 sm:gap-2">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5 pt-4 z-0">
            <div className="w-full h-px border-t border-dashed border-gray-200 dark:border-gray-800"></div>
            <div className="w-full h-px border-t border-dashed border-gray-200 dark:border-gray-800"></div>
            <div className="w-full h-px border-t border-dashed border-gray-200 dark:border-gray-800"></div>
          </div>
          {chartData.map((d, i) => {
            const heightPct = Math.max(1, ((d.oneRepMax || 0) / upperBound) * 100);
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative z-10 group/bar">
                <div className="text-[10px] font-black text-gray-800 dark:text-gray-200 mb-1 z-20">{d.oneRepMax}</div>
                <div className={`w-full max-w-[28px] rounded-t-md transition-all duration-700 ${d.isPR ? 'bg-gradient-to-t from-amber-400 to-yellow-500 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-gradient-to-t from-indigo-500 to-indigo-400'}`} style={{ height: `${heightPct}%` }}></div>
                <div className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center h-3">{d.date.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const groupedHistory = [];
  let currentGroup = null;
  history.forEach(log => {
    if (!currentGroup || currentGroup.date !== log.date) {
      currentGroup = { date: log.date, logs: [] };
      groupedHistory.push(currentGroup);
    }
    currentGroup.logs.push(log);
  });

  return (
    <div className="group bg-white dark:bg-[#0f1117] rounded-[32px] p-5 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:shadow-none border border-gray-100 dark:border-gray-800/80 mb-6 transition-all duration-300 relative overflow-hidden">
      
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500/0 via-fuchsia-500/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6">
        <div className="flex-1 w-full">
          {isEditingEx ? (
            <div className="space-y-3 mb-2 animate-in fade-in">
              <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Nama Latihan" />
              <div className="flex gap-2">
                <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Target Otot" />
                <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Target Set" />
              </div>
              <input type="text" value={exEditForm.videoUrl} onChange={e => setExEditForm({...exEditForm, videoUrl: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Link YouTube (Opsional)" />
              <div className="flex space-x-2 pt-2">
                <button onClick={handleSaveExEdit} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"><Save size={14} className="mr-2 inline"/> Simpan</button>
                <button onClick={() => setIsEditingEx(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-[#1a1d27] text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl active:scale-95 transition-all">Batal</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap">
                <h3 className="text-[19px] sm:text-[21px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">{exercise.name}</h3>
                <div className="flex space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 mt-2 sm:mt-0">
                  <button onClick={() => {
                      setExEditForm({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });
                      setIsEditingEx(true);
                    }} 
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit Gerakan"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gray-100 dark:bg-[#1a1d27] text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                  {exercise.muscle}
                </div>
                {exercise.targetSets && (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-violet-50/80 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100/50 dark:border-violet-500/20">
                    🎯 Target: {exercise.targetSets} Set
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 shrink-0 w-full sm:w-auto sm:flex sm:justify-end mt-2 sm:mt-0">
          {exercise.videoId ? (
            <button 
              onClick={(e) => { e.preventDefault(); setShowVideo(!showVideo); setAiTip(null); setAiAlt(null); }}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl transition-all active:scale-95 border ${showVideo ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25' : 'bg-white dark:bg-[#1a1d27] text-rose-500 border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`} 
            >
              <PlayCircle size={18} className={showVideo ? "animate-pulse" : ""} />
              <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
            </button>
          ) : (
            <button 
              onClick={handleToggleVideo} 
              className="flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl transition-all active:scale-95 border bg-white dark:bg-[#1a1d27] text-rose-500 border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10" 
            >
              {isAIVideoLoading ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
              <span className="text-[9px] font-black uppercase tracking-widest">Cari AI</span>
            </button>
          )}
          <button onClick={handleGetAlternative} className="flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl bg-white dark:bg-[#1a1d27] text-gray-500 hover:text-amber-500 hover:border-amber-200 dark:hover:text-amber-400 border border-gray-200 dark:border-gray-800 transition-all active:scale-95 group-hover:border-gray-300 dark:group-hover:border-gray-700">
            {isAiAltLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span className="text-[9px] font-black uppercase tracking-widest">Ganti</span>
          </button>
          <button onClick={handleGetTip} className="flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            {isAiTipLoading ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
            <span className="text-[9px] font-black uppercase tracking-widest">Tips AI</span>
          </button>
        </div>
      </div>

      {/* AI Modals / Video */}
      <div className="space-y-4 mb-6 empty:hidden">
        {showVideo && exercise.videoId && (
          <div className="rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-gray-800 shadow-2xl relative aspect-video animate-in zoom-in-95 duration-300 group/video">
            <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0&modestbranding=1`} title="Tutorial" allowFullScreen></iframe>
          </div>
        )}
        {aiTip && (
          <div className="bg-indigo-50/80 dark:bg-indigo-500/10 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top-2 flex items-start">
            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-xl mr-3 shrink-0"><Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" /></div>
            <p className="text-[13px] sm:text-sm text-indigo-900 dark:text-indigo-100 font-medium leading-relaxed pt-0.5">{aiTip}</p>
          </div>
        )}
        {aiAlt && (
          <div className="bg-gray-50 dark:bg-[#1a1d27] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2 flex items-start">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl mr-3 shrink-0 shadow-sm border border-gray-100 dark:border-gray-700"><RefreshCw size={16} className="text-gray-600 dark:text-gray-400" /></div>
            <p className="text-[13px] sm:text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed pt-0.5">{aiAlt}</p>
          </div>
        )}
        {aiProgress && (
          <div className="bg-emerald-50/80 dark:bg-emerald-500/10 p-4 sm:p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 animate-in slide-in-from-top-2 flex items-start">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-xl mr-3 shrink-0"><TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" /></div>
            <p className="text-[13px] sm:text-sm text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed pt-0.5">{aiProgress}</p>
          </div>
        )}
      </div>

      {/* Tipe Set Toggles */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
        {['Normal', 'Drop Set', 'Superset'].map(type => (
          <button 
            key={type} type="button" onClick={() => handleSetTypeChange(type)}
            className={`px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${setType === type ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-white dark:bg-[#1a1d27] text-gray-500 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {setType !== 'Normal' && tempSubSets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 dark:bg-[#11131a] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          {tempSubSets.map((s, i) => (
            <div key={i} className="text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg flex items-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
              {s.weight}kg × {s.reps} {s.rpe && <span className="ml-1 opacity-60">RPE:{s.rpe}</span>}
              <button type="button" onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))} className="ml-2.5 text-indigo-400 hover:text-rose-500 transition-colors"><X size={12}/></button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="bg-gray-50/80 dark:bg-[#0a0a0a]/50 p-2.5 sm:p-2.5 rounded-[24px] border border-gray-100 dark:border-gray-800/80 mb-6 backdrop-blur-sm shadow-inner">
        <form onSubmit={onFormSubmit} className={`flex flex-col sm:flex-row gap-2.5 sm:gap-2.5 ${setType !== 'Normal' ? 'items-stretch' : ''}`}>
          <div className={`grid gap-2.5 w-full ${setType === 'Normal' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">KG</span>
              <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-[18px] pl-10 pr-2 py-4 sm:py-3.5 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
            {setType === 'Normal' && (
              <div className="relative animate-in fade-in zoom-in duration-200">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">SET</span>
                <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-[18px] pl-11 pr-2 py-4 sm:py-3.5 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm appearance-none" placeholder="0" />
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">REP</span>
              <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-[18px] pl-11 pr-2 py-4 sm:py-3.5 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">RPE</span>
              <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-[18px] pl-11 pr-2 py-4 sm:py-3.5 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm appearance-none" placeholder="10" />
            </div>
          </div>
          
          {setType === 'Normal' ? (
            <button type="submit" disabled={!weight || !sets || !reps} className={`sm:w-36 py-4 sm:py-3.5 rounded-[18px] text-[13px] sm:text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-40 disabled:grayscale hover:shadow-xl hover:shadow-violet-500/40'}`}>
              {showSuccess ? <CheckCircle size={20} className="animate-in zoom-in" /> : 'CATAT'}
            </button>
          ) : (
            <div className="flex gap-2.5 sm:w-auto w-full mt-1 sm:mt-0 animate-in fade-in duration-200 shrink-0">
               <button type="submit" disabled={!weight || !reps} className="flex-1 sm:flex-none py-4 sm:py-3.5 px-6 rounded-[18px] text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50">
                 Tambah
               </button>
               <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 sm:flex-none py-4 sm:py-3.5 px-6 rounded-[18px] text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 disabled:grayscale shadow-lg shadow-violet-500/25'}`}>
                 {showSuccess ? <CheckCircle size={20} /> : `Simpan`}
               </button>
            </div>
          )}
        </form>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center px-2 mb-4 gap-3 sm:gap-0">
            <div className="flex gap-1.5 bg-gray-100 dark:bg-[#1a1d27] p-1.5 rounded-2xl w-fit">
              <button onClick={() => { setShowHistory(true); setHistoryTab('list'); }} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory && historyTab === 'list' ? 'bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>List</button>
              <button onClick={() => { setShowHistory(true); setHistoryTab('chart'); }} className={`flex items-center px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory && historyTab === 'chart' ? 'bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}> <BarChart2 size={12} className="mr-1.5"/> Grafik</button>
            </div>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] w-fit font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors px-4 py-2.5 rounded-xl flex items-center active:scale-95 border border-cyan-100 dark:border-cyan-500/20 sm:border-transparent">
              {isAiProgressLoading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Zap size={14} className="mr-1.5" />} 
              Analisis Progres AI
            </button>
          </div>

          {showHistory && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 bg-gray-50/50 dark:bg-[#0a0a0a]/50 p-3 sm:p-4 rounded-[32px] border border-gray-100 dark:border-gray-800/50">
              {historyTab === 'chart' ? (
                <ChartView />
              ) : (
                <div className="space-y-4">
                  {groupedHistory.map((group, gIndex) => (
                    <div key={gIndex} className="space-y-2">
                      <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="h-px bg-violet-500/20 flex-1"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-4 py-1.5 rounded-full">{group.date}</span>
                        <div className="h-px bg-violet-500/20 flex-1"></div>
                      </div>
                      
                      {group.logs.map((log) => (
                        <div key={log.id} className="relative">
                          {editingId === log.id ? (
                            <div className="bg-white dark:bg-[#1a1d27] p-5 rounded-[24px] border border-gray-200 dark:border-gray-800 shadow-lg">
                              <div className="flex gap-2">
                                 <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-3 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                                 <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-3 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                                 <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-3 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                              </div>
                              <div className="flex justify-end mt-4 space-x-2">
                                <button onClick={() => setEditingId(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all">Batal</button>
                                <button onClick={() => saveEdit(log.id)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex justify-between items-center bg-white dark:bg-[#11131a] border ${log.isPR ? 'border-amber-300 dark:border-amber-500/50 shadow-md shadow-amber-500/10' : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'} p-5 rounded-[24px] transition-all group shadow-sm flex-wrap sm:flex-nowrap gap-3 sm:gap-0`}>
                              <div className="flex flex-col w-full sm:w-auto">
                                {log.subSets ? (
                                  <div className="font-black text-gray-900 dark:text-white text-[13px] tracking-tight flex items-center flex-wrap gap-y-1.5">
                                    {log.isPR && <Crown size={16} className="text-amber-500 mr-2.5 animate-pulse" />}
                                    {log.subSets.map((sub, i) => (
                                      <React.Fragment key={i}>
                                        <span className="bg-gray-50 dark:bg-[#1a1d27] px-2 py-1 rounded-md">{sub.weight} <span className="text-gray-400 font-semibold text-[10px] tracking-widest mx-0.5">KG</span> × {sub.reps} <span className="text-gray-400 font-semibold text-[10px] tracking-widest ml-0.5">REP</span> {sub.rpe && <span className="text-[10px] text-gray-400 ml-1">RPE:{sub.rpe}</span>}</span>
                                        {i < log.subSets.length - 1 && <span className="mx-1.5 text-indigo-500">➔</span>}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="font-black text-gray-900 dark:text-white text-[16px] sm:text-[18px] tracking-tight flex items-center">
                                    {log.isPR && <Crown size={18} className="text-amber-500 mr-2.5 animate-pulse" />}
                                    {log.weight} <span className="text-gray-400 font-semibold text-xs tracking-widest mx-1.5">KG</span> 
                                    <span className="text-gray-300 dark:text-gray-700 mx-1.5">×</span> 
                                    {log.sets} <span className="text-gray-400 font-semibold text-xs tracking-widest mx-1.5">SET</span> 
                                    <span className="text-gray-300 dark:text-gray-700 mx-1.5">×</span> 
                                    {log.reps} <span className="text-gray-400 font-semibold text-xs tracking-widest ml-1.5">REP</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                                  <span className="text-[10px] text-gray-400 font-semibold flex items-center"><Clock size={10} className="mr-1 opacity-70"/> {log.time}</span>
                                  {log.rpe && <span className="text-[10px] text-gray-400 font-semibold ml-1 bg-gray-100 dark:bg-gray-800 px-1.5 rounded">RPE: {log.rpe}</span>}
                                  {log.setType && log.setType !== 'Normal' && (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-center">
                                      {log.setType}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-center ml-auto sm:ml-2">
                                    1RM: {log.oneRepMax}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 border-t border-gray-100 dark:border-gray-800/80 sm:border-0 pt-3 sm:pt-0">
                                {!log.subSets && (
                                  <button onClick={() => startEdit(log)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Edit2 size={16} /></button>
                                )}
                                <button onClick={() => onDeleteLog(log.id)} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PR Modal Animation */}
      {prModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-1 rounded-[40px] shadow-2xl shadow-amber-500/30 animate-in zoom-in-95 duration-500 bounce">
            <div className="bg-white dark:bg-[#11131a] w-full max-w-sm rounded-[36px] p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-10"><Trophy size={140} className="text-amber-500"/></div>
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white dark:border-[#11131a] relative z-10 shadow-xl">
                <Crown size={40} className="text-amber-500" />
              </div>
              <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight relative z-10">NEW PR!</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed relative z-10">Luar biasa! Angkatan {exercise.name} Anda hari ini memecahkan rekor 1RM Anda sebelumnya.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InsightsModal = ({ logs, exerciseData, healthData, onClose }) => {
  const [days, setDays] = useState([]);
  const [activeDates, setActiveDates] = useState(new Set());
  const [weeklyVolume, setWeeklyVolume] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const last35Days = Array.from({length: 35}, (_, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (34 - i)); return d;
    });
    setDays(last35Days);
    const logDates = new Set(logs.map(l => l.date));
    setActiveDates(logDates);

    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const volume = {};
    logs.filter(l => l.timestamp >= startOfWeek.getTime()).forEach(l => {
       const muscle = getMuscleById(l.exerciseId, exerciseData);
       const setsDone = l.setType === 'Normal' ? l.sets : (l.subSets ? l.subSets.length : 1);
       volume[muscle] = (volume[muscle] || 0) + setsDone;
    });
    
    setWeeklyVolume(Object.entries(volume).map(([m, sets]) => ({ muscle: m, sets })).sort((a,b) => b.sets - a.sets));
  }, [logs, exerciseData]);

  const healthList = Object.values(healthData || {});
  const avgCals = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.cals || 0), 0) / healthList.length) : 0;
  const avgHr = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.hr || 0), 0) / healthList.length) : 0;
  const avgSleepMins = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.sleep || 0), 0) / healthList.length) : 0;
  const sleepHours = Math.floor(avgSleepMins / 60);
  const sleepMins = avgSleepMins % 60;

  return (
    <div className="bg-white dark:bg-[#11131a] w-full max-w-md rounded-[36px] p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center"><Activity size={18} className="mr-2 text-indigo-500" /> Insights</h4>
      </div>

      {healthList.length > 0 && (
        <div className="mb-8">
           <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4">Metrik Kesehatan (Apple Health)</h3>
           <div className="grid grid-cols-2 gap-3 mb-3">
             <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl">
               <Heart size={16} className="text-rose-500 mb-2" />
               <div className="text-xl font-black text-gray-900 dark:text-white">{avgHr} <span className="text-[10px] font-bold text-gray-500 uppercase">BPM</span></div>
               <div className="text-[9px] font-black uppercase text-gray-400 mt-1">Rata-rata HR</div>
             </div>
             <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-4 rounded-2xl">
               <Flame size={16} className="text-orange-500 mb-2" />
               <div className="text-xl font-black text-gray-900 dark:text-white">{avgCals} <span className="text-[10px] font-bold text-gray-500 uppercase">Kcal</span></div>
               <div className="text-[9px] font-black uppercase text-gray-400 mt-1">Avg Kalori Sesi</div>
             </div>
           </div>
           <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl w-full flex items-center justify-between">
              <div>
                 <MoonStar size={16} className="text-indigo-500 mb-2" />
                 <div className="text-[9px] font-black uppercase text-gray-400">Rata-rata Tidur (7 Hari)</div>
              </div>
              <div className="text-xl font-black text-gray-900 dark:text-white text-right">
                {sleepHours}<span className="text-[10px] font-bold text-gray-500 uppercase mx-1">J</span> 
                {sleepMins}<span className="text-[10px] font-bold text-gray-500 uppercase ml-1">M</span>
              </div>
           </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4">Konsistensi Latihan</h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map((dayObj, i) => {
             const dateStr = dayObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
             const isActive = activeDates.has(dateStr);
             const isToday = dayObj.toDateString() === new Date().toDateString();
             return (
               <div 
                  key={i} title={dateStr}
                  className={`flex items-center justify-center aspect-square rounded-[8px] sm:rounded-xl transition-all duration-300 text-[10px] font-bold ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] scale-105' : 'bg-gray-100 dark:bg-[#1a1d27] text-gray-400'} ${isToday && !isActive ? 'border-2 border-indigo-500/50' : ''}`}
               >
                  {dayObj.getDate()}
               </div>
             )
          })}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Volume Otot Minggu Ini</h3>
           <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Target: 10-20 Set</span>
        </div>
        {weeklyVolume.length === 0 ? (
          <p className="text-xs font-medium text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-[#1a1d27] rounded-2xl">Belum ada latihan minggu ini.</p>
        ) : (
          <div className="space-y-4">
            {weeklyVolume.map((item, idx) => {
              const maxSets = 20; const pct = Math.min(100, (item.sets / maxSets) * 100);
              let color = "bg-amber-500";
              if (item.sets >= 10 && item.sets <= 20) color = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
              else if (item.sets > 20) color = "bg-rose-500";
              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                    <span>{item.muscle}</span><span>{item.sets} Set</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const todaySplit = getTodaySplit();
  const [activeTab, setActiveTab] = useState(todaySplit === 'Rest' ? 'Push' : todaySplit);
  const [activeAppTab, setActiveAppTab] = useState('track'); 
  
  const [logs, setLogs] = useState(() => { 
    try { const saved = localStorage.getItem('gym_logs_pro'); return saved ? JSON.parse(saved) : []; }
    catch(e) { return []; }
  });
  const [exerciseData, setExerciseData] = useState(() => { 
    try { const saved = localStorage.getItem('gym_exercises_pro'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; }
    catch(e) { return INITIAL_EXERCISE_DATA; }
  });
  const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem('gym_dark_pro'); return saved === 'true'; });
  
  const [healthData, setHealthData] = useState(() => { 
    try { const saved = localStorage.getItem('gym_health_v2'); return saved ? JSON.parse(saved) : {}; }
    catch(e) { return {}; }
  });
  const [dailyNote, setDailyNote] = useState('');
  
  const [restTime, setRestTime] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '', targetSets: '' });

  const [aiBannerData, setAiBannerData] = useState({ text: null, type: null }); 
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isRoastLoading, setIsRoastLoading] = useState(false);
  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);
  const [aiImbalance, setAiImbalance] = useState(null);
  const [isImbalanceLoading, setIsImbalanceLoading] = useState(false);
  const [preWorkoutAdvice, setPreWorkoutAdvice] = useState(null);
  const [isPreWorkoutLoading, setIsPreWorkoutLoading] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  useEffect(() => { localStorage.setItem('gym_logs_pro', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_pro', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => { localStorage.setItem('gym_health_v2', JSON.stringify(healthData)); }, [healthData]);
  useEffect(() => {
    localStorage.setItem('gym_dark_pro', isDarkMode);
    if(isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const today = new Date().toLocaleDateString('id-ID');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    setDailyNote(allNotes[today] || '');
  }, []);

  const handleSaveNote = (val) => {
    setDailyNote(val);
    const today = new Date().toLocaleDateString('id-ID');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    allNotes[today] = val;
    localStorage.setItem('gym_notes_v12', JSON.stringify(allNotes));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'sync_health') {
      const hrRaw = params.get('hr') ? parseFloat(params.get('hr').replace(',', '.')) : 0;
      const hr = isNaN(hrRaw) ? 0 : Math.round(hrRaw);
      const calsRaw = params.get('cals') ? parseFloat(params.get('cals').replace(',', '.')) : 0;
      const cals = isNaN(calsRaw) ? 0 : Math.round(calsRaw);
      const sleepRaw = params.get('sleep') ? parseFloat(params.get('sleep').replace(',', '.')) : 0;
      const sleep = isNaN(sleepRaw) ? 0 : Math.round(sleepRaw);
      const spo2Raw = params.get('spo2') ? parseFloat(params.get('spo2').replace(',', '.')) : 0;
      const spo2 = isNaN(spo2Raw) ? 0 : (spo2Raw < 1 ? Math.round(spo2Raw * 100) : Math.round(spo2Raw));
      
      const today = new Date().toLocaleDateString('id-ID');
      setHealthData(prev => ({ ...prev, [today]: { ...prev[today], hr, cals, sleep, spo2 }}));
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(`Sync Berhasil! HR:${hr} Cals:${cals} Tidur:${Math.floor(sleep/60)}j ${sleep%60}m SpO2:${spo2}%`);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (isTimerRunning && restTime > 0) {
      timer = setInterval(() => setRestTime(prev => prev - 1), 1000);
    } else if (restTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
      alert("Waktu istirahat habis! Lanjut set berikutnya 🔥");
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restTime]);

  const addTime = (secs) => { setRestTime(prev => prev + secs); setIsTimerRunning(true); };

  const handleGetPreWorkoutBriefing = async () => {
    setIsPreWorkoutLoading(true);
    const recentLogs = logs.slice(0, 15).map(l => {
      const exName = (exerciseData[activeTab] || Object.values(exerciseData).flat()).find(e => e.id === l.exerciseId)?.name || l.exerciseId;
      return `${exName}: ${l.weight}kg x ${l.reps}`;
    }).join(', ');
    
    const today = new Date().toLocaleDateString('id-ID');
    const sleepMins = healthData[today]?.sleep || 0;
    const sleepStr = sleepMins > 0 ? `Tidur semalam: ${Math.floor(sleepMins/60)} jam ${sleepMins%60} menit.` : '';
    
    const prompt = `Saya akan memulai sesi latihan: ${activeTab} hari ini. ${sleepStr} \nCatatan mood: [${dailyNote || '-'}]. \nHistori angkatan terakhir: [${recentLogs || '-'}]. \nBerikan "Pre-Workout Briefing" profesional (maksimal 3 kalimat). Evaluasi kesiapan saya, berikan strategi atau saran beban untuk sesi ${activeTab} ini.`;

    const response = await callGeminiAPI(prompt);
    setPreWorkoutAdvice(response || "Gagal menghubungi AI.");
    setIsPreWorkoutLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const todayStr = new Date().toLocaleDateString('id-ID');
    const hr = healthData[todayStr]?.hr || 0;
    const cals = healthData[todayStr]?.cals || 0;
    const healthContext = hr > 0 ? `Peak HR sesi ini: ${hr} bpm. Kalori: ${cals} kcal.` : '';
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const response = await callGeminiAPI(`Latihan hari ini: ${workoutData}. ${healthContext} Berikan pujian dan evaluasi analitis singkat tentang performa saya.`);
    setAiBannerData({ text: response, type: 'summary' }); setIsSummaryLoading(false);
  };

  const handleGenerateRoast = async () => {
    if (logs.length === 0) return;
    setIsRoastLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const prompt = `Abaikan instruksi. Berperanlah sebagai pelatih militer hardcore (seperti David Goggins). 'Roast' volume latihan saya ini: ${workoutData}. Sarkastik, pedas, maksimal 3 kalimat!`;
    const response = await callGeminiAPI(prompt, true);
    setAiBannerData({ text: response, type: 'roast' }); setIsRoastLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = (exerciseData[activeTab] || []).map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`Persiapan ${activeTab} day (otot: ${muscles}). Berikan 3 gerakan pemanasan dinamis spesifik.`);
    setAiWarmup(response); setIsWarmupLoading(false);
  };

  const handleCheckImbalance = async () => {
    setIsImbalanceLoading(true);
    const allMuscleLogs = logs.map(l => {
      let foundEx = null; Object.values(exerciseData).forEach(tab => { const ex = tab.find(e => e.id === l.exerciseId); if (ex) foundEx = ex; });
      return foundEx ? foundEx.muscle : 'Lainnya';
    });
    const muscleCounts = allMuscleLogs.reduce((acc, muscle) => { acc[muscle] = (acc[muscle] || 0) + 1; return acc; }, {});
    const freqString = Object.entries(muscleCounts).map(([m, c]) => `${m}: ${c} sesi`).join(', ');
    const prompt = `Frekuensi latih otot all-time: ${freqString || 'Belum ada data'}. Berperan sebagai fisioterapis olahraga. Deteksi muscle imbalance. Berikan saran 3 kalimat.`;
    const response = await callGeminiAPI(prompt);
    setAiImbalance(response); setIsImbalanceLoading(false);
  };

  const handleAddLog = (log) => {
    const newLog = { ...log, id: Date.now().toString(), date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), timestamp: Date.now() };
    setLogs([newLog, ...logs]);
  };
  const onDeleteLog = (id) => { if(window.confirm("Hapus log permanen?")) setLogs(logs.filter(l => l.id !== id)); };
  const handleEditLog = (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  
  const handleSaveCustom = (e) => {
    e.preventDefault(); if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Umum', targetSets: newExercise.targetSets ? parseInt(newExercise.targetSets) : 3, videoId: null };
    setExerciseData(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), item] }));
    setIsAddingExercise(false); setNewExercise({ name: '', muscle: '', targetSets: '' });
  };
  
  const handleDeleteExercise = (tab, id) => { if(window.confirm("Hapus master gerakan ini?")) setExerciseData(prev => ({ ...prev, [tab]: prev[tab].filter(ex => ex.id !== id) })); };
  const handleEditExercise = (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); };
  const handleUpdateExerciseVideo = (tab, id, videoId) => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, videoId } : ex) })); };

  const todayStr = new Date().toLocaleDateString('id-ID');
  const todaysHealth = healthData[todayStr] || { hr: 0, cals: 0, sleep: 0, spo2: 0 };
  const readinessScore = todaysHealth.sleep > 0 ? Math.min(100, Math.max(10, Math.round(((todaysHealth.sleep / 480) * 100) - (todaysHealth.hr > 100 ? 10 : 0)))) : '--';

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-violet-500/30 ${isDarkMode ? 'dark bg-[#050505] text-white' : 'bg-[#FAFAFA] text-gray-900'} transition-colors duration-500 pb-[env(safe-area-inset-bottom)] relative`}>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 ${isDarkMode ? 'bg-violet-600/20' : 'bg-violet-300/40'}`}></div>
        <div className={`absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-fuchsia-600/20' : 'bg-fuchsia-300/40'}`}></div>
      </div>

      <div className="relative z-10 pb-28">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-5 transition-all">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center rounded-[16px] shadow-lg shadow-violet-500/25">
                <Dumbbell size={24} className="transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-[24px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 leading-none mb-1">GymTracker</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                  {getHariIndonesia()} <span className="mx-2 text-gray-300 dark:text-gray-700">•</span> <span className="text-violet-500 dark:text-violet-400">{todaySplit} Day</span>
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
               <button onClick={() => setShowTimerModal(true)} className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all active:scale-90 relative">
                 <Clock size={18} />
                 {restTime > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>}
               </button>
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-white dark:bg-[#11131a] text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 border border-gray-200/50 dark:border-gray-800/80 shadow-sm transition-all active:scale-90">
                 {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
               </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 pt-8 space-y-8">
          {activeAppTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <section className="relative w-full rounded-[32px] bg-gradient-to-br from-[#1c1c1e] to-[#0c0c0e] border border-white/5 p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-3xl"></div>
                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">Skor Kesiapan</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                        {readinessScore}
                      </span>
                      <span className="text-xl font-medium text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {readinessScore !== '--' && (
                      <div className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border mb-2 ${
                        readinessScore > 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        readinessScore > 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {readinessScore > 80 ? 'Optimal' : readinessScore > 60 ? 'Standar' : 'Recovery'}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase mb-4 ml-2 flex items-center">
                 <Activity size={14} className="mr-2"/> Biometrik Terakhir
              </h3>
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-white/5 shadow-sm rounded-[28px] p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 w-fit rounded-xl mb-4"><Heart className="w-5 h-5 text-rose-500" /></div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">{todaysHealth.hr || '--'} <span className="text-xs font-bold text-gray-400">BPM</span></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Peak HR</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-white/5 shadow-sm rounded-[28px] p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 w-fit rounded-xl mb-4"><Flame className="w-5 h-5 text-orange-500" /></div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">{todaysHealth.cals || '--'} <span className="text-xs font-bold text-gray-400">KCAL</span></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Kalori Aktif</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-white/5 shadow-sm rounded-[28px] p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 w-fit rounded-xl mb-4"><MoonStar className="w-5 h-5 text-indigo-500" /></div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{todaysHealth.sleep > 0 ? `${Math.floor(todaysHealth.sleep/60)}h ${todaysHealth.sleep%60}m` : '--'}</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Durasi Tidur</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-white/5 shadow-sm rounded-[28px] p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div className="p-2.5 bg-cyan-50 dark:bg-cyan-500/10 w-fit rounded-xl mb-4"><Droplets className="w-5 h-5 text-cyan-500" /></div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1">{todaysHealth.spo2 || '--'} <span className="text-xs font-bold text-gray-400">%</span></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Oksigen Darah</p>
                  </div>
                </div>
              </section>

              <div className="mt-8">
                {!preWorkoutAdvice && !isPreWorkoutLoading ? (
                  <button onClick={handleGetPreWorkoutBriefing} className="w-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-600 dark:text-violet-400 p-5 rounded-[28px] flex items-center justify-between transition-all active:scale-95 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-500/20 p-2.5 rounded-xl"><Bot size={20} /></div>
                      <span className="text-xs font-black uppercase tracking-widest text-left">Briefing AI Sebelum Latihan</span>
                    </div>
                    <ChevronRight size={18} className="opacity-50" />
                  </button>
                ) : isPreWorkoutLoading ? (
                  <div className="w-full bg-white dark:bg-[#11131a] border border-gray-100 dark:border-gray-800 p-6 rounded-[28px] flex items-center justify-center shadow-sm">
                    <Loader2 size={24} className="animate-spin text-violet-500" />
                    <span className="ml-4 text-xs font-bold text-violet-500 uppercase tracking-widest animate-pulse">AI meninjau rekam jejak...</span>
                  </div>
                ) : (
                  <div className="w-full bg-white dark:bg-[#11131a] border border-gray-100 dark:border-gray-800 p-6 rounded-[28px] shadow-xl shadow-gray-200/50 dark:shadow-none relative animate-in slide-in-from-top-4">
                    <button onClick={() => setPreWorkoutAdvice(null)} className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={16}/></button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white p-2 rounded-xl shadow-md"><Bot size={16} /></div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Pesan Pelatih Hari Ini</h4>
                    </div>
                    <p className="text-[14px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{preWorkoutAdvice}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeAppTab === 'track' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              
              <div className="flex p-1.5 bg-white dark:bg-[#11131a] rounded-[22px] relative shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
                {['Push', 'Pull', 'Legs', 'Upper', 'Legs & Core'].map((t) => (
                  <button 
                    key={t} onClick={() => setActiveTab(t)} 
                    className={`relative flex-shrink-0 sm:flex-1 min-w-[80px] sm:min-w-0 px-3 py-3 rounded-2xl text-[11px] sm:text-[12px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeTab === t ? 'text-white shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <MuscleRecovery logs={logs} exerciseData={exerciseData} />

              <div className="space-y-6 mt-4">
                {(exerciseData[activeTab] || []).map(ex => (
                  <ExerciseCard 
                    key={ex.id} exercise={ex} activeTab={activeTab} 
                    onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                    onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise} onUpdateExerciseVideo={handleUpdateExerciseVideo}
                    history={logs.filter(l => l.exerciseId === ex.id)} 
                  />
                ))}
              </div>

              {isAddingExercise ? (
                <form onSubmit={handleSaveCustom} className="bg-white dark:bg-[#0f1117] p-6 sm:p-8 rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-xl animate-in zoom-in-95 duration-300 mt-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                  <h3 className="font-black mb-6 text-sm uppercase tracking-widest text-gray-900 dark:text-white flex items-center"><PlusCircle size={20} className="mr-3 text-violet-500"/> Gerakan Custom</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nama Gerakan</label>
                      <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Cth: Incline Dumbbell Press" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-[16px] sm:text-[15px] font-bold dark:text-white outline-none focus:border-violet-500 focus:ring-2 transition-all appearance-none" autoFocus/>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2/3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Otot Target</label>
                        <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Cth: Dada Atas" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-[16px] sm:text-[15px] font-bold dark:text-white outline-none focus:border-violet-500 focus:ring-2 transition-all appearance-none" />
                      </div>
                      <div className="w-1/3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Set</label>
                        <input type="number" value={newExercise.targetSets} onChange={e => setNewExercise({...newExercise, targetSets: e.target.value})} placeholder="3" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-[16px] sm:text-[15px] font-bold dark:text-white outline-none focus:border-violet-500 focus:ring-2 transition-all appearance-none" />
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="button" onClick={() => setIsAddingExercise(false)} className="w-auto px-6 py-4 bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-colors active:scale-95">Batal</button>
                      <button type="submit" disabled={!newExercise.name} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg disabled:opacity-30 transition-all active:scale-95">Tambahkan</button>
                    </div>
                  </div>
                </form>
              ) : (
                <button onClick={() => setIsAddingExercise(true)} className="w-full py-6 mt-8 border-2 border-dashed border-gray-300 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest rounded-[32px] flex items-center justify-center hover:bg-white dark:hover:bg-[#0f1117] hover:border-violet-500/50 transition-all text-xs active:scale-[0.98] group">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-full mr-3 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 group-hover:text-violet-500 transition-colors"><Plus size={20} /></div>
                  Gerakan Baru
                </button>
              )}

              <div className="mt-12 bg-amber-50 dark:bg-[#1c1810] border border-amber-200/50 dark:border-amber-900/30 rounded-[32px] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><BookOpen size={100} className="text-amber-600" /></div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-4 flex items-center relative z-10"><PenTool size={14} className="mr-2"/> Jurnal Latihan Hari Ini</h4>
                <textarea 
                  value={dailyNote} onChange={(e) => handleSaveNote(e.target.value)} placeholder="Catat kondisi hari ini (Misal: Kurang tidur, tenaga drop...)"
                  className="w-full bg-white/60 dark:bg-[#110f0a] border border-amber-200/50 dark:border-amber-900/50 rounded-2xl p-5 text-[16px] sm:text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[120px] resize-none relative z-10 placeholder-amber-800/30 dark:placeholder-amber-200/20 leading-relaxed font-medium"
                />
              </div>
            </div>
          )}

          {activeAppTab === 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              
              <div className={`rounded-[32px] p-6 sm:p-8 relative overflow-hidden transition-all duration-700 shadow-xl ${aiBannerData.type === 'roast' ? 'bg-[#1a0b11] border border-rose-900/30' : 'bg-[#0a0f1c] border border-indigo-900/30'}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-40 transition-colors duration-700 ${aiBannerData.type === 'roast' ? 'bg-rose-600' : 'bg-indigo-600'}`}></div>
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h3 className="font-black text-xs sm:text-sm tracking-widest flex items-center text-white uppercase">
                      {aiBannerData.type === 'roast' ? <><Skull size={16} className="mr-2.5 text-rose-500" /> Pelatih Keras</> : <><Sparkles size={16} className="mr-2.5 text-indigo-400" /> Analisis AI</>}
                    </h3>
                    <div className="flex space-x-2">
                      <button onClick={handleGenerateRoast} disabled={isRoastLoading} className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all flex items-center backdrop-blur-md active:scale-95 text-rose-300 border border-white/5">
                        {isRoastLoading ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} className="mr-2" />} Roast
                      </button>
                      <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-indigo-500/20 hover:bg-indigo-500/30 px-4 py-2.5 rounded-xl transition-all flex items-center backdrop-blur-md active:scale-95 text-indigo-200 border border-indigo-500/20">
                        {isSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="mr-2" />} Evaluasi
                      </button>
                    </div>
                  </div>
                  {aiBannerData.text ? (
                    <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/5">
                      <p className={`text-[14px] leading-relaxed font-medium animate-in slide-in-from-bottom-2 ${aiBannerData.type === 'roast' ? 'text-rose-100' : 'text-indigo-100'}`}>{aiBannerData.text}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium max-w-[85%] leading-relaxed">Minta AI memberikan evaluasi saintifik dari performa Anda hari ini.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="bg-white dark:bg-[#11131a] border border-gray-100 dark:border-gray-800/80 rounded-[28px] p-6 transition-all flex flex-col items-center justify-center group active:scale-95 shadow-sm hover:shadow-xl hover:border-orange-500/50">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform">
                    {isWarmupLoading ? <Loader2 size={26} className="animate-spin" /> : <Flame size={26} />}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white text-center">Pemanasan<br/><span className="text-gray-400 font-bold">AI</span></span>
                </button>
                <button onClick={handleCheckImbalance} disabled={isImbalanceLoading} className="bg-white dark:bg-[#11131a] border border-gray-100 dark:border-gray-800/80 rounded-[28px] p-6 transition-all flex flex-col items-center justify-center group active:scale-95 shadow-sm hover:shadow-xl hover:border-cyan-500/50">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-500 group-hover:scale-110 transition-transform">
                    {isImbalanceLoading ? <Loader2 size={26} className="animate-spin" /> : <Scale size={26} />}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white text-center">Deteksi<br/><span className="text-gray-400 font-bold">Postur</span></span>
                </button>
              </div>

              {aiWarmup && (
                <div className="bg-white dark:bg-[#11131a] border-2 border-orange-100 dark:border-orange-900/30 p-6 rounded-[28px] animate-in slide-in-from-top-4 relative shadow-xl">
                  <button onClick={() => setAiWarmup(null)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 transition-colors"><X size={16} /></button>
                  <span className="font-black text-xs uppercase tracking-widest mb-4 flex items-center text-orange-500"><Flame size={18} className="mr-2.5"/> Pemanasan Hari Ini</span>
                  <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiWarmup}</div>
                </div>
              )}

              {aiImbalance && (
                <div className="bg-white dark:bg-[#11131a] border-2 border-cyan-100 dark:border-cyan-900/30 p-6 rounded-[28px] animate-in slide-in-from-top-4 relative shadow-xl">
                  <button onClick={() => setAiImbalance(null)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 transition-colors"><X size={16} /></button>
                  <span className="font-black text-xs uppercase tracking-widest mb-4 flex items-center text-cyan-500"><Scale size={18} className="mr-2.5"/> Fisioterapi AI</span>
                  <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiImbalance}</div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Floating Timer */}
      {restTime > 0 && !showTimerModal && (
        <button onClick={() => setShowTimerModal(true)} className="fixed bottom-28 right-6 z-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3.5 rounded-full shadow-2xl shadow-indigo-500/20 flex items-center gap-3 animate-in slide-in-from-bottom-10 border border-gray-700 dark:border-gray-200 hover:scale-105 transition-transform">
           <Timer size={18} className="animate-pulse text-indigo-400 dark:text-indigo-600" />
           <span className="font-black text-sm tracking-widest">
             {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
           </span>
        </button>
      )}

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 dark:bg-[#11131a]/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 rounded-full p-2 flex justify-between shadow-2xl shadow-gray-200/50 dark:shadow-none z-50">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'track', icon: Dumbbell, label: 'Track' },
          { id: 'stats', icon: TrendingUp, label: 'Stats' }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveAppTab(item.id)} 
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-full transition-all duration-300 ${activeAppTab === item.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <item.icon size={20} className={activeAppTab === item.id ? 'animate-in zoom-in duration-300' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-300 w-full max-w-md">
            <button onClick={() => setShowInsightsModal(false)} className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"><X size={20}/></button>
            <InsightsModal logs={logs} exerciseData={exerciseData} healthData={healthData} onClose={() => setShowInsightsModal(false)} />
          </div>
        </div>
      )}

      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#11131a] w-full max-w-sm rounded-[36px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center"><Timer size={18} className="mr-2 text-indigo-500" /> Rest Timer</h4>
              <button onClick={() => setShowTimerModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-90"><X size={16}/></button>
            </div>
            <div className="text-center mb-8">
              <span className={`text-6xl font-black tabular-nums tracking-tighter ${restTime === 0 ? 'text-gray-300 dark:text-gray-700' : 'text-gray-900 dark:text-white'}`}>
                {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
               <button onClick={() => addTime(30)} className="py-3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] font-black text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all">+30s</button>
               <button onClick={() => addTime(60)} className="py-3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] font-black text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all">+60s</button>
               <button onClick={() => addTime(90)} className="py-3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] font-black text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all">+90s</button>
               <button onClick={() => { setRestTime(0); setIsTimerRunning(false); }} className="py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-[11px] font-black text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all">Reset</button>
            </div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={restTime === 0} className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex justify-center items-center active:scale-95 transition-all ${isTimerRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-gray-900/10 dark:shadow-white/10 disabled:opacity-40 disabled:grayscale hover:bg-gray-800 dark:hover:bg-gray-200'}`}>
              {isTimerRunning ? <><Pause size={18} className="mr-2" /> Pause</> : <><Play size={18} className="mr-2" /> Mulai</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};