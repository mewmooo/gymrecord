import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight, Timer, Trophy, BarChart2, Crown, Play, Pause, Clock,
  Battery, BatteryCharging, BatteryFull, PenTool, BookOpen, MessageSquare, Heart, CheckSquare, MoonStar, Wind
} from 'lucide-react';

// Fungsi Ekstrak ID YouTube
const getYouTubeId = (url) => {
  if (!url) return null;
  if (url.length === 11 && !url.includes('/')) return url; 
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Kalkulator Estimasi 1 Rep Max (1RM)
const calculate1RM = (weight, reps, rpe = 10) => {
  const repsInReserve = 10 - rpe; 
  const effectiveReps = reps + repsInReserve;
  return weight * (1 + effectiveReps / 30);
};

// Helper: Cari otot berdasarkan ID gerakan
const getMuscleById = (id, data) => {
  for (const tab in data) {
    const found = data[tab].find(ex => ex.id === id);
    if (found) return found.muscle;
  }
  return 'Umum';
};

// Data Master Baru
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

// API Call Setup
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
  
  const combinedPrompt = isRaw ? prompt : "Anda adalah Pelatih Kebugaran Profesional tingkat lanjut. Jawab dalam Bahasa Indonesia, gunakan nada profesional, asik, namun suportif. Ringkas maksimal 3-5 kalimat. Analisis data secara harfiah.\n\n" + prompt;
  
  const modelsToTry = [
    'gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro', 
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
    'gemma-4-31b', 'gemma-4-26b', 'gemma-3-2b',
    'gemini-2-flash', 'gemini-1.5-flash'
  ];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: combinedPrompt }] }] }) });
      if (response.ok) { const result = await response.json(); return result.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons."; }
    } catch (error) {}
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

