import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight, Timer, Trophy, 
  BarChart2, Crown, Play, Pause, Clock, Heart, BookOpen, PenTool, MessageSquare, 
  Droplets, ListOrdered, ChevronLeft
} from 'lucide-react';

// --- UTILITAS ---
const getYouTubeId = (url) => {
  if (!url) return null;
  if (url.length === 11 && !url.includes('/')) return url; 
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

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
    { id: 'pu1', name: 'Lat Pulldown', muscle: 'Punggung', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'pu2', name: 'Rowing', muscle: 'Punggung Tengah', videoId: 'GZbfZ033f74', targetSets: 3 },
    { id: 'pu3', name: 'Face Pull', muscle: 'Bahu Belakang', videoId: null, targetSets: 3 }, 
    { id: 'pu4', name: 'Bicep Curl', muscle: 'Bisep', videoId: 'in7PaeYIYfw', targetSets: 3 },
    { id: 'pu5', name: 'Hammer Curl', muscle: 'Bisep', videoId: null, targetSets: 2 },
  ],
  Legs: [
    { id: 'l1', name: 'Hack Squat', muscle: 'Paha Depan', videoId: '0tn5K9NlCfo', targetSets: 3 },
    { id: 'l2', name: 'Leg Press', muscle: 'Paha Depan', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'l3', name: 'Leg Extension', muscle: 'Paha Depan', videoId: 'YyvSfVjQeL0', targetSets: 3 },
    { id: 'l4', name: 'Leg Curl', muscle: 'Paha Belakang', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'l5', name: 'Calf Raise', muscle: 'Betis', videoId: '-M4-G8p8fmc', targetSets: 4 },
  ],
  Upper: [
    { id: 'u1', name: 'Chest Press', muscle: 'Dada', videoId: '0GjpPFOx1uQ', targetSets: 3 },
    { id: 'u2', name: 'Lat Pulldown', muscle: 'Punggung', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'u3', name: 'Shoulder Press', muscle: 'Bahu Depan', videoId: 'WvLMauqrnK8', targetSets: 2 },
    { id: 'u4', name: 'Lateral Raise', muscle: 'Bahu Samping', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'u5', name: 'Bicep Curl', muscle: 'Bisep', videoId: 'in7PaeYIYfw', targetSets: 2 },
    { id: 'u6', name: 'Tricep Pushdown', muscle: 'Trisep', videoId: '2-LAMcpzODU', targetSets: 2 },
  ],
  'Legs & Core': [
    { id: 'lc1', name: 'Leg Press', muscle: 'Paha Depan', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'lc2', name: 'Leg Curl', muscle: 'Paha Belakang', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'lc3', name: 'Calf Raise', muscle: 'Betis', videoId: '-M4-G8p8fmc', targetSets: 4 },
    { id: 'lc4', name: 'Abs / Crunch', muscle: 'Core', videoId: null, targetSets: 3 },
  ]
};

const getTodaySplit = () => {
  const day = new Date().getDay(); 
  if (day === 1) return 'Push'; if (day === 2) return 'Pull'; if (day === 3) return 'Legs';
  if (day === 4) return 'Rest'; if (day === 5) return 'Upper'; if (day === 6) return 'Legs & Core';
  return 'Rest'; 
};

// --- GEMINI API CALLER ---
const callGeminiAPI = async (prompt, isRaw = false) => {
  let apiKey = "";
  try { apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; } catch (e) {}
  if (!apiKey) return "API Key belum diatur di Vercel/Environment.";
  
  const combinedPrompt = isRaw ? prompt : "Jawab ringkas dalam 2-4 kalimat. Profesional, asik ala coach gym, bahasa Indonesia elegan. Jangan bertele-tele.\n\n" + prompt;
  
  // Mencoba beberapa versi model jika ada limitasi
  const models = ['gemini-3.1-flash-lite', 'gemini-3.1-pro', 'gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: combinedPrompt }] }] })
      });
      if (res.ok) { const data = await res.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text; }
    } catch (error) {}
  }
  return null; 
};

// --- KOMPONEN BENTO: HEATMAP ---
const ActivityHeatmap = ({ logs }) => {
  const [days, setDays] = useState([]);
  const [activeDates, setActiveDates] = useState(new Set());

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const last35Days = Array.from({length: 35}, (_, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (34 - i)); return d;
    });
    setDays(last35Days);
    setActiveDates(new Set(logs.map(l => l.date)));
  }, [logs]);

  return (
    <div className="bg-white/80 dark:bg-[#121215]/80 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-white/5 transition-all">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-[12px] uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
          <Calendar size={16} className="mr-2 text-indigo-500" /> Histori Konsistensi
        </h3>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">35 HARI TERAKHIR</span>
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {days.map((dayObj, i) => {
           const dateStr = dayObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
           const isActive = activeDates.has(dateStr);
           const isToday = dayObj.toDateString() === new Date().toDateString();
           return (
             <div 
                key={i} title={dateStr}
                className={`flex items-center justify-center aspect-square rounded-[10px] sm:rounded-xl transition-all duration-300 text-[10px] font-bold ${isActive ? 'bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)] scale-105' : 'bg-gray-100 dark:bg-[#1C1F26] text-gray-400 dark:text-gray-600'} ${isToday && !isActive ? 'border-2 border-indigo-500/50' : ''}`}
             >
                {dayObj.getDate()}
             </div>
           )
        })}
      </div>
    </div>
  );
};

