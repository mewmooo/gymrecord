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

// Data Master
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
      <h4 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 px-1 flex items-center">
        <Activity size={14} className="mr-2 text-blue-500"/> Status Otot (72 Jam Terakhir)
      </h4>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
        {recoveryData.map((item, idx) => {
          let bgColor = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
          let textColor = "text-green-700 dark:text-green-400";
          let Icon = BatteryFull;
          let label = "Siap";
          
          if (item.status === 'tired') {
             bgColor = "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
             textColor = "text-red-700 dark:text-red-400";
             Icon = Battery;
             label = "Lelah";
          } else if (item.status === 'recovering') {
             bgColor = "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
             textColor = "text-amber-700 dark:text-amber-400";
             Icon = BatteryCharging;
             label = "Pemulihan";
          }

          return (
            <div key={idx} className={`flex items-center flex-shrink-0 px-3 py-2 rounded-xl border ${bgColor} ${textColor} shadow-sm transition-all backdrop-blur-sm`}>
               <Icon size={14} className="mr-2" />
               <div className="flex flex-col">
                 <span className="text-xs font-semibold leading-tight">{item.muscle}</span>
                 <span className="text-[10px] font-medium opacity-80">{label}</span>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// --- KOMPONEN: EXERCISE CARD (MODERN REDESIGN) ---
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
    if (history.length === 0) return <p className="text-xs text-slate-500 text-center py-4">Belum ada data untuk grafik.</p>;
    const chartData = [...history].slice(0, 7).reverse();
    const max1RM = Math.max(...chartData.map(d => d.oneRepMax || 0));
    const upperBound = max1RM > 0 ? max1RM * 1.2 : 10;

    return (
      <div className="pt-4 pb-2 animate-in fade-in h-48 flex gap-2">
        <div className="flex flex-col justify-between text-xs font-semibold text-slate-400 pb-5 pt-4 border-r border-slate-200 dark:border-slate-800 pr-2">
          <span>{Math.round(upperBound)}</span>
          <span>{Math.round(upperBound / 2)}</span>
          <span>0</span>
        </div>
        <div className="flex-1 relative flex items-end justify-around h-full gap-1">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5 pt-4 z-0">
            <div className="w-full h-px border-t border-dashed border-slate-200 dark:border-slate-800"></div>
            <div className="w-full h-px border-t border-dashed border-slate-200 dark:border-slate-800"></div>
            <div className="w-full h-px border-t border-dashed border-slate-200 dark:border-slate-800"></div>
          </div>
          {chartData.map((d, i) => {
            const heightPct = Math.max(1, ((d.oneRepMax || 0) / upperBound) * 100);
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative z-10">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{d.oneRepMax}</div>
                <div className={`w-full max-w-6 rounded-t transition-all duration-700 ${d.isPR ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ height: `${heightPct}%` }}></div>
                <div className="text-[10px] font-medium text-slate-400 mt-2">{d.date.split(' ')[0]}</div>
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 mb-6 overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            {isEditingEx ? (
              <div className="space-y-4 mb-2">
                <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" placeholder="Nama Latihan" />
                <div className="flex gap-2">
                  <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" placeholder="Target Otot" />
                  <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" placeholder="Set" />
                </div>
                <input type="text" value={exEditForm.videoUrl} onChange={e => setExEditForm({...exEditForm, videoUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" placeholder="Link YouTube (Opsional)" />
                <div className="flex gap-2">
                  <button onClick={handleSaveExEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"><Save size={14} className="mr-1.5 inline"/> Simpan</button>
                  <button onClick={() => setIsEditingEx(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors">Batal</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{exercise.name}</h3>
                  <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <button onClick={() => {
                        setExEditForm({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });
                        setIsEditingEx(true);
                      }} 
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {exercise.muscle}
                  </span>
                  {exercise.targetSets && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                      🎯 Target: {exercise.targetSets} Set
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {exercise.videoId ? (
              <button 
                onClick={(e) => { e.preventDefault(); setShowVideo(!showVideo); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${showVideo ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-500/10'}`} 
              >
                <PlayCircle size={16} /> Video
              </button>
            ) : (
              <a 
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " gym form tutorial")}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <PlayCircle size={16} /> Video
              </a>
            )}
            
            <button onClick={handleGetAlternative} className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors flex items-center gap-2">
              {isAiAltLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Alt
            </button>
            
            <button onClick={handleGetTip} className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
              {isAiTipLoading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} Tips
            </button>
          </div>
        </div>

        {/* Video & AI Tips */}
        {showVideo && exercise.videoId && (
          <div className="rounded-lg overflow-hidden bg-black border border-slate-200 dark:border-slate-800 aspect-video">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0`} title="Tutorial" allowFullScreen></iframe>
          </div>
        )}

        {aiTip && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-lg flex gap-3">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">{aiTip}</p>
          </div>
        )}

        {aiAlt && (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex gap-3">
            <RefreshCw size={16} className="text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{aiAlt}</p>
          </div>
        )}

        {aiProgress && (
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-4 rounded-lg flex gap-3">
            <TrendingUp size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-900 dark:text-green-100 font-medium">{aiProgress}</p>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex gap-1.5">
            {['Normal', 'Drop Set', 'Superset'].map(type => (
              <button 
                key={type} type="button" onClick={() => handleSetTypeChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${setType === type ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
              >
                {type}
              </button>
            ))}
          </div>

          {setType !== 'Normal' && tempSubSets.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-700 rounded-lg border border-dashed border-slate-200 dark:border-slate-600">
              {tempSubSets.map((s, i) => (
                <div key={i} className="text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg flex items-center gap-2 border border-blue-200 dark:border-blue-500/30">
                  {s.weight}kg × {s.reps} {s.rpe && <span className="opacity-60">RPE:{s.rpe}</span>}
                  <button type="button" onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-red-500 transition-colors"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={onFormSubmit} className="flex flex-col gap-3">
            <div className={`grid gap-2 ${setType === 'Normal' ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">KG</label>
                <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" placeholder="0" />
              </div>
              {setType === 'Normal' && (
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">SET</label>
                  <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" placeholder="0" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">REP</label>
                <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">RPE</label>
                <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" placeholder="1-10" />
              </div>
            </div>
            
            {setType === 'Normal' ? (
              <button type="submit" disabled={!weight || !sets || !reps} className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${showSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}>
                {showSuccess ? <CheckCircle size={16} className="inline mr-1.5" /> : ''}CATAT
              </button>
            ) : (
              <div className="flex gap-2">
                 <button type="submit" disabled={!weight || !reps} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-40">
                   Tambah
                 </button>
                 <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${showSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}>
                   {showSuccess ? <CheckCircle size={16} className="inline mr-1.5" /> : ''}SIMPAN
                 </button>
              </div>
            )}
          </form>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => { setShowHistory(true); setHistoryTab('list'); }} className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${showHistory && historyTab === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>List</button>
                <button onClick={() => { setShowHistory(true); setHistoryTab('chart'); }} className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${showHistory && historyTab === 'chart' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>Chart</button>
              </div>
              <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                {isAiProgressLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Analisis
              </button>
            </div>

            {showHistory && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {historyTab === 'chart' ? (
                  <ChartView />
                ) : (
                  <div className="space-y-4">
                    {groupedHistory.map((group, gIndex) => (
                      <div key={gIndex} className="space-y-2">
                        <div className="flex items-center gap-2 px-1 pt-1">
                          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                          <span className="text-xs font-semibold text-slate-500">{group.date}</span>
                          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                        </div>
                        
                        {group.logs.map((log) => (
                          <div key={log.id} className="relative">
                            {editingId === log.id ? (
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex gap-2 mb-3">
                                   <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" />
                                   <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" />
                                   <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingId(null)} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Batal</button>
                                  <button onClick={() => saveEdit(log.id)} className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors">Simpan</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    {log.isPR && <Crown size={14} className="text-amber-500" />}
                                    {log.subSets ? (
                                      <span>
                                        {log.subSets.map((sub, i) => (
                                          <React.Fragment key={i}>
                                            <span>{sub.weight}kg × {sub.reps}</span>
                                            {i < log.subSets.length - 1 && <span className="mx-1 text-blue-500">→</span>}
                                          </React.Fragment>
                                        ))}
                                      </span>
                                    ) : (
                                      <span>{log.weight}kg × {log.sets}×{log.reps}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                    <Clock size={12} /> {log.time}
                                    {log.rpe && <span>RPE: {log.rpe}</span>}
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">1RM: {log.oneRepMax}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 ml-2">
                                  {!log.subSets && <button onClick={() => startEdit(log)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"><Edit2 size={14} /></button>}
                                  <button onClick={() => onDeleteLog(log.id)} className="p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
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
      </div>

      {prModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm text-center border border-slate-200 dark:border-slate-800 relative">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown size={32} className="text-amber-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">NEW PR!</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Luar biasa! Angkatan Anda hari ini lebih kuat dari seluruh histori sebelumnya.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- INSIGHTS MODAL ---
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

  const healthList = Object.values(healthData);
  const avgCals = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.cals || 0), 0) / healthList.length) : 0;
  const avgHr = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.hr || 0), 0) / healthList.length) : 0;
  const avgSpo2 = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.spo2 || 0), 0) / healthList.length) : 0;
  const avgSleepMins = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.sleep || 0), 0) / healthList.length) : 0;
  const sleepHours = Math.floor(avgSleepMins / 60);
  const sleepMins = avgSleepMins % 60;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto w-full max-w-md">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Insights & Progress</h4>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={16}/></button>
      </div>

      {healthList.length > 0 && (
        <div className="mb-8">
           <h3 className="text-xs font-semibold uppercase text-slate-500 mb-4">Health Metrics</h3>
           <div className="grid grid-cols-2 gap-3">
             <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-lg">
               <Heart size={16} className="text-red-500 mb-2" />
               <div className="text-lg font-bold text-slate-900 dark:text-white">{avgHr} <span className="text-xs text-slate-500 font-medium">BPM</span></div>
               <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Avg HR</div>
             </div>
             <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-4 rounded-lg">
               <Flame size={16} className="text-orange-500 mb-2" />
               <div className="text-lg font-bold text-slate-900 dark:text-white">{avgCals} <span className="text-xs text-slate-500 font-medium">Kcal</span></div>
               <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Calories</div>
             </div>
             <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-lg">
               <Wind size={16} className="text-blue-500 mb-2" />
               <div className="text-lg font-bold text-slate-900 dark:text-white">{avgSpo2 > 0 ? avgSpo2 : '--'} <span className="text-xs text-slate-500 font-medium">%</span></div>
               <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">SpO2</div>
             </div>
             <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 p-4 rounded-lg">
                <MoonStar size={16} className="text-purple-500 mb-2" />
                <div className="text-lg font-bold text-slate-900 dark:text-white">{sleepHours}h {sleepMins}m</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Sleep</div>
             </div>
           </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase text-slate-500 mb-4">Consistency (35 Days)</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((dayObj, i) => {
             const dateStr = dayObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
             const isActive = activeDates.has(dateStr);
             return (
               <div 
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
               >
                  {dayObj.getDate()}
               </div>
             )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase text-slate-500 mb-4">Weekly Volume</h3>
        {weeklyVolume.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No workouts this week</p>
        ) : (
          <div className="space-y-3">
            {weeklyVolume.map((item, idx) => {
              const pct = Math.min(100, (item.sets / 20) * 100);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>{item.muscle}</span><span>{item.sets}s</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
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

// --- MAIN APP ---
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
      setHealthData(prev => ({ ...prev, [today]: { ...prev[today], hr, cals, sleep, spo2 } }));
      window.history.replaceState({}, document.title, window.location.pathname);
      setConfirmDialog({ message: `Sinkronisasi berhasil! (HR: ${hr} bpm, Cals: ${cals} kcal)`, onConfirm: () => setConfirmDialog(null), isAlert: true });
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
    setHealthData({...healthData, [today]: {
       duration: parseInt(healthMetrics.duration) || 0,
       cals: parseInt(healthMetrics.cals) || 0,
       hr: parseInt(healthMetrics.hr) || 0,
       sleep: parseInt(healthMetrics.sleep) || 0,
       spo2: parseInt(healthMetrics.spo2) || 0,
    }});
    setShowEndSessionModal(false);
    setHealthMetrics({ duration: '', cals: '', hr: '', sleep: '', spo2: '' });
  };

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
      setConfirmDialog({ message: "Waktu istirahat sudah habis!", onConfirm: () => setConfirmDialog(null), isAlert: true });
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
    const sleepInfo = todayHealth.sleep ? `\nSemalam saya tidur selama ${Math.floor(todayHealth.sleep/60)} jam.` : '';
    const prompt = `Saya akan latihan ${activeTab} hari ini. Kondisi: [${recentNotesStr || 'Normal'}]. ${sleepInfo} Berikan Pre-Workout Briefing singkat (2-3 kalimat).`;
    const response = await callGeminiAPI(prompt);
    setPreWorkoutAdvice(response || "Gagal menghubungi AI.");
    setIsPreWorkoutLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId}`).join(', ');
    const response = await callGeminiAPI(`Latihan saya hari ini: ${workoutData}. Berikan pujian singkat (2 kalimat).`);
    setAiBannerData({ text: response, type: 'summary' }); setIsSummaryLoading(false);
  };

  const handleGenerateRoast = async () => {
    if (logs.length === 0) return;
    setIsRoastLoading(true);
    const workoutData = logs.slice(0, 3).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId}`).join(', ');
    const response = await callGeminiAPI(`Roast singkat latihan saya: ${workoutData} (maksimal 2 kalimat, sarkastik).`, true);
    setAiBannerData({ text: response, type: 'roast' }); setIsRoastLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = (exerciseData[activeTab] || []).map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`${activeTab} day (otot: ${muscles}). 3 gerakan pemanasan dinamis ringkas.`);
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
    setConfirmDialog({ message: "Hapus log ini?", onConfirm: () => { setLogs(logs.filter(l => l.id !== id)); setConfirmDialog(null); }});
  };

  const handleEditLog = (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  
  const handleSaveCustom = (e) => {
    e.preventDefault(); if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Umum', targetSets: newExercise.targetSets ? parseInt(newExercise.targetSets) : 3, videoId: null };
    setExerciseData(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), item] }));
    setIsAddingExercise(false); setNewExercise({ name: '', muscle: '', targetSets: '' });
  };
  
  const handleDeleteExercise = (tab, id) => { 
    setConfirmDialog({ message: "Hapus gerakan ini?", onConfirm: () => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).filter(ex => ex.id !== id) })); setConfirmDialog(null); }});
  };
  
  const handleEditExercise = (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); 
  };

  return (
    <div className={`min-h-screen font-sans antialiased ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 pb-24`}>
      
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-6 py-4 transition-all">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center rounded-xl shadow-lg">
                <Dumbbell size={24} className="-rotate-45" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GymTracker</h1>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{getHariIndonesia()} • {todaySplit}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => setShowTimerModal(true)} className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors" title="Timer">
                <Clock size={20} />
              </button>
              <button onClick={() => setShowInsightsModal(true)} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Insights">
                <Activity size={20} />
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['Push', 'Pull', 'Legs', 'Upper', 'Legs & Core'].map((t) => (
              <button 
                key={t} onClick={() => setActiveTab(t)} 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === t ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {!preWorkoutAdvice && !isPreWorkoutLoading ? (
          <button onClick={handleGetPreWorkoutBriefing} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-4 rounded-xl flex items-center justify-between transition-all">
            <div className="flex items-center gap-3 text-left">
              <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold">Pre-Workout Briefing</span>
            </div>
            <ChevronRight size={16} className="opacity-50" />
          </button>
        ) : isPreWorkoutLoading ? (
          <div className="w-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl flex items-center">
            <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400 mr-3" />
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Loading briefing...</span>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-5 rounded-xl">
            <button onClick={() => setPreWorkoutAdvice(null)} className="absolute top-4 right-4"><X size={14} className="text-slate-400" /></button>
            <div className="flex gap-3 mb-2">
              <Bot size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase">Coach Message</h4>
            </div>
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">{preWorkoutAdvice}</p>
          </div>
        )}

        <MuscleRecovery logs={logs} exerciseData={exerciseData} />

        {logs.length > 0 && (
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex gap-2">
              <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Evaluasi
              </button>
              <button onClick={handleGenerateRoast} disabled={isRoastLoading} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isRoastLoading ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} />} Roast
              </button>
            </div>
            
            {aiBannerData.text && (
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-100 font-medium">{aiBannerData.text}</p>
              </div>
            )}
          </div>
        )}

        <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="w-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-900 dark:text-orange-100 p-4 rounded-xl flex items-center justify-between hover:bg-orange-200 dark:hover:bg-orange-500/20 transition-colors disabled:opacity-50">
          {isWarmupLoading ? <Loader2 size={18} className="animate-spin" /> : <Flame size={18} />}
          <span className="text-sm font-semibold">Pemanasan Dinamis</span>
        </button>
            
        {aiWarmup && (
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-5 rounded-xl">
            <button onClick={() => setAiWarmup(null)} className="absolute top-4 right-4"><X size={14} /></button>
            <h4 className="text-xs font-semibold text-orange-900 dark:text-orange-100 uppercase mb-3 flex items-center gap-2">
              <Flame size={14} /> Warmup
            </h4>
            <p className="text-sm text-orange-900 dark:text-orange-100 font-medium whitespace-pre-wrap">{aiWarmup}</p>
          </div>
        )}

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
          <form onSubmit={handleSaveCustom} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2"><PlusCircle size={16} /> New Exercise</h3>
            <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Exercise name" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30" autoFocus/>
            <div className="flex gap-3">
              <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Target muscle" className="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30" />
              <input type="number" value={newExercise.targetSets} onChange={e => setNewExercise({...newExercise, targetSets: e.target.value})} placeholder="Sets" className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsAddingExercise(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button type="submit" disabled={!newExercise.name} className="flex-1 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-40">Add</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingExercise(true)} 
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Custom Exercise
          </button>
        )}

        <button 
           onClick={() => setShowEndSessionModal(true)}
           className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
           <CheckSquare size={18} /> End Session
        </button>

        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-yellow-900 dark:text-yellow-100 uppercase flex items-center gap-2"><PenTool size={14} /> Session Notes</h4>
          <textarea 
            value={dailyNote}
            onChange={(e) => handleSaveNote(e.target.value)}
            placeholder="How did the session go?"
            className="w-full bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500/30 min-h-20 resize-none"
          />
        </div>

      </main>

      {/* Modals */}
      {showEndSessionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><CheckSquare size={18} /> End Session</h4>
            <form onSubmit={handleSaveHealthMetrics} className="space-y-3">
              <input type="number" value={healthMetrics.cals} onChange={(e) => setHealthMetrics({...healthMetrics, cals: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm" placeholder="Calories burned" />
              <input type="number" value={healthMetrics.hr} onChange={(e) => setHealthMetrics({...healthMetrics, hr: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm" placeholder="Avg heart rate" />
              <input type="number" value={healthMetrics.sleep} onChange={(e) => setHealthMetrics({...healthMetrics, sleep: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm" placeholder="Sleep (minutes)" />
              <button type="submit" className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">Save</button>
            </form>
            <button onClick={() => setShowEndSessionModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <InsightsModal logs={logs} exerciseData={exerciseData} healthData={healthData} onClose={() => setShowInsightsModal(false)} />
          </div>
        </div>
      )}

      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Timer size={18} /> Rest Timer</h4>
            <div className="text-5xl font-bold text-center text-slate-900 dark:text-white mb-4">
              {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
               <button onClick={() => addTime(30)} className="py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">+30s</button>
               <button onClick={() => addTime(60)} className="py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">+60s</button>
               <button onClick={() => addTime(90)} className="py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">+90s</button>
               <button onClick={() => { setRestTime(0); setIsTimerRunning(false); }} className="py-2 bg-red-100 dark:bg-red-500/10 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">Reset</button>
            </div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={restTime === 0} className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${isTimerRunning ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}>
              {isTimerRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
            </button>
            <button onClick={() => setShowTimerModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors">Close</button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{confirmDialog.isAlert ? 'Notice' : 'Confirm'}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">{confirmDialog.message}</p>
            <div className="flex gap-3">
              {!confirmDialog.isAlert && (
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors">Cancel</button>
              )}
              <button onClick={confirmDialog.onConfirm} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold text-white transition-colors ${confirmDialog.isAlert ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {confirmDialog.isAlert ? 'OK' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