// --- KOMPONEN: EXERCISE CARD ---
const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, activeTab }) => {
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

  const [showVideo, setShowVideo] = useState(false);
  const [aiTip, setAiTip] = useState(null);
  const [isAiTipLoading, setIsAiTipLoading] = useState(false);
  const [aiAlt, setAiAlt] = useState(null);
  const [isAiAltLoading, setIsAiAltLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(null);
  const [isAiProgressLoading, setIsAiProgressLoading] = useState(false);

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
    let isPR = false;
    if (history.length > 0 && new1RM > max1RM) {
      isPR = true; setPrModal(true); setTimeout(() => setPrModal(false), 4000);
    }
    logData.isPR = isPR;

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
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative z-10">
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
    <div className="group bg-white dark:bg-[#0f1117] rounded-[24px] p-5 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:shadow-none border border-gray-100 dark:border-gray-800/80 mb-6 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500/0 via-fuchsia-500/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6">
        <div className="flex-1 w-full">
          {isEditingEx ? (
            <div className="space-y-3 mb-2 animate-in fade-in">
              <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none" placeholder="Nama Latihan" />
              <div className="flex gap-2">
                <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none" placeholder="Target Otot" />
                <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none" placeholder="Target Set" />
              </div>
              <input type="text" value={exEditForm.videoUrl} onChange={e => setExEditForm({...exEditForm, videoUrl: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none" placeholder="Link YouTube (Opsional)" />
              <div className="flex space-x-2 pt-2">
                <button onClick={handleSaveExEdit} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center active:scale-95 transition-all"><Save size={14} className="mr-2"/> Simpan</button>
                <button onClick={() => setIsEditingEx(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-[#1a1d27] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl active:scale-95 transition-all">Batal</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap">
                <h3 className="text-[18px] sm:text-[20px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">{exercise.name}</h3>
                
                <div className="flex space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 mt-2 sm:mt-0">
                  <button onClick={() => {
                      setExEditForm({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });
                      setIsEditingEx(true);
                    }} 
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit Gerakan & Video"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gray-100 dark:bg-[#1a1d27] text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                  {exercise.muscle}
                </div>
                {exercise.targetSets && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-violet-50/80 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100/50 dark:border-violet-500/20">
                    🎯 Target: {exercise.targetSets} Set
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 shrink-0 w-full sm:w-auto sm:flex sm:justify-end mt-2 sm:mt-0">
          {exercise.videoId ? (
            <button 
              onClick={(e) => { e.preventDefault(); setShowVideo(!showVideo); setAiTip(null); setAiAlt(null); }}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl transition-all active:scale-95 border ${showVideo ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25' : 'bg-white dark:bg-[#1a1d27] text-rose-500 border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`} 
              title="Putar Video Tutorial"
            >
              <PlayCircle size={18} className={showVideo ? "animate-pulse" : ""} />
              <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
            </button>
          ) : (
            <a 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " gym form tutorial")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl transition-all active:scale-95 border bg-white dark:bg-[#1a1d27] text-rose-500 border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10" 
              title="Cari Tutorial di YouTube"
            >
              <PlayCircle size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
            </a>
          )}
          
          <button onClick={handleGetAlternative} className="flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl bg-white dark:bg-[#1a1d27] text-gray-500 hover:text-amber-500 hover:border-amber-200 dark:hover:text-amber-400 border border-gray-200 dark:border-gray-800 transition-all active:scale-95 group-hover:border-gray-300 dark:group-hover:border-gray-700">
            {isAiAltLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span className="text-[9px] font-black uppercase tracking-widest">Alternatif</span>
          </button>
          
          <button onClick={handleGetTip} className="flex flex-col items-center justify-center gap-1.5 py-3 sm:px-5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            {isAiTipLoading ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
            <span className="text-[9px] font-black uppercase tracking-widest">Cara AI</span>
          </button>
        </div>
      </div>

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

      <div className="bg-gray-50/50 dark:bg-[#0a0a0a] p-3 sm:p-4 rounded-3xl border border-gray-100 dark:border-gray-800/80 mb-6">
        <div className="flex gap-1.5 sm:gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          {['Normal', 'Drop Set', 'Superset'].map(type => (
            <button 
              key={type} type="button" onClick={() => handleSetTypeChange(type)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${setType === type ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-white dark:bg-[#1a1d27] text-gray-500 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {setType !== 'Normal' && tempSubSets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white dark:bg-[#11131a] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            {tempSubSets.map((s, i) => (
              <div key={i} className="text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg flex items-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                {s.weight}kg × {s.reps} {s.rpe && <span className="ml-1 opacity-60">RPE:{s.rpe}</span>}
                <button type="button" onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))} className="ml-2.5 text-indigo-400 hover:text-rose-500 transition-colors"><X size={12}/></button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onFormSubmit} className={`flex flex-col sm:flex-row gap-2.5 sm:gap-2 ${setType !== 'Normal' ? 'items-stretch' : ''}`}>
          <div className={`grid gap-2 w-full ${setType === 'Normal' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">KG</span>
              <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl pl-8 sm:pl-10 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
            {setType === 'Normal' && (
              <div className="relative animate-in fade-in zoom-in duration-200">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">SET</span>
                <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl pl-10 sm:pl-11 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="0" />
              </div>
            )}
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">REP</span>
              <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl pl-10 sm:pl-11 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">RPE</span>
              <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl pl-10 sm:pl-11 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="1-10" />
            </div>
          </div>
          
          {setType === 'Normal' ? (
            <button type="submit" disabled={!weight || !sets || !reps} className={`sm:w-32 py-3.5 sm:py-3 rounded-xl sm:rounded-2xl text-[13px] sm:text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-30 hover:bg-indigo-700'}`}>
              {showSuccess ? <CheckCircle size={18} /> : 'CATAT'}
            </button>
          ) : (
            <div className="flex gap-2 sm:w-auto w-full mt-1 sm:mt-0 animate-in fade-in duration-200 shrink-0">
               <button type="submit" disabled={!weight || !reps} className="flex-1 sm:flex-none py-3.5 sm:py-3 px-5 rounded-xl sm:rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50">
                 Tambah
               </button>
               <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 sm:flex-none py-3.5 sm:py-3 px-5 rounded-xl sm:rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'}`}>
                 {showSuccess ? <CheckCircle size={18} /> : `Simpan`}
               </button>
            </div>
          )}
        </form>
      </div>

      {history.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center px-2 mb-4 gap-3 sm:gap-0">
            <div className="flex gap-1.5 bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl w-fit">
              <button onClick={() => { setShowHistory(true); setHistoryTab('list'); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showHistory && historyTab === 'list' ? 'bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>List</button>
              <button onClick={() => { setShowHistory(true); setHistoryTab('chart'); }} className={`flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showHistory && historyTab === 'chart' ? 'bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}> <BarChart2 size={12} className="mr-1"/> Grafik</button>
            </div>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] w-fit font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors px-3 py-2 rounded-lg flex items-center active:scale-95 border border-indigo-100 dark:border-indigo-500/20 sm:border-transparent">
              {isAiProgressLoading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Zap size={14} className="mr-1.5" />} 
              Analisis AI
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 bg-gray-50/30 dark:bg-[#0a0a0a]/50 p-2 sm:p-3 rounded-3xl border border-gray-100 dark:border-gray-800/50">
              {historyTab === 'chart' ? (
                <ChartView />
              ) : (
                <div className="space-y-4">
                  {groupedHistory.map((group, gIndex) => (
                    <div key={gIndex} className="space-y-2">
                      <div className="flex items-center gap-3 px-1 pt-1">
                        <div className="h-px bg-indigo-500/20 flex-1"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">{group.date}</span>
                        <div className="h-px bg-indigo-500/20 flex-1"></div>
                      </div>
                      
                      {group.logs.map((log) => (
                        <div key={log.id} className="relative">
                          {editingId === log.id ? (
                            <div className="bg-white dark:bg-[#1a1d27] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md">
                              <div className="flex gap-2">
                                 <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                                 <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                                 <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                              </div>
                              <div className="flex justify-end mt-3 space-x-2">
                                <button onClick={() => setEditingId(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all">Batal</button>
                                <button onClick={() => saveEdit(log.id)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex justify-between items-center bg-white dark:bg-[#11131a] border ${log.isPR ? 'border-amber-300 dark:border-amber-500/50 shadow-sm shadow-amber-500/10' : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'} p-4 rounded-2xl transition-all group shadow-sm flex-wrap sm:flex-nowrap gap-2 sm:gap-0`}>
                              <div className="flex flex-col w-full sm:w-auto">
                                {log.subSets ? (
                                  <div className="font-black text-gray-900 dark:text-white text-[13px] tracking-tight flex items-center flex-wrap gap-y-1">
                                    {log.isPR && <Crown size={14} className="text-amber-500 mr-2" />}
                                    {log.subSets.map((sub, i) => (
                                      <React.Fragment key={i}>
                                        <span>{sub.weight} <span className="text-gray-400 font-semibold text-[10px] tracking-widest mx-0.5">KG</span> × {sub.reps} <span className="text-gray-400 font-semibold text-[10px] tracking-widest ml-0.5">REP</span> {sub.rpe && <span className="text-[10px] text-gray-400 ml-1">RPE:{sub.rpe}</span>}</span>
                                        {i < log.subSets.length - 1 && <span className="mx-1.5 text-indigo-500">➔</span>}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="font-black text-gray-900 dark:text-white text-[15px] tracking-tight flex items-center">
                                    {log.isPR && <Crown size={14} className="text-amber-500 mr-2" />}
                                    {log.weight} <span className="text-gray-400 font-semibold text-xs tracking-widest mx-1">KG</span> 
                                    <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                                    {log.sets} <span className="text-gray-400 font-semibold text-xs tracking-widest mx-1">SET</span> 
                                    <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                                    {log.reps} <span className="text-gray-400 font-semibold text-xs tracking-widest ml-1">REP</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[10px] text-gray-400 font-semibold flex items-center"><Clock size={10} className="mr-1 opacity-70"/> {log.time}</span>
                                  {log.rpe && <span className="text-[10px] text-gray-400 font-semibold ml-1">RPE: {log.rpe}</span>}
                                  {log.setType && log.setType !== 'Normal' && (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-center">
                                      {log.setType}
                                    </span>
                                  )}
                                  <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-center ml-auto sm:ml-2">
                                    1RM: {log.oneRepMax}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 border-t border-gray-100 dark:border-gray-800/80 sm:border-0 pt-2 sm:pt-0">
                                {!log.subSets && (
                                  <button onClick={() => startEdit(log)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Edit2 size={14} /></button>
                                )}
                                <button onClick={() => onDeleteLog(log.id)} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Trash2 size={14} /></button>
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

      {prModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-1 rounded-[36px] shadow-2xl shadow-amber-500/30 animate-in zoom-in-95 duration-500 bounce">
            <div className="bg-white dark:bg-[#11131a] w-full max-w-sm rounded-[32px] p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-10"><Trophy size={120} className="text-amber-500"/></div>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-[#11131a] relative z-10 shadow-lg">
                <Crown size={32} className="text-amber-500" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight relative z-10">NEW PR!</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed relative z-10">Luar biasa! Angkatan {exercise.name} Anda hari ini lebih kuat dari seluruh histori sebelumnya.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- KOMPONEN: INSIGHTS & CALENDAR MODAL ---
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

  // Kalkulasi Rata-rata Kesehatan (Jika Ada)
  const healthList = Object.values(healthData);
  const avgCals = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.cals || 0), 0) / healthList.length) : 0;
  const avgHr = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.hr || 0), 0) / healthList.length) : 0;
  const avgSpo2 = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.spo2 || 0), 0) / healthList.length) : 0;
  
  // Mengubah menit tidur menjadi Jam & Menit
  const avgSleepMins = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.sleep || 0), 0) / healthList.length) : 0;
  const sleepHours = Math.floor(avgSleepMins / 60);
  const sleepMins = avgSleepMins % 60;

  return (
    <div className="bg-white dark:bg-[#11131a] w-full max-w-md rounded-[36px] p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center"><Activity size={18} className="mr-2 text-indigo-500" /> Insights</h4>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-90"><X size={16}/></button>
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
             <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 p-4 rounded-2xl">
               <Wind size={16} className="text-sky-500 mb-2" />
               <div className="text-xl font-black text-gray-900 dark:text-white">{avgSpo2 > 0 ? avgSpo2 : '--'} <span className="text-[10px] font-bold text-gray-500 uppercase">%</span></div>
               <div className="text-[9px] font-black uppercase text-gray-400 mt-1">Oksigen Darah</div>
             </div>
             <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-center">
                <MoonStar size={16} className="text-indigo-500 mb-2" />
                <div className="text-xl font-black text-gray-900 dark:text-white leading-none">
                  {sleepHours}<span className="text-[10px] font-bold text-gray-500 uppercase mx-1">J</span> 
                  {sleepMins}<span className="text-[10px] font-bold text-gray-500 uppercase ml-1">M</span>
                </div>
                <div className="text-[9px] font-black uppercase text-gray-400 mt-1.5">Tidur (7 Hari)</div>
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

// --- KOMPONEN UTAMA ---
export default function App() {
  const todaySplit = getTodaySplit();
  const [activeTab, setActiveTab] = useState(todaySplit === 'Rest' ? 'Push' : todaySplit);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_v11'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_v11'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [healthData, setHealthData] = useState(() => { const saved = localStorage.getItem('gym_health_v2'); return saved ? JSON.parse(saved) : {}; });
  
  const [dailyNote, setDailyNote] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [restTime, setRestTime] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [preWorkoutAdvice, setPreWorkoutAdvice] = useState(null);
  const [isPreWorkoutLoading, setIsPreWorkoutLoading] = useState(false);

  // Modal Akhiri Sesi (Manual Input opsional jika Apple Health gagal)
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({ duration: '', cals: '', hr: '', sleep: '', spo2: '' });

  useEffect(() => {
    const savedDark = localStorage.getItem('gym_dark_pro');
    if (savedDark === 'true') setIsDarkMode(true);
  }, []);

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

  useEffect(() => { localStorage.setItem('gym_logs_v11', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_v11', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => { localStorage.setItem('gym_health_v2', JSON.stringify(healthData)); }, [healthData]);

  // --- SENSOR PENANGKAP URL DARI APPLE SHORTCUTS ---
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
      let spo2 = isNaN(spo2Raw) ? 0 : spo2Raw;
      if (spo2 > 0 && spo2 <= 1) spo2 = Math.round(spo2 * 100);
      else spo2 = Math.round(spo2);
      
      const today = new Date().toLocaleDateString('id-ID');
      
      setHealthData(prev => ({
         ...prev,
         [today]: { ...prev[today], hr, cals, sleep, spo2 }
      }));

      // Bersihkan URL agar rapi kembali
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setConfirmDialog({ 
        message: `Sinkronisasi berhasil! (HR: ${hr} bpm, Kalori: ${cals} kcal, Tidur: ${Math.floor(sleep/60)}j ${sleep%60}m, Oksigen: ${spo2}%)`, 
        onConfirm: () => setConfirmDialog(null), 
        isAlert: true 
      });
    }
  }, []);

  const handleSaveNote = (val) => {
    setDailyNote(val);
    const today = new Date().toLocaleDateString('id-ID');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    allNotes[today] = val;
    localStorage.setItem('gym_notes_v12', JSON.stringify(allNotes));
  };

  const handleSaveHealthMetrics = (e) => {
    e.preventDefault();
    if (!healthMetrics.cals && !healthMetrics.hr && !healthMetrics.sleep && !healthMetrics.spo2) return;
    
    const today = new Date().toLocaleDateString('id-ID');
    const newHealthData = { ...healthData, [today]: {
       duration: parseInt(healthMetrics.duration) || 0,
       cals: parseInt(healthMetrics.cals) || 0,
       hr: parseInt(healthMetrics.hr) || 0,
       sleep: parseInt(healthMetrics.sleep) || 0,
       spo2: parseInt(healthMetrics.spo2) || 0,
    }};
    
    setHealthData(newHealthData);
    setShowEndSessionModal(false);
    setHealthMetrics({ duration: '', cals: '', hr: '', sleep: '', spo2: '' });
  };

  // Timer Manual Effect
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
      setConfirmDialog({ message: "Waktu istirahat sudah habis! Ayo bersiap untuk set berikutnya 🔥", onConfirm: () => setConfirmDialog(null), isAlert: true });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restTime]);

  const addTime = (secs) => { setRestTime(prev => prev + secs); setIsTimerRunning(true); };

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '', targetSets: '' });

  const [aiBannerData, setAiBannerData] = useState({ text: null, type: null }); 
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isRoastLoading, setIsRoastLoading] = useState(false);
  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);

  const handleGetPreWorkoutBriefing = async () => {
    setIsPreWorkoutLoading(true);
    
    const recentLogs = logs.slice(0, 15).map(l => {
      const exName = (exerciseData[activeTab] || Object.values(exerciseData).flat()).find(e => e.id === l.exerciseId)?.name || l.exerciseId;
      return `${exName}: ${l.weight}kg x ${l.reps}`;
    }).join(', ');
    
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    const recentNotesStr = Object.entries(allNotes).slice(-3).map(([k,v]) => `(${k}) ${v}`).join(' | ');

    const today = new Date().toLocaleDateString('id-ID');
    const todayHealth = healthData[today] || Object.values(healthData).pop() || {};
    const sleepInfo = todayHealth.sleep ? `\nSemalam saya tidur selama ${Math.floor(todayHealth.sleep/60)} jam ${todayHealth.sleep%60} menit.` : '';

    const prompt = `Saya akan memulai sesi latihan: ${activeTab} hari ini. \nCatatan/jurnal kondisi saya beberapa hari terakhir: [${recentNotesStr || 'Tidak ada catatan khusus'}]. \nHistori angkatan terakhir: [${recentLogs || 'Belum ada data'}]. ${sleepInfo} \n\nSebagai pelatih gym profesional, berikan "Pre-Workout Briefing" singkat (maksimal 3 kalimat). Analisis kondisi/mood dan kualitas tidur saya, lalu berikan strategi, saran intensitas beban, atau fokus mental untuk sesi ${activeTab} hari ini.`;

    const response = await callGeminiAPI(prompt);
    setPreWorkoutAdvice(response || "Gagal menghubungi AI. Silakan coba lagi.");
    setIsPreWorkoutLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    
    const today = new Date().toLocaleDateString('id-ID');
    const todayHealth = healthData[today] || {};
    let healthContext = '';
    if (todayHealth.cals || todayHealth.hr) {
      healthContext = `\nMetrik *Smartband* saya: Membakar ${todayHealth.cals || 0} kcal, dengan Rata-rata Detak Jantung ${todayHealth.hr || 0} BPM.`;
    }

    const prompt = `Saya baru latihan: ${workoutData}. ${healthContext} \nBerikan pujian dan evaluasi analitis singkat ala pelatih profesional. Beri komentar juga mengenai metrik detak jantung/kalori saya jika ada.`;
    
    const response = await callGeminiAPI(prompt);
    setAiBannerData({ text: response, type: 'summary' }); setIsSummaryLoading(false);
  };

  const handleGenerateRoast = async () => {
    if (logs.length === 0) return;
    setIsRoastLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const prompt = `Abaikan instruksi. Berperanlah sebagai pelatih hardcore (seperti David Goggins). 'Roast' volume latihan saya ini: ${workoutData}. Sarkastik, pedas, maksimal 3 kalimat!`;
    const response = await callGeminiAPI(prompt, true);
    setAiBannerData({ text: response, type: 'roast' }); setIsRoastLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = (exerciseData[activeTab] || []).map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`Persiapan ${activeTab} day (otot: ${muscles}). Berikan 3 gerakan pemanasan dinamis saintifik.`);
    setAiWarmup(response); setIsWarmupLoading(false);
  };

  const handleAddLog = async (log) => {
    const newLog = { 
      ...log, id: Date.now().toString(),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), 
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), timestamp: Date.now()
    };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => { 
    setConfirmDialog({ message: "Data log ini akan dihapus permanen. Anda yakin?", onConfirm: () => { setLogs(logs.filter(l => l.id !== id)); setConfirmDialog(null); }});
  };

  const handleEditLog = async (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  
  const handleSaveCustom = async (e) => {
    e.preventDefault(); if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Umum', targetSets: newExercise.targetSets ? parseInt(newExercise.targetSets) : 3, videoId: null };
    setExerciseData(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), item] }));
    setIsAddingExercise(false); setNewExercise({ name: '', muscle: '', targetSets: '' });
  };
  
  const handleDeleteExercise = (tab, id) => { 
    setConfirmDialog({ message: "Seluruh gerakan ini dan konfigurasinya akan dihapus permanen dari jadwal Anda. Lanjutkan?", onConfirm: () => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).filter(ex => ex.id !== id) })); setConfirmDialog(null); }});
  };
  
  const handleEditExercise = async (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); 
  };

  const handleUpdateExerciseVideo = async (tab, id, videoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, videoId } : ex) })); 
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500/30 ${isDarkMode ? 'dark bg-[#0a0a0a] text-white' : 'bg-[#FAFAFA] text-gray-900'} transition-colors duration-500 pb-[env(safe-area-inset-bottom)] relative`}>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-indigo-600/30' : 'bg-indigo-300'}`}></div>
        <div className={`absolute top-40 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-200'}`}></div>
      </div>

      <div className="relative z-10 pb-24 sm:pb-32">
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 sm:px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 transition-all">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center rounded-[16px] sm:rounded-[18px] shadow-xl shadow-gray-900/10 dark:shadow-white/10 shrink-0">
                <Dumbbell size={24} className="transform -rotate-45 sm:w-[28px] sm:h-[28px]" />
              </div>
              <div>
                <h1 className="text-[22px] sm:text-[26px] font-black tracking-tighter text-gray-900 dark:text-white leading-none mb-1">GymTracker</h1>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center">
                  {getHariIndonesia()} <span className="mx-2 text-gray-300 dark:text-gray-700">•</span> {todaySplit} Day
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <button onClick={() => setShowTimerModal(true)} className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all active:scale-90 relative" title="Rest Timer">
                <Clock size={20} />
                {restTime > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>}
              </button>
              <button onClick={() => setShowInsightsModal(true)} className="p-3 rounded-full bg-gray-100/80 dark:bg-[#1a1d27]/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all active:scale-90" title="Insight Kalender & Volume">
                <Activity size={20} />
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-gray-100/80 dark:bg-[#1a1d27]/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all active:scale-90" title="Ganti Tema">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto mt-6 sm:mt-8">
            <div className="flex p-1.5 bg-gray-200/50 dark:bg-[#11131a] rounded-[18px] sm:rounded-[20px] relative overflow-x-auto no-scrollbar">
              {['Push', 'Pull', 'Legs', 'Upper', 'Legs & Core'].map((t) => (
                <button 
                  key={t} onClick={() => setActiveTab(t)} 
                  className={`relative flex-shrink-0 sm:flex-1 min-w-[80px] sm:min-w-0 px-4 py-3 rounded-[14px] sm:rounded-2xl text-[12px] sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeTab === t ? 'text-gray-900 dark:text-white shadow-md bg-white dark:bg-[#1f2230]' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-5 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

          {/* AI Pre-Workout Briefing */}
          <div className="mb-6">
            {!preWorkoutAdvice && !isPreWorkoutLoading ? (
              <button onClick={handleGetPreWorkoutBriefing} className="w-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 p-4 rounded-[24px] flex items-center justify-between transition-all active:scale-95">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/20 p-2 rounded-xl"><MessageSquare size={18} /></div>
                  <span className="text-xs font-black uppercase tracking-widest text-left">Briefing AI Sebelum Latihan</span>
                </div>
                <ChevronRight size={16} className="opacity-50" />
              </button>
            ) : isPreWorkoutLoading ? (
              <div className="w-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-[24px] flex items-center justify-center h-[72px]">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
                <span className="ml-3 text-xs font-bold text-indigo-500 animate-pulse">AI meninjau rekam jejak Anda...</span>
              </div>
            ) : (
              <div className="w-full bg-gradient-to-br from-indigo-50 to-white dark:from-[#0d1020] dark:to-[#0a0a0a] border border-indigo-200/50 dark:border-indigo-900/50 p-5 rounded-[24px] shadow-lg shadow-indigo-500/5 relative animate-in slide-in-from-top-4">
                <button onClick={() => setPreWorkoutAdvice(null)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={14}/></button>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="bg-indigo-500 text-white p-1.5 rounded-lg"><Bot size={14} /></div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Pesan Pelatih Hari Ini</h4>
                </div>
                <p className="text-[13px] sm:text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{preWorkoutAdvice}</p>
              </div>
            )}
          </div>

          <MuscleRecovery logs={logs} exerciseData={exerciseData} />

          {logs.length > 0 && (
            <div className={`rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 relative overflow-hidden transition-all duration-700 ${aiBannerData.type === 'roast' ? 'bg-[#1a0b11] border border-rose-900/30' : 'bg-[#0a0f1c] border border-indigo-900/30'}`}>
              
              <div className={`absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-[60px] sm:blur-[80px] -z-0 opacity-40 transition-colors duration-700 ${aiBannerData.type === 'roast' ? 'bg-rose-600' : 'bg-indigo-600'}`}></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5 sm:mb-6">
                  <h3 className="font-black text-xs sm:text-sm tracking-widest flex items-center text-white uppercase">
                    {aiBannerData.type === 'roast' ? <><Skull size={16} className="mr-2.5 text-rose-500" /> Pelatih Keras</> : <><Sparkles size={16} className="mr-2.5 text-indigo-400" /> Analisis Sesi AI</>}
                  </h3>
                  
                  <div className="flex space-x-2">
                    <button onClick={handleGenerateRoast} disabled={isRoastLoading} className="text-[10px] sm:text-[11px] flex-1 sm:flex-none justify-center font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 px-3 sm:px-4 py-2.5 rounded-xl transition-all flex items-center backdrop-blur-md active:scale-95 text-rose-300 border border-white/5">
                      {isRoastLoading ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} className="mr-1.5 sm:mr-2" />} Roast
                    </button>
                    <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="text-[10px] sm:text-[11px] flex-1 sm:flex-none justify-center font-black tracking-widest uppercase bg-indigo-500/20 hover:bg-indigo-500/30 px-3 sm:px-4 py-2.5 rounded-xl transition-all flex items-center backdrop-blur-md active:scale-95 text-indigo-200 border border-indigo-500/20">
                      {isSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="mr-1.5 sm:mr-2" />} Evaluasi
                    </button>
                  </div>
                </div>
                
                {aiBannerData.text ? (
                  <div className="bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-white/5">
                    <p className={`text-[13px] sm:text-[15px] leading-relaxed font-medium animate-in slide-in-from-bottom-2 ${aiBannerData.type === 'roast' ? 'text-rose-100' : 'text-indigo-100'}`}>{aiBannerData.text}</p>
                  </div>
                ) : (
                  <p className="text-[13px] sm:text-sm text-gray-400 font-medium max-w-[90%] sm:max-w-[85%] leading-relaxed">Setelah menekan tombol CATAT untuk semua set latihan Anda hari ini, minta AI memberikan evaluasi saintifik.</p>
                )}
              </div>
            </div>
          )}

          <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="w-full bg-white dark:bg-[#0f1117] hover:border-orange-500/50 border border-gray-100 dark:border-gray-800/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 transition-all flex items-center justify-center group active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-orange-500/10 text-left sm:text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shrink-0 mr-4">
              {isWarmupLoading ? <Loader2 size={22} className="animate-spin" /> : <Flame size={22} />}
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Pemanasan Dinamis AI</span>
          </button>
            
          {aiWarmup && (
            <div className="bg-gradient-to-br from-orange-50 to-white dark:from-[#1f130a] dark:to-[#0f1117] border border-orange-200/50 dark:border-orange-900/30 p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] animate-in slide-in-from-top-4 relative shadow-2xl shadow-orange-500/10">
              <button onClick={() => setAiWarmup(null)} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={16} /></button>
              <span className="font-black text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4 flex items-center text-orange-600 dark:text-orange-500"><Flame size={16} className="mr-2.5 sm:mr-2.5"/> Pemanasan Hari Ini</span>
              <div className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiWarmup}</div>
            </div>
          )}

          <div className="flex items-center justify-center my-8 sm:my-10">
            <div className="h-px bg-gray-200 dark:bg-gray-800/60 w-full max-w-[150px] sm:max-w-[200px]"></div>
            <Dumbbell size={16} className="mx-4 text-gray-300 dark:text-gray-700 shrink-0 transform -rotate-45" />
            <div className="h-px bg-gray-200 dark:bg-gray-800/60 w-full max-w-[150px] sm:max-w-[200px]"></div>
          </div>

          <div className="space-y-6">
            {(exerciseData[activeTab] || []).map(ex => (
              <ExerciseCard 
                key={ex.id} exercise={ex} activeTab={activeTab} 
                onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise} 
                history={logs.filter(l => l.exerciseId === ex.id)} 
              />
            ))}
          </div>

          {isAddingExercise ? (
            <form onSubmit={handleSaveCustom} className="bg-white dark:bg-[#0f1117] p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in zoom-in-95 duration-300 mt-8 sm:mt-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <h3 className="font-black mb-5 sm:mb-6 text-sm uppercase tracking-widest text-gray-900 dark:text-white flex items-center"><PlusCircle size={20} className="mr-3 text-indigo-500"/> Gerakan Custom</h3>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nama Mesin/Gerakan</label>
                  <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Cth: Incline Dumbbell Press" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-[16px] sm:text-[15px] font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" autoFocus/>
                </div>
                <div className="flex gap-3">
                  <div className="w-2/3">
                    <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Target Otot</label>
                    <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Cth: Dada Atas" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-[16px] sm:text-[15px] font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" />
                  </div>
                  <div className="w-1/3">
                    <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Set</label>
                    <input type="number" value={newExercise.targetSets} onChange={e => setNewExercise({...newExercise, targetSets: e.target.value})} placeholder="3" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-[16px] sm:text-[15px] font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" />
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 pt-3 sm:pt-4 gap-3 sm:gap-0">
                  <button type="button" onClick={() => setIsAddingExercise(false)} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300 text-[13px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors active:scale-95">Batal</button>
                  <button type="submit" disabled={!newExercise.name} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-black uppercase tracking-widest py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl shadow-gray-900/20 dark:shadow-white/20 disabled:opacity-30 transition-all active:scale-95">Tambahkan</button>
                </div>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingExercise(true)} 
              className="w-full py-6 sm:py-7 mt-8 sm:mt-10 border-2 border-dashed border-gray-300 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest rounded-[28px] sm:rounded-[32px] flex items-center justify-center hover:bg-white dark:hover:bg-[#0f1117] hover:text-gray-900 dark:hover:text-white hover:border-indigo-500/50 transition-all text-xs sm:text-sm active:scale-[0.98] group"
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full mr-2.5 sm:mr-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"><Plus size={18} className="sm:w-5 sm:h-5" /></div>
              Gerakan Manual Baru
            </button>
          )}

          {/* --- TOMBOL AKHIRI SESI (MANUAL HEALTH INPUT) --- */}
          <button 
             onClick={() => setShowEndSessionModal(true)}
             className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-[0.98] transition-all mt-8"
          >
             <CheckSquare size={20} className="mr-2" /> Akhiri Sesi Hari Ini
          </button>

          {/* --- JURNAL SESI HARIAN --- */}
          <div className="mt-12 bg-yellow-50 dark:bg-[#1c1810] border border-yellow-200 dark:border-yellow-900/30 rounded-[32px] p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><BookOpen size={100} className="text-yellow-600" /></div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500 mb-4 flex items-center relative z-10"><PenTool size={14} className="mr-2"/> Jurnal Latihan Hari Ini</h4>
            <textarea 
              value={dailyNote}
              onChange={(e) => handleSaveNote(e.target.value)}
              placeholder="Catat kondisi hari ini (Misal: Tidur kurang, tenaga drop pas bench press...)"
              className="w-full bg-white/50 dark:bg-[#110f0a] border border-yellow-200/50 dark:border-yellow-900/50 rounded-2xl p-4 text-[16px] sm:text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-yellow-500/30 min-h-[100px] resize-none relative z-10 placeholder-yellow-800/30 dark:placeholder-yellow-200/20 leading-relaxed font-medium"
            />
          </div>

        </main>
      </div>

      {/* Modal End Workout Summary */}
      {showEndSessionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#11131a] w-full max-w-sm rounded-[36px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center"><CheckSquare size={18} className="mr-2 text-emerald-500" /> Selesai Latihan</h4>
              <button onClick={() => setShowEndSessionModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-90"><X size={16}/></button>
            </div>
            
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              Biarkan kosong jika Anda menggunakan <b>Pintasan Apple Health</b> untuk sinkronisasi otomatis. Isi manual hanya jika Anda tidak menggunakan iOS.
            </p>

            <form onSubmit={handleSaveHealthMetrics} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Clock size={16}/></span>
                <input type="number" value={healthMetrics.duration} onChange={(e) => setHealthMetrics({...healthMetrics, duration: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Durasi Latihan (Menit)" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"><Flame size={16}/></span>
                <input type="number" value={healthMetrics.cals} onChange={(e) => setHealthMetrics({...healthMetrics, cals: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Kalori Terbakar (Kcal)" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500"><Heart size={16}/></span>
                <input type="number" value={healthMetrics.hr} onChange={(e) => setHealthMetrics({...healthMetrics, hr: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Avg Detak Jantung (BPM)" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"><MoonStar size={16}/></span>
                <input type="number" value={healthMetrics.sleep} onChange={(e) => setHealthMetrics({...healthMetrics, sleep: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Lama Tidur Semalam (Menit)" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500"><Wind size={16}/></span>
                <input type="number" step="0.1" value={healthMetrics.spo2} onChange={(e) => setHealthMetrics({...healthMetrics, spo2: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Oksigen Darah SpO2 (%)" />
              </div>
              
              <button type="submit" className="w-full mt-4 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Simpan Manual
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Timer */}
      {restTime > 0 && !showTimerModal && (
        <button onClick={() => setShowTimerModal(true)} className="fixed bottom-6 right-6 z-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 border border-gray-700 dark:border-gray-200 hover:scale-105 transition-transform">
           <Timer size={18} className="animate-pulse text-indigo-400 dark:text-indigo-600" />
           <span className="font-black text-sm tracking-widest">
             {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
           </span>
        </button>
      )}

      {/* Modal Kalender & Volume Insights */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-300 w-full max-w-md">
            <button onClick={() => setShowInsightsModal(false)} className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"><X size={20}/></button>
            <InsightsModal logs={logs} exerciseData={exerciseData} healthData={healthData} onClose={() => setShowInsightsModal(false)} />
          </div>
        </div>
      )}

      {/* Modal Timer Manual */}
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
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={restTime === 0} className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex justify-center items-center active:scale-95 transition-all ${isTimerRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:grayscale'}`}>
              {isTimerRunning ? <><Pause size={18} className="mr-2" /> Pause</> : <><Play size={18} className="mr-2" /> Mulai</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog Confirm */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#11131a] w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 tracking-tight">{confirmDialog.isAlert ? 'Pemberitahuan' : 'Konfirmasi'}</h4>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">{confirmDialog.message}</p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {!confirmDialog.isAlert && (
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all">Batal</button>
              )}
              <button onClick={confirmDialog.onConfirm} className={`flex-1 py-3.5 ${confirmDialog.isAlert ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'} text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all`}>
                {confirmDialog.isAlert ? 'Mengerti' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}