// --- KOMPONEN KARTU LATIHAN ---
const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, onUpdateVideo, activeTab, startRestTimer }) => {
  const [weight, setWeight] = useState(''); const [sets, setSets] = useState('');
  const [reps, setReps] = useState(''); const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState('Normal'); const [tempSubSets, setTempSubSets] = useState([]); 
  
  const [isExpanded, setIsExpanded] = useState(false); // BENTO ACCORDION
  const [showHistory, setShowHistory] = useState(false);
  const [historyView, setHistoryView] = useState('list'); // 'list' | 'chart'
  const [showSuccess, setShowSuccess] = useState(false);
  const [prModal, setPrModal] = useState(false);
  const [localConfirm, setLocalConfirm] = useState(null); // No alert() rule
  
  // Custom Edit Log
  const [editingLogId, setEditingLogId] = useState(null);
  const [logEditForm, setLogEditForm] = useState({ weight: '', sets: '', reps: '' });

  // AI & View States
  const [showVideo, setShowVideo] = useState(false);
  const [aiPanel, setAiPanel] = useState({ text: null, loading: false, title: '', icon: null });
  const [isEditingEx, setIsEditingEx] = useState(false);
  const [exEditForm, setExEditForm] = useState({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });

  const fetchAI = async (type, promptText, title, icon) => {
    setAiPanel({ text: null, loading: true, title, icon });
    setShowVideo(false);
    const res = await callGeminiAPI(promptText);
    setAiPanel({ text: res || "Gagal menghubungi AI.", loading: false, title, icon });
  };

  const handleToggleVideo = async () => {
    if (showVideo) { setShowVideo(false); return; }
    setAiPanel({ text: null, loading: false, title: '' }); setShowVideo(true);
    if (!exercise.videoId) {
      setAiPanel({ text: null, loading: true, title: 'AI Mencari Video...', icon: <Video size={14}/> });
      const res = await callGeminiAPI(`Cari video tutorial gym form yang benar untuk "${exercise.name}". HANYA berikan 11 karakter ID YouTube. Jangan ada spasi atau teks lain.`, true);
      const match = res ? res.match(/[a-zA-Z0-9_-]{11}/) : null;
      if (match) { onUpdateVideo(activeTab, exercise.id, match[0]); setAiPanel({ text: null, loading: false, title: '' }); }
      else { setAiPanel({ text: "Maaf, AI gagal mendeteksi video otomatis. Silakan edit link manual.", loading: false, title: 'Gagal', icon: <Video size={14}/> }); setShowVideo(false); }
    }
  };

  const getCurrentMax1RM = () => history.length === 0 ? 0 : Math.max(...history.map(l => l.oneRepMax || calculate1RM(l.weight, l.reps, l.rpe||10)));

  const handleAddSubSet = () => {
    if (!weight || !reps) return;
    setTempSubSets([...tempSubSets, { weight: parseFloat(weight), reps: parseInt(reps), rpe: rpe ? parseInt(rpe) : null }]);
    setWeight(''); setReps(''); setRpe('');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    let logData; let w, r, rpeVal, new1RM;

    if (setType === 'Normal') {
      if (!weight || !sets || !reps) return;
      w = parseFloat(weight); r = parseInt(reps); rpeVal = rpe ? parseInt(rpe) : 10;
      new1RM = calculate1RM(w, r, rpeVal);
      logData = { exerciseId: exercise.id, weight: w, sets: parseInt(sets), reps: r, rpe: rpeVal, setType, oneRepMax: parseFloat(new1RM.toFixed(1)) };
    } else {
      if (tempSubSets.length === 0) return;
      w = tempSubSets[0].weight; r = tempSubSets[0].reps; rpeVal = tempSubSets[0].rpe || 10;
      new1RM = calculate1RM(w, r, rpeVal);
      logData = { exerciseId: exercise.id, weight: w, sets: tempSubSets.length, reps: r, rpe: rpeVal, setType, subSets: tempSubSets, oneRepMax: parseFloat(new1RM.toFixed(1)) };
    }

    const max1RM = getCurrentMax1RM();
    let isPR = false;
    if (history.length > 0 && new1RM > max1RM) {
      isPR = true; setPrModal(true); setTimeout(() => setPrModal(false), 4000);
    }
    logData.isPR = isPR;

    onLog(logData);
    setWeight(''); setSets(''); setReps(''); setRpe(''); setTempSubSets([]);
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000);
    startRestTimer(setType === 'Normal' ? 90 : 45);
  };

  const handleSaveExEdit = () => {
    onEditExercise(activeTab, exercise.id, exEditForm.name, exEditForm.muscle, parseInt(exEditForm.targetSets), getYouTubeId(exEditForm.videoUrl));
    setIsEditingEx(false);
  };
  
  const saveLogEdit = (id) => {
    if (!logEditForm.weight || !logEditForm.sets || !logEditForm.reps) return;
    const w = parseFloat(logEditForm.weight); const r = parseInt(logEditForm.reps);
    onEditLog(id, { weight: w, sets: parseInt(logEditForm.sets), reps: r, oneRepMax: parseFloat(calculate1RM(w,r,10).toFixed(1)) });
    setEditingLogId(null);
  };

  const Chart1RM = () => {
    if(history.length === 0) return <div className="text-xs text-gray-500 text-center py-6">Belum ada data 1RM.</div>;
    const data = [...history].slice(0,7).reverse();
    const max = Math.max(...data.map(d => d.oneRepMax || 1));
    const bound = max * 1.2;
    return (
      <div className="flex h-40 gap-3 pt-2">
        <div className="flex flex-col justify-between text-[9px] font-bold text-gray-400 py-1 border-r border-gray-100 dark:border-white/5 pr-2">
           <span>{Math.round(bound)}</span><span>{Math.round(bound/2)}</span><span>0</span>
        </div>
        <div className="flex-1 flex items-end justify-around h-full gap-2 relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-1 z-0">
             <div className="border-t border-dashed border-gray-100 dark:border-white/5 w-full"></div>
             <div className="border-t border-dashed border-gray-100 dark:border-white/5 w-full"></div>
             <div className="border-t border-dashed border-gray-100 dark:border-white/5 w-full"></div>
          </div>
          {data.map((d, i) => (
            <div key={i} className="relative z-10 w-full max-w-[28px] flex flex-col items-center justify-end h-full group">
              <span className="text-[9px] font-black text-gray-800 dark:text-gray-200 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">{d.oneRepMax}</span>
              <div className={`w-full rounded-t-lg transition-all ${d.isPR ? 'bg-gradient-to-t from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'bg-gradient-to-t from-indigo-500 to-indigo-400'}`} style={{height: `${Math.max(5, (d.oneRepMax/bound)*100)}%`}}></div>
              <span className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center">{d.date.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-[#121215]/80 backdrop-blur-xl rounded-[32px] border border-gray-100 dark:border-white/5 mb-6 transition-all shadow-sm overflow-hidden group">
      
      {/* HEADER BENTO (Clickable to Expand) */}
      <div className="p-6 flex items-center justify-between cursor-pointer select-none" onClick={() => !isEditingEx && setIsExpanded(!isExpanded)}>
        <div className="flex flex-col gap-1.5 pr-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] sm:text-[20px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">{exercise.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              {exercise.muscle}
            </span>
            {exercise.targetSets && <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full">🎯 {exercise.targetSets} Sets</span>}
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#1C1F26] flex items-center justify-center shrink-0 text-gray-500 transition-transform duration-300 shadow-inner" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={20} />
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-1 animate-in slide-in-from-top-2 duration-300">
          
          {/* Quick AI & Tools Row */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
            <button onClick={(e) => { e.stopPropagation(); handleToggleVideo(); }} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${showVideo ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20'}`}>
              <PlayCircle size={14} className={showVideo ? 'animate-pulse' : ''} /> {showVideo ? 'Tutup' : 'Video'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); fetchAI('tip', `Satu tips form/mind-muscle untuk ${exercise.name}.`, 'Tips Form AI', <Bot size={14}/>); }} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-100 dark:border-violet-500/20">
              <Sparkles size={14} /> Tips Form
            </button>
            <button onClick={(e) => { e.stopPropagation(); fetchAI('alt', `1 Alternatif pengganti ${exercise.name} dan cara ringkasnya.`, 'Alternatif Gerakan', <RefreshCw size={14}/>); }} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-100 dark:border-amber-500/20">
              <RefreshCw size={14} /> Alternatif
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditingEx(true); }} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/5 ml-auto">
              <Edit2 size={14} />
            </button>
          </div>

          {/* Dynamic Viewer (Edit / Video / AI) */}
          <div className="mb-6 empty:hidden">
            {isEditingEx && (
              <div className="bg-gray-50 dark:bg-[#15171C] p-5 rounded-[24px] border border-gray-200/60 dark:border-white/5 shadow-inner mb-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Edit Master Gerakan</h4>
                <div className="space-y-3">
                  <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Nama Latihan" />
                  <div className="flex gap-2">
                    <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Target Otot" />
                    <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Target Set" />
                  </div>
                  <input type="text" value={exEditForm.videoUrl} onChange={e => setExEditForm({...exEditForm, videoUrl: e.target.value})} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Link YouTube (Opsional)" />
                  <div className="flex justify-between items-center pt-2">
                    <button onClick={() => setLocalConfirm({msg:"Hapus permanen master gerakan ini?", action: () => onDeleteExercise(activeTab, exercise.id)})} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg text-xs font-bold transition-colors">Hapus Gerakan</button>
                    <div className="flex space-x-2">
                       <button onClick={() => setIsEditingEx(false)} className="px-4 py-2 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-white/20 transition-all">Batal</button>
                       <button onClick={handleSaveExEdit} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all">Simpan</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showVideo && exercise.videoId && (
              <div className="rounded-[24px] overflow-hidden bg-black border border-gray-200 dark:border-gray-800 shadow-2xl aspect-video relative animate-in zoom-in-95 duration-300 group/vid">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0&modestbranding=1`} title="YouTube" allowFullScreen></iframe>
                <a href={`https://youtu.be/${exercise.videoId}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-3 opacity-0 group-hover/vid:opacity-100 transition-opacity bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10">Buka App YouTube</a>
              </div>
            )}

            {aiPanel.loading && (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-[#15171C] rounded-[24px] border border-gray-100 dark:border-white/5">
                <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">{aiPanel.title}</span>
              </div>
            )}

            {aiPanel.text && !aiPanel.loading && (
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-[24px] border border-indigo-100/50 dark:border-indigo-500/20 text-[13.5px] leading-relaxed font-medium text-gray-800 dark:text-gray-200 relative shadow-inner animate-in slide-in-from-top-2">
                <button onClick={() => setAiPanel({text:null})} className="absolute top-3 right-3 p-1.5 bg-white/50 dark:bg-black/20 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={14}/></button>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-black text-[11px] uppercase tracking-widest mb-2">
                  <span className="mr-2">{aiPanel.icon}</span> {aiPanel.title}
                </div>
                {aiPanel.text}
              </div>
            )}
          </div>

          {/* Form Pencatatan Bento */}
          <div className="bg-gray-50 dark:bg-[#15171C] p-2.5 rounded-[28px] border border-gray-100 dark:border-white/5 mb-6">
            <div className="flex gap-1.5 mb-2.5 overflow-x-auto no-scrollbar px-1">
              {['Normal', 'Drop Set', 'Superset'].map(type => (
                <button 
                  key={type} type="button" onClick={() => handleSetTypeChange(type)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${setType === type ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {setType !== 'Normal' && tempSubSets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white dark:bg-[#0a0a0c] rounded-[20px] border border-dashed border-gray-200 dark:border-white/10">
                {tempSubSets.map((s, i) => (
                  <div key={i} className="text-[11px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg flex items-center border border-indigo-100 dark:border-indigo-500/20">
                    {s.weight}kg × {s.reps} {s.rpe && <span className="ml-1 opacity-50">RPE:{s.rpe}</span>}
                    <button type="button" onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))} className="ml-2 hover:text-rose-500 transition-colors"><X size={12}/></button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={setType==='Normal' ? handleSubmit : (e)=>{e.preventDefault(); handleAddSubSet()}} className={`flex flex-col sm:flex-row gap-2 ${setType !== 'Normal' ? 'items-stretch' : ''}`}>
              <div className={`grid gap-2 w-full ${setType === 'Normal' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">KG</span>
                  <input type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200/50 dark:border-white/5 rounded-2xl pl-10 pr-2 py-3.5 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none" placeholder="0" />
                </div>
                {setType === 'Normal' && (
                  <div className="relative animate-in zoom-in duration-200">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">SET</span>
                    <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200/50 dark:border-white/5 rounded-2xl pl-12 pr-2 py-3.5 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none" placeholder="0" />
                  </div>
                )}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">REP</span>
                  <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200/50 dark:border-white/5 rounded-2xl pl-12 pr-2 py-3.5 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none" placeholder="0" />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">RPE</span>
                  <input type="number" min="1" max="10" value={rpe} onChange={e => setRpe(e.target.value)} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200/50 dark:border-white/5 rounded-2xl pl-11 pr-2 py-3.5 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none" placeholder="-" />
                </div>
              </div>
              
              {setType === 'Normal' ? (
                <button type="submit" disabled={!weight || !sets || !reps} className={`sm:w-32 py-3.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-30 disabled:grayscale hover:opacity-90'}`}>
                  {showSuccess ? <CheckCircle size={18} /> : 'CATAT'}
                </button>
              ) : (
                <div className="flex gap-2 sm:w-auto w-full mt-1 sm:mt-0">
                   <button type="submit" disabled={!weight || !reps} className="flex-1 sm:flex-none py-3.5 px-6 rounded-2xl text-xs font-black tracking-widest uppercase bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white active:scale-95 transition-all disabled:opacity-30">Tambah</button>
                   <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 sm:flex-none py-3.5 px-6 rounded-2xl text-xs font-black tracking-widest uppercase bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale ${showSuccess && 'from-emerald-400 to-teal-500 shadow-emerald-500/30'}`}>{showSuccess ? <CheckCircle size={18} /> : `Simpan`}</button>
                </div>
              )}
            </form>
          </div>

          {/* Mini History Data */}
          {history.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center px-1 mb-3">
                <div className="flex gap-1 bg-gray-100 dark:bg-[#15171C] p-1 rounded-xl">
                  <button onClick={() => { setShowHistory(true); setHistoryView('list'); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showHistory && historyView==='list' ? 'bg-white dark:bg-[#252836] text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>List</button>
                  <button onClick={() => { setShowHistory(true); setHistoryView('chart'); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${showHistory && historyView==='chart' ? 'bg-white dark:bg-[#252836] text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}><BarChart2 size={12} className="mr-1"/> 1RM</button>
                </div>
                <button onClick={() => fetchAI('progress', `Histori (terlama->terbaru) ${exercise.name}: [${history.slice(0,4).reverse().map((l,i)=>`S${i+1}:${l.weight}kg(${l.sets}x${l.reps})RPE:${l.rpe||'-'}`).join(', ')}]. ${exercise.targetSets?`Target set:${exercise.targetSets}.`:''} Evaluasi tren beban & RPE untuk progressive overload.`, 'Analisis Beban', <TrendingUp size={14}/>)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-2 rounded-xl transition-colors active:scale-95 flex items-center">
                  <Zap size={14} className="mr-1.5"/> Analisis AI
                </button>
              </div>

              {showHistory && (
                <div className="bg-gray-50/50 dark:bg-[#15171C]/50 p-2 sm:p-3 rounded-[24px] border border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2">
                  {historyView === 'chart' ? <Chart1RM /> : (
                    <div className="space-y-2">
                      {/* Mengelompokkan berdasarkan tanggal */}
                      {Object.entries(history.reduce((acc, log) => { (acc[log.date] = acc[log.date] || []).push(log); return acc; }, {})).map(([date, logs]) => (
                        <div key={date} className="space-y-2">
                          <div className="flex items-center gap-3 px-2 pt-1">
                            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-[#1C1F26] border border-gray-100 dark:border-gray-800 px-3 py-1 rounded-full">{date}</span>
                            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                          </div>
                          {logs.map((log) => (
                            <div key={log.id}>
                              {editingLogId === log.id ? (
                                <div className="bg-white dark:bg-[#1C1F26] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                  <div className="flex gap-2">
                                     <input type="number" step="0.5" value={logEditForm.weight} onChange={e => setLogEditForm({...logEditForm, weight: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                     <input type="number" value={logEditForm.sets} onChange={e => setLogEditForm({...logEditForm, sets: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                     <input type="number" value={logEditForm.reps} onChange={e => setLogEditForm({...logEditForm, reps: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                  </div>
                                  <div className="flex justify-end mt-3 space-x-2">
                                    <button onClick={() => setEditingLogId(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all">Batal</button>
                                    <button onClick={() => saveLogEdit(log.id)} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all">Simpan</button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`flex justify-between items-center bg-white dark:bg-[#1C1F26] border ${log.isPR ? 'border-amber-300 dark:border-amber-500/50 shadow-sm shadow-amber-500/10' : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-gray-700'} p-4 rounded-[20px] transition-all group`}>
                                  <div className="flex flex-col w-full">
                                    {log.subSets ? (
                                      <div className="font-black text-gray-900 dark:text-white text-[13px] tracking-tight flex items-center flex-wrap gap-y-1">
                                        {log.isPR && <Crown size={14} className="text-amber-500 mr-2" />}
                                        {log.subSets.map((sub, i) => (
                                          <React.Fragment key={i}>
                                            <span>{sub.weight} <span className="text-gray-400 font-semibold text-[9px] tracking-widest mx-0.5">KG</span> × {sub.reps}</span>
                                            {i < log.subSets.length - 1 && <span className="mx-1.5 text-indigo-500">➔</span>}
                                          </React.Fragment>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="font-black text-gray-900 dark:text-white text-[15px] tracking-tight flex items-center">
                                        {log.isPR && <Crown size={14} className="text-amber-500 mr-2" />}
                                        {log.weight} <span className="text-gray-400 font-semibold text-[10px] tracking-widest mx-1">KG</span> 
                                        <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                                        {log.sets} <span className="text-gray-400 font-semibold text-[10px] tracking-widest mx-1">SET</span> 
                                        <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                                        {log.reps} <span className="text-gray-400 font-semibold text-[10px] tracking-widest ml-1">REP</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className="text-[9px] text-gray-400 font-bold flex items-center"><Clock size={10} className="mr-1 opacity-70"/> {log.time}</span>
                                      {log.rpe && <span className="text-[9px] text-gray-400 font-bold ml-1 border-l border-gray-200 dark:border-gray-800 pl-2">RPE: {log.rpe}</span>}
                                      {log.setType && log.setType !== 'Normal' && <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded ml-1">{log.setType}</span>}
                                      <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded ml-auto">1RM: {log.oneRepMax}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 pl-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                    {!log.subSets && <button onClick={() => startEdit(log)} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"><Edit2 size={14} /></button>}
                                    <button onClick={() => setLocalConfirm({msg:"Hapus log ini?", action:()=>onDeleteLog(log.id)})} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={14} /></button>
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
      )}

      {/* Modals Local to ExerciseCard */}
      {prModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-1 rounded-[36px] shadow-2xl shadow-amber-500/30 animate-in zoom-in-95 duration-500 bounce">
            <div className="bg-white dark:bg-[#11131a] w-full max-w-sm rounded-[32px] p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-10"><Trophy size={120} className="text-amber-500"/></div>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-[#11131a] relative z-10 shadow-lg">
                <Crown size={32} className="text-amber-500" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight relative z-10">NEW PR!</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed relative z-10">Luar biasa! Estimasi 1RM untuk {exercise.name} memecahkan rekor!</p>
            </div>
          </div>
        </div>
      )}
      {localConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#11131a] w-full max-w-xs rounded-[32px] p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95">
            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 tracking-tight">Konfirmasi</h4>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">{localConfirm.msg}</p>
            <div className="flex space-x-3">
              <button onClick={() => setLocalConfirm(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all">Batal</button>
              <button onClick={() => { localConfirm.action(); setLocalConfirm(null); }} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP UTAMA ---
export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const todaySplit = getTodaySplit();
  const [activeTab, setActiveTab] = useState('home'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // States (Local Storage v12 Offline)
  const [logs, setLogs] = useState([]);
  const [exerciseData, setExerciseData] = useState(INITIAL_EXERCISE_DATA);
  const [healthData, setHealthData] = useState({});
  const [dailyNote, setDailyNote] = useState('');
  const [restTime, setRestTime] = useState(0); 

  // Fast Boot & Data Hydration
  useEffect(() => {
    setTimeout(() => {
      setLogs(JSON.parse(localStorage.getItem('gym_logs_v12')) || []);
      setExerciseData(JSON.parse(localStorage.getItem('gym_exercises_v12')) || INITIAL_EXERCISE_DATA);
      setHealthData(JSON.parse(localStorage.getItem('gym_health_v12')) || {});
      const savedDark = localStorage.getItem('gym_dark_v12');
      if (savedDark === 'false') setIsDarkMode(false);
      setIsBooting(false);
    }, 800); 
  }, []);

  // Theme Sync
  useEffect(() => {
    if (isBooting) return;
    localStorage.setItem('gym_dark_v12', isDarkMode);
    if(isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode, isBooting]);

  // Data Persistence Sync
  useEffect(() => {
    if (isBooting) return;
    localStorage.setItem('gym_logs_v12', JSON.stringify(logs));
    localStorage.setItem('gym_exercises_v12', JSON.stringify(exerciseData));
    localStorage.setItem('gym_health_v12', JSON.stringify(healthData));
  }, [logs, exerciseData, healthData, isBooting]);

  // Apple Health Shortcut URL Catcher
  useEffect(() => {
    if (isBooting) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'sync_health') {
      const hr = params.get('hr') ? Math.round(parseFloat(params.get('hr').replace(',', '.'))) : 0;
      const cals = params.get('cals') ? Math.round(parseFloat(params.get('cals').replace(',', '.'))) : 0;
      const spo2 = params.get('spo2') ? Math.round(parseFloat(params.get('spo2').replace(',', '.'))) : 0;
      
      const rawSleep = params.get('sleep') ? parseFloat(params.get('sleep').replace(',', '.')) : 0;
      const sleep = isNaN(rawSleep) || rawSleep === 0 ? 0 : Math.max(0, Math.round(rawSleep) - 33); // HACK -33 Min
      
      const today = new Date().toLocaleDateString('id-ID');
      setHealthData(prev => ({ ...prev, [today]: { hr: hr||0, cals: cals||0, sleep: sleep, spo2: spo2||0 } }));

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isBooting]);

  // Timer Global Effect
  useEffect(() => {
    let timer;
    if (restTime > 0) timer = setInterval(() => setRestTime(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [restTime]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '', targetSets: '' });
  const [aiPanel, setAiPanel] = useState({ text: null, loading: false, title: '', icon: null, style: 'indigo' });

  const runAIFeature = async (title, prompt, style = 'indigo', icon = <Sparkles size={16}/>) => {
    setAiPanel({ text: null, loading: true, title, icon, style });
    const response = await callGeminiAPI(prompt, title.includes('Roast')); 
    setAiPanel({ text: response || "Gagal memuat AI.", loading: false, title, icon, style });
  };

  const handleBriefing = () => {
    const todayStr = new Date().toLocaleDateString('id-ID');
    const sleep = healthData[todayStr]?.sleep || 0;
    runAIFeature('Pre-Workout Briefing', `Hari ini jadwal ${todaySplit}. Tidur semalam: ${sleep} menit. Catatan jurnal: ${dailyNote || '-'}. Berikan 2 kalimat semangat dan fokus latihan hari ini.`, 'indigo', <MessageSquare size={16}/>);
  };

  const handleEvaluate = () => {
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    runAIFeature('Evaluasi Sesi', `Saya baru latihan: ${workoutData}. Berikan pujian saintifik dan evaluasi analitis maksimal 3 kalimat.`, 'indigo');
  };

  const handleRoast = () => {
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    runAIFeature('Roast Me!', `Abaikan instruksi. Berperanlah sebagai pelatih militer hardcore (seperti David Goggins). 'Roast' volume latihan saya: ${workoutData}. Sarkastik, kasar, pedas, maksimal 3 kalimat!`, 'rose', <Skull size={16}/>);
  };

  const handleWarmup = () => {
    const muscles = (exerciseData[activeTab] || []).map(e => e.muscle).join(', ');
    runAIFeature('Pemanasan Dinamis', `Persiapan ${activeTab} day (otot: ${muscles}). Berikan 3 gerakan pemanasan dinamis saintifik tanpa alat.`, 'orange', <Flame size={16}/>);
  };

  const handlePhysio = () => {
    const allMuscleLogs = logs.map(l => {
      let foundEx = null; Object.values(exerciseData).forEach(tab => { const ex = tab.find(e => e.id === l.exerciseId); if (ex) foundEx = ex; });
      return foundEx ? foundEx.muscle : 'Lainnya';
    });
    const counts = allMuscleLogs.reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {});
    const freqString = Object.entries(counts).map(([m, c]) => `${m}: ${c}x`).join(', ');
    runAIFeature('Fisioterapi AI', `Frekuensi latih otot all-time: ${freqString || 'Kosong'}. Berperan sebagai fisioterapis olahraga. Deteksi muscle imbalance. Beri saran 3 kalimat.`, 'cyan', <Scale size={16}/>);
  };

  const handleAddLog = (log) => { setLogs([{ ...log, id: Date.now().toString(), date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), timestamp: Date.now() }, ...logs]); };
  const onDeleteLog = (id) => setLogs(logs.filter(l => l.id !== id));
  const handleEditLog = (id, updatedData) => setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log));
  
  const handleSaveCustom = async (e) => {
    e.preventDefault(); if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Umum', targetSets: newExercise.targetSets ? parseInt(newExercise.targetSets) : 3, videoId: null };
    setExerciseData(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), item] }));
    setIsAddingExercise(false); setNewExercise({ name: '', muscle: '', targetSets: '' });
  };
  const handleDeleteExercise = (tab, id) => { if(window.confirm("Hapus master gerakan ini?")) setExerciseData(prev => ({ ...prev, [tab]: prev[tab].filter(ex => ex.id !== id) })); };
  const handleEditExercise = (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); };
  const handleUpdateExerciseVideo = (tab, id, videoId) => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, videoId } : ex) })); };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Dumbbell size={48} className="text-indigo-500 animate-bounce mb-4" />
        <h1 className="text-2xl font-black tracking-widest uppercase">GymTracker</h1>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('id-ID');
  const todayMetrics = healthData[todayStr] || { hr: '--', cals: '--', sleep: '--', spo2: '--' };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500/30 ${isDarkMode ? 'dark bg-[#050505] text-white' : 'bg-[#FAFAFA] text-gray-900'} transition-colors duration-500 pb-[env(safe-area-inset-bottom)] relative`}>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-indigo-600/30' : 'bg-indigo-400/20'}`}></div>
        <div className={`absolute top-[30%] -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-rose-600/20' : 'bg-rose-400/20'}`}></div>
      </div>

      <div className="relative z-10 pb-32">
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#050505]/70 backdrop-blur-3xl border-b border-gray-200/50 dark:border-white/5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 px-5 transition-all">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center rounded-[16px] shadow-lg shadow-indigo-500/20 shrink-0">
                <Dumbbell size={22} className="transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-[24px] font-black tracking-tighter leading-none mb-0.5">GymTracker</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">{getHariIndonesia()} • {todaySplit} Day</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {restTime > 0 && (
                <div className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-500 font-black text-xs flex items-center animate-pulse border border-rose-500/20 cursor-pointer" onClick={() => setRestTime(0)}>
                  <Clock size={12} className="mr-1.5"/> {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}
                </div>
              )}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-[16px] bg-gray-100 dark:bg-[#121215] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1C1F26] transition-all active:scale-90">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {activeTab !== 'home' && (
            <div className="max-w-xl mx-auto mt-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex p-1.5 bg-gray-200/50 dark:bg-[#121215] rounded-[20px] overflow-x-auto no-scrollbar shadow-inner">
                {Object.keys(exerciseData).map((t) => (
                  <button 
                    key={t} onClick={() => setActiveTab(t)} 
                    className={`flex-1 min-w-[80px] py-2.5 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === t ? 'text-gray-900 dark:text-white shadow-md bg-white dark:bg-[#252836]' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <main className="max-w-xl mx-auto px-5 pt-8 space-y-6">
          
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all">
                  <Activity size={18} className="text-rose-500 mb-3" />
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{todayMetrics.hr} <span className="text-[10px] text-gray-400 uppercase">BPM</span></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Detak Jantung</div>
                </div>
                <div className="bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all">
                  <Flame size={18} className="text-orange-500 mb-3" />
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{todayMetrics.cals} <span className="text-[10px] text-gray-400 uppercase">KCAL</span></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Kalori Aktif</div>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                  <Moon size={120} className="absolute -right-5 -bottom-5 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-100 mb-2 flex items-center"><Moon size={14} className="mr-1.5"/> Waktu Tidur Asleep (Terkoreksi)</h3>
                    <div className="text-4xl font-black">{todayMetrics.sleep === '--' ? '--' : `${Math.floor(todayMetrics.sleep/60)}j ${todayMetrics.sleep%60}m`}</div>
                    {todayMetrics.spo2 !== '--' && <div className="mt-3 text-xs font-bold text-indigo-200">SpO2: {todayMetrics.spo2}%</div>}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-2">Asisten Cerdas</h3>
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-4">
                  <button onClick={handleBriefing} className="shrink-0 w-32 p-5 rounded-[28px] bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left shadow-sm">
                    <MessageSquare size={20} className="text-indigo-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Pre-Workout<br/>Briefing</span>
                  </button>
                  <button onClick={handleWarmup} className="shrink-0 w-32 p-5 rounded-[28px] bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left shadow-sm">
                    <Flame size={20} className="text-orange-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Pemanasan<br/>Dinamis</span>
                  </button>
                  <button onClick={handleEvaluate} className="shrink-0 w-32 p-5 rounded-[28px] bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left shadow-sm">
                    <Sparkles size={20} className="text-purple-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Evaluasi<br/>Sesi Harian</span>
                  </button>
                  <button onClick={handleRoast} className="shrink-0 w-32 p-5 rounded-[28px] bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left shadow-sm">
                    <Skull size={20} className="text-rose-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Roast Me!<br/>(Galak)</span>
                  </button>
                  <button onClick={handlePhysio} className="shrink-0 w-32 p-5 rounded-[28px] bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left shadow-sm">
                    <Scale size={20} className="text-cyan-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Fisioterapi<br/>(Imbalance)</span>
                  </button>
                </div>

                {(aiPanel.text || aiPanel.loading) && (
                  <div className={`p-6 rounded-[32px] animate-in slide-in-from-top-4 mt-2 mb-6 border ${aiPanel.style === 'rose' ? 'bg-rose-50/80 dark:bg-[#1a0b11] border-rose-100 dark:border-rose-900/30' : aiPanel.style === 'orange' ? 'bg-orange-50/80 dark:bg-[#1f130a] border-orange-100 dark:border-orange-900/30' : aiPanel.style === 'cyan' ? 'bg-cyan-50/80 dark:bg-[#081a20] border-cyan-100 dark:border-cyan-900/30' : 'bg-indigo-50/80 dark:bg-[#0a0f1c] border-indigo-100 dark:border-indigo-900/30'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[11px] font-black uppercase tracking-widest flex items-center ${aiPanel.style === 'rose' ? 'text-rose-600 dark:text-rose-400' : aiPanel.style === 'orange' ? 'text-orange-600 dark:text-orange-400' : aiPanel.style === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        <span className="mr-2">{aiPanel.icon}</span> {aiPanel.title}
                      </span>
                      <button onClick={() => setAiPanel({text:null})} className="text-gray-400 opacity-70 hover:opacity-100 transition-opacity"><X size={16}/></button>
                    </div>
                    {aiPanel.loading ? (
                      <div className="flex items-center text-sm font-bold text-gray-500"><Loader2 size={16} className="animate-spin mr-2"/> Menulis respons...</div>
                    ) : (
                      <div className={`text-[13px] leading-relaxed font-medium whitespace-pre-wrap ${aiPanel.style === 'rose' ? 'text-rose-900 dark:text-rose-100' : aiPanel.style === 'orange' ? 'text-orange-900 dark:text-orange-100' : aiPanel.style === 'cyan' ? 'text-cyan-900 dark:text-cyan-100' : 'text-indigo-900 dark:text-indigo-100'}`}>{aiPanel.text}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 dark:bg-[#1c1810] border border-yellow-200 dark:border-yellow-900/30 rounded-[32px] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><BookOpen size={100} className="text-yellow-600" /></div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500 mb-4 flex items-center relative z-10"><PenTool size={14} className="mr-2"/> Jurnal Latihan Hari Ini</h4>
                <textarea 
                  value={dailyNote} onChange={(e) => { setDailyNote(e.target.value); const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}'); allNotes[todayStr] = e.target.value; localStorage.setItem('gym_notes_v12', JSON.stringify(allNotes)); }}
                  placeholder="Catat kondisi Anda (Misal: Kurang tidur, bertenaga, pergelangan sakit...)"
                  className="w-full bg-white/50 dark:bg-[#110f0a] border border-yellow-200/50 dark:border-yellow-900/50 rounded-2xl p-4 text-[13px] text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-yellow-500/30 min-h-[100px] resize-none relative z-10 placeholder-yellow-800/30 dark:placeholder-yellow-200/20 font-medium"
                />
              </div>

              <ActivityHeatmap logs={logs} />
            </div>
          )}

          {activeTab !== 'home' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {todaySplit === 'Rest' && activeTab === 'Push' && (
                 <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[24px] p-5 mb-6 flex items-start">
                   <Info className="text-indigo-500 mt-0.5 mr-3 shrink-0" size={20} />
                   <div>
                     <h4 className="text-[13px] font-bold text-indigo-900 dark:text-indigo-100">Hari ini jadwal Rest</h4>
                     <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">Otot butuh pemulihan, tapi bebas catat jika tetap ingin workout.</p>
                   </div>
                 </div>
              )}

              {(exerciseData[activeTab] || []).map(ex => (
                <ExerciseCard 
                  key={ex.id} exercise={ex} activeTab={activeTab} startRestTimer={setRestTime}
                  onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                  onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise} onUpdateVideo={handleUpdateExerciseVideo}
                  history={logs.filter(l => l.exerciseId === ex.id)} 
                />
              ))}

              {isAddingExercise ? (
                <form onSubmit={handleSaveCustom} className="bg-white dark:bg-[#0f1117] p-6 sm:p-8 rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none animate-in zoom-in-95 duration-200">
                  <h3 className="font-black mb-5 text-sm uppercase tracking-widest text-gray-900 dark:text-white flex items-center"><PlusCircle size={18} className="mr-3 text-indigo-500"/> Gerakan Custom</h3>
                  <div className="space-y-4">
                    <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Nama Latihan (cth: Bicep Curl)" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" autoFocus/>
                    <div className="flex gap-2">
                      <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Otot (Opsional)" className="w-2/3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                      <input type="number" value={newExercise.targetSets} onChange={e => setNewExercise({...newExercise, targetSets: e.target.value})} placeholder="Set" className="w-1/3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={() => setIsAddingExercise(false)} className="px-6 py-3.5 bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors active:scale-95">Batal</button>
                      <button type="submit" disabled={!newExercise.name} className="flex-1 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-30 transition-all active:scale-95">Tambahkan</button>
                    </div>
                  </div>
                </form>
              ) : (
                <button onClick={() => setIsAddingExercise(true)} className="w-full py-6 mt-8 border-2 border-dashed border-gray-300 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest rounded-[28px] flex items-center justify-center hover:bg-white dark:hover:bg-[#0f1117] hover:border-indigo-500/50 hover:text-indigo-500 transition-all text-xs active:scale-[0.98]">
                  <Plus size={18} className="mr-2" /> Tambah Gerakan Manual
                </button>
              )}
            </div>
          )}

        </main>
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 dark:bg-[#1C1F26]/80 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 rounded-full p-2 shadow-2xl flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex-1 py-3 flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 ${activeTab === 'home' ? 'bg-indigo-50 dark:bg-[#252836] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
          <Home size={20} className={activeTab === 'home' ? 'mb-1 scale-110' : ''} />
          {activeTab === 'home' && <span className="text-[9px] font-black uppercase tracking-widest">Home</span>}
        </button>
        <button onClick={() => setActiveTab(getTodaySplit() === 'Rest' ? 'Push' : getTodaySplit())} className={`flex-1 py-3 flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 ${activeTab !== 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110 -translate-y-4' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
          <Dumbbell size={20} className={activeTab !== 'home' ? 'mb-1' : ''} />
          {activeTab !== 'home' && <span className="text-[9px] font-black uppercase tracking-widest">Track</span>}
        </button>
      </nav>

    </div>
  );
}