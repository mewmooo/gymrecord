import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight, Timer, Trophy, 
  BarChart2, Crown, Play, Pause, Clock, Heart, BookOpen, PenTool, MessageSquare, Menu
} from 'lucide-react';

// --- UTILITAS & DATA MASTER ---
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

// --- GEMINI API CORE ---
const callGeminiAPI = async (prompt, isRaw = false) => {
  let apiKey = "";
  try { apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; } catch (e) {}
  if (!apiKey) return "API Key belum diatur di Vercel.";
  
  const combinedPrompt = isRaw ? prompt : "Jawab ringkas dalam 2-3 kalimat. Profesional, memotivasi, gunakan bahasa Indonesia yang elegan. Jangan bertele-tele.\n\n" + prompt;
  const models = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];

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

// --- KOMPONEN BENTO: EXERCISE CARD ---
const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, activeTab, startRestTimer }) => {
  const [weight, setWeight] = useState(''); const [sets, setSets] = useState('');
  const [reps, setReps] = useState(''); const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState('Normal'); const [tempSubSets, setTempSubSets] = useState([]); 
  
  const [isExpanded, setIsExpanded] = useState(false); // UI Baru: Accordion
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [prModal, setPrModal] = useState(false);
  
  // AI States
  const [showVideo, setShowVideo] = useState(false);
  const [aiResponse, setAiResponse] = useState({ text: null, loading: false, type: null }); // Unified AI State
  
  const [isEditingEx, setIsEditingEx] = useState(false);
  const [exEditForm, setExEditForm] = useState({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });

  const fetchAI = async (type, promptText) => {
    setAiResponse({ text: null, loading: true, type });
    setShowVideo(false);
    const res = await callGeminiAPI(promptText);
    setAiResponse({ text: res || "Gagal menghubungi AI.", loading: false, type });
  };

  const handleToggleVideo = async () => {
    if (showVideo) { setShowVideo(false); return; }
    setAiResponse({ text: null, loading: false, type: null }); setShowVideo(true);
    if (!exercise.videoId) {
      setAiResponse({ text: null, loading: true, type: 'video' });
      const res = await callGeminiAPI(`Cari video tutorial gym "${exercise.name}". HANYA 11 karakter ID YouTube.`, true);
      const match = res ? res.match(/[a-zA-Z0-9_-]{11}/) : null;
      if (match) { onEditExercise(activeTab, exercise.id, exercise.name, exercise.muscle, exercise.targetSets, match[0]); setAiResponse({ text: null, loading: false, type: null }); }
      else { setAiResponse({ text: "Video tidak ditemukan oleh AI.", loading: false, type: 'video' }); setShowVideo(false); }
    }
  };

  const getCurrentMax1RM = () => history.length === 0 ? 0 : Math.max(...history.map(l => l.oneRepMax || calculate1RM(l.weight, l.reps, l.rpe||10)));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || !sets || !reps) return;
    const w = parseFloat(weight); const r = parseInt(reps); const rVal = rpe ? parseInt(rpe) : 10;
    const new1RM = calculate1RM(w, r, rVal);
    
    if (history.length > 0 && new1RM > getCurrentMax1RM()) { setPrModal(true); setTimeout(() => setPrModal(false), 4000); }
    
    onLog({ exerciseId: exercise.id, weight: w, sets: parseInt(sets), reps: r, rpe: rVal, setType, oneRepMax: parseFloat(new1RM.toFixed(1)), isPR: new1RM > getCurrentMax1RM() });
    setWeight(''); setSets(''); setReps(''); setRpe('');
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2500);
    startRestTimer(setType === 'Normal' ? 90 : 30);
  };

  const saveEditExercise = () => {
    onEditExercise(activeTab, exercise.id, exEditForm.name, exEditForm.muscle, parseInt(exEditForm.targetSets), getYouTubeId(exEditForm.videoUrl));
    setIsEditingEx(false);
  };

  return (
    <div className="bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md rounded-[28px] border border-gray-100 dark:border-gray-800/80 mb-4 transition-all shadow-sm overflow-hidden group">
      
      {/* HEADER BAR BENTO (Clickable to Expand) */}
      <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col gap-1 pr-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] sm:text-[18px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">{exercise.name}</h3>
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-indigo-500">
            {exercise.muscle} {exercise.targetSets && <span className="text-gray-400 dark:text-gray-600 ml-1">| 🎯 {exercise.targetSets} Sets</span>}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1F26] flex items-center justify-center shrink-0 text-gray-500 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={20} />
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 animate-in slide-in-from-top-2 duration-200">
          
          {/* Quick AI & Video Tools */}
          <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
            <button onClick={handleToggleVideo} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all ${showVideo ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              <PlayCircle size={14} /> Video
            </button>
            <button onClick={() => fetchAI('tip', `Tips singkat form & mind-muscle untuk ${exercise.name}`)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Bot size={14} /> Tips Form
            </button>
            <button onClick={() => fetchAI('alt', `Satu alternatif gerakan pengganti untuk ${exercise.name} beserta alasan biomekaniknya.`)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <RefreshCw size={14} /> Alternatif
            </button>
            <button onClick={() => setIsEditingEx(!isEditingEx)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all bg-gray-100 dark:bg-[#1C1F26] text-gray-600 dark:text-gray-400 ml-auto">
              <Edit2 size={14} />
            </button>
          </div>

          {/* Dynamic Viewer (Edit / Video / AI) */}
          <div className="mb-5 empty:hidden">
            {isEditingEx && (
              <div className="space-y-3 bg-gray-50 dark:bg-[#0a0a0c] p-4 rounded-[20px] border border-gray-100 dark:border-gray-800">
                <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Nama Latihan" />
                <div className="flex gap-2">
                  <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-bold dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Target Otot" />
                  <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-bold dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Set" />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="text-rose-500 text-xs font-bold px-2">Hapus Latihan</button>
                  <button onClick={saveEditExercise} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Simpan</button>
                </div>
              </div>
            )}

            {showVideo && exercise.videoId && (
              <div className="rounded-[20px] overflow-hidden bg-black border border-gray-200 dark:border-gray-800 shadow-xl aspect-video relative animate-in zoom-in-95">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0&modestbranding=1`} allowFullScreen></iframe>
              </div>
            )}

            {aiResponse.loading && (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#0a0a0c] rounded-[20px] border border-gray-100 dark:border-gray-800">
                <Loader2 size={24} className="text-indigo-500 animate-spin mb-2" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">AI Berpikir...</span>
              </div>
            )}

            {aiResponse.text && !aiResponse.loading && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-[20px] border border-indigo-100 dark:border-indigo-500/20 text-[13px] leading-relaxed font-medium text-gray-700 dark:text-gray-300 relative">
                <button onClick={() => setAiResponse({text:null})} className="absolute top-2 right-2 text-gray-400"><X size={14}/></button>
                {aiResponse.text}
              </div>
            )}
          </div>

          {/* Compact Input Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-[#1C1F26]/50 p-2 rounded-[20px] border border-gray-100 dark:border-gray-800/80">
            <div className="flex gap-1.5 mb-2 px-1 overflow-x-auto no-scrollbar">
              {['Normal', 'Drop Set', 'Superset'].map(type => (
                <button key={type} type="button" onClick={() => setSetType(type)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${setType === type ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{type}</button>
              ))}
            </div>
            
            <div className="flex gap-2 w-full">
              <input type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} className="w-[30%] bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-3 text-center text-sm font-black dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="KG" />
              {setType === 'Normal' && <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-[20%] bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-3 text-center text-sm font-black dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="SET" />}
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-[20%] bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-3 text-center text-sm font-black dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="REP" />
              <input type="number" value={rpe} onChange={e => setRpe(e.target.value)} className="w-[30%] bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-3 text-center text-sm font-black dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="RPE" />
            </div>

            <button type="submit" disabled={!weight || !reps || (setType==='Normal' && !sets)} className={`w-full mt-2 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30'}`}>
              {showSuccess ? <CheckCircle size={16} className="inline mr-1" /> : 'CATAT SET'}
            </button>
          </form>

          {/* Mini History Drawer */}
          {history.length > 0 && (
            <div className="mt-4">
               <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1C1F26]/30 rounded-xl text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                 <span className="flex items-center"><History size={14} className="mr-2"/> Histori ({history.length})</span>
                 {showHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
               </button>
               {showHistory && (
                 <div className="mt-2 space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                    {history.map((log) => (
                      <div key={log.id} className="flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0c] p-3 rounded-xl border border-gray-100 dark:border-gray-800/80">
                         <div className="flex flex-col">
                            <span className="font-black text-[13px] text-gray-800 dark:text-gray-200">{log.weight}KG × {log.sets} × {log.reps} <span className="text-gray-400 text-[10px] ml-1">RPE:{log.rpe}</span></span>
                            <span className="text-[9px] font-bold text-gray-400 mt-0.5">{log.date}</span>
                         </div>
                         <button onClick={() => onDeleteLog(log.id)} className="text-gray-400 hover:text-rose-500"><X size={14}/></button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

        </div>
      )}

      {/* PR Celebration Modal */}
      {prModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-md">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 rounded-[36px] shadow-2xl text-center text-white animate-in zoom-in-95">
            <Crown size={64} className="mx-auto mb-4 drop-shadow-md" />
            <h4 className="text-3xl font-black mb-2">NEW PR!</h4>
            <p className="text-sm font-medium opacity-90">Kekuatan Anda meningkat pesat!</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- KOMPONEN BENTO: HEATMAP KONSISTENSI ---
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
    <div className="bg-white dark:bg-[#121215] rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800/80">
      <h3 className="font-black text-[12px] uppercase tracking-widest text-gray-400 mb-5 flex items-center"><Calendar size={16} className="mr-2 text-indigo-500" /> Histori Kehadiran</h3>
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {days.map((dayObj, i) => {
           const dateStr = dayObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
           const isActive = activeDates.has(dateStr);
           const isToday = dayObj.toDateString() === new Date().toDateString();
           return (
             <div key={i} title={dateStr} className={`flex items-center justify-center aspect-square rounded-xl transition-all text-[10px] font-bold ${isActive ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105' : 'bg-gray-100 dark:bg-[#1C1F26] text-gray-400'} ${isToday && !isActive ? 'border-2 border-indigo-500/50' : ''}`}>
                {dayObj.getDate()}
             </div>
           )
        })}
      </div>
    </div>
  );
};


// --- MAIN APP ---
export default function App() {
  const [isBooting, setIsBooting] = useState(true); // Fast Boot State
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [logs, setLogs] = useState([]);
  const [exerciseData, setExerciseData] = useState(INITIAL_EXERCISE_DATA);
  const [healthData, setHealthData] = useState({});
  const [dailyNote, setDailyNote] = useState('');
  const [restTime, setRestTime] = useState(0); 

  // Fast Boot & Data Hydration
  useEffect(() => {
    // Memberikan jeda 0.1 detik untuk merender Splash Screen (Perbaikan blank putih 10 detik)
    setTimeout(() => {
      setLogs(JSON.parse(localStorage.getItem('gym_logs_v13')) || []);
      setExerciseData(JSON.parse(localStorage.getItem('gym_exercises_v13')) || INITIAL_EXERCISE_DATA);
      setHealthData(JSON.parse(localStorage.getItem('gym_health_v13')) || {});
      const savedDark = localStorage.getItem('gym_dark_v13');
      if (savedDark === 'false') setIsDarkMode(false);
      setIsBooting(false);
    }, 100);
  }, []);

  // Theme Sync
  useEffect(() => {
    if (isBooting) return;
    localStorage.setItem('gym_dark_v13', isDarkMode);
    if(isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode, isBooting]);

  // Data Persistence Sync
  useEffect(() => {
    if (isBooting) return;
    localStorage.setItem('gym_logs_v13', JSON.stringify(logs));
    localStorage.setItem('gym_exercises_v13', JSON.stringify(exerciseData));
    localStorage.setItem('gym_health_v13', JSON.stringify(healthData));
  }, [logs, exerciseData, healthData, isBooting]);

  // Apple Health Shortcut URL Catcher (Dengan Akal-akalan Tidur)
  useEffect(() => {
    if (isBooting) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'sync_health') {
      const hr = params.get('hr') ? Math.round(parseFloat(params.get('hr').replace(',', '.'))) : 0;
      const cals = params.get('cals') ? Math.round(parseFloat(params.get('cals').replace(',', '.'))) : 0;
      
      // AKAL-AKALAN KODE TIDUR: Mengurangi rawSleep (In Bed) dengan 33 menit untuk akurasi Asleep
      const rawSleep = params.get('sleep') ? parseFloat(params.get('sleep').replace(',', '.')) : 0;
      const sleep = isNaN(rawSleep) || rawSleep === 0 ? 0 : Math.max(0, Math.round(rawSleep) - 33);
      
      const today = new Date().toLocaleDateString('id-ID');
      setHealthData(prev => ({ ...prev, [today]: { hr: hr||0, cals: cals||0, sleep: sleep } }));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isBooting]);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (restTime > 0) timer = setInterval(() => setRestTime(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [restTime]);

  // AI Features
  const [aiPanel, setAiPanel] = useState({ text: null, loading: false, title: '' });
  
  const runAIFeature = async (title, prompt) => {
    setAiPanel({ text: null, loading: true, title });
    const response = await callGeminiAPI(prompt, title.includes('Roast')); // Roast menggunakan raw prompt
    setAiPanel({ text: response || "Koneksi AI Terputus.", loading: false, title });
  };

  const todayStr = new Date().toLocaleDateString('id-ID');
  const todayMetrics = healthData[todayStr] || { hr: '--', cals: '--', sleep: '--' };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Dumbbell size={48} className="text-indigo-500 animate-bounce mb-4" />
        <h1 className="text-2xl font-black tracking-widest uppercase">GymTracker</h1>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500/30 ${isDarkMode ? 'dark bg-[#050505] text-white' : 'bg-[#FAFAFA] text-gray-900'} transition-colors duration-500 pb-32 relative`}>
      
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-indigo-600/30' : 'bg-indigo-400/20'}`}></div>
        <div className={`absolute top-[30%] -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-rose-600/20' : 'bg-rose-400/20'}`}></div>
      </div>

      <div className="relative z-10">
        {/* HEADER GLASS BENTO */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#050505]/70 backdrop-blur-3xl border-b border-gray-200/50 dark:border-white/5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 px-5 transition-all">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center rounded-[16px] shadow-lg shadow-indigo-500/20">
                <Dumbbell size={22} className="transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-[24px] font-black tracking-tighter leading-none mb-0.5">GymTracker</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">{getHariIndonesia()} • {getTodaySplit()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {restTime > 0 && (
                <div className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-500 font-black text-xs flex items-center animate-pulse border border-rose-500/20">
                  <Clock size={12} className="mr-1.5"/> {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}
                </div>
              )}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-[16px] bg-gray-100 dark:bg-[#121215] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1C1F26] transition-all active:scale-90">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* BENTO SEGMENTED TABS */}
          {activeTab !== 'home' && (
            <div className="max-w-xl mx-auto mt-6">
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
          
          {/* TAB: DASHBOARD & AI (HOME) */}
          {activeTab === 'home' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* BENTO METRICS GRID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#121215] p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm">
                  <Activity size={18} className="text-rose-500 mb-3" />
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{todayMetrics.hr} <span className="text-[10px] text-gray-400 uppercase">BPM</span></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Detak Jantung</div>
                </div>
                <div className="bg-white dark:bg-[#121215] p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm">
                  <Flame size={18} className="text-orange-500 mb-3" />
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{todayMetrics.cals} <span className="text-[10px] text-gray-400 uppercase">KCAL</span></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Kalori Sesi</div>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                  <Moon size={100} className="absolute -right-5 -bottom-5 opacity-10" />
                  <div className="relative z-10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-100 mb-2">Total Tidur Semalam</h3>
                    <div className="text-4xl font-black">{todayMetrics.sleep === '--' ? '--' : `${Math.floor(todayMetrics.sleep/60)}J ${todayMetrics.sleep%60}M`}</div>
                  </div>
                </div>
              </div>

              {/* AI ACTION HUB (HORIZONTAL) */}
              <div className="pt-2">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-2">Asisten Cerdas</h3>
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-4">
                  <button onClick={() => runAIFeature('Briefing', `Berikan 2 kalimat semangat dan fokus latihan untuk jadwal ${getTodaySplit()} hari ini berdasarkan tidur saya: ${todayMetrics.sleep} menit.`)} className="shrink-0 w-32 p-4 rounded-3xl bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left">
                    <MessageSquare size={20} className="text-indigo-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Pre-Workout<br/>Briefing</span>
                  </button>
                  <button onClick={() => runAIFeature('Warmup', `Sebutkan 3 pemanasan dinamis untuk jadwal ${getTodaySplit()}.`)} className="shrink-0 w-32 p-4 rounded-3xl bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left">
                    <Flame size={20} className="text-orange-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Rekomendasi<br/>Pemanasan</span>
                  </button>
                  <button onClick={() => runAIFeature('Evaluasi', `Evaluasi 5 latihan terakhir saya: ${logs.slice(0,5).map(l=>l.weight+'kg').join(', ')} dan detak jantung ${todayMetrics.hr} bpm.`)} className="shrink-0 w-32 p-4 rounded-3xl bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left">
                    <Sparkles size={20} className="text-cyan-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Evaluasi<br/>Sesi Harian</span>
                  </button>
                  <button onClick={() => runAIFeature('Roast (Pelatih Galak)', `Roast (Sarkas & Kasar ala David Goggins) latihan saya hari ini.`)} className="shrink-0 w-32 p-4 rounded-3xl bg-white dark:bg-[#121215] border border-gray-100 dark:border-white/5 active:scale-95 transition-all text-left">
                    <Skull size={20} className="text-rose-500 mb-3" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Roast Me!<br/>(Galak)</span>
                  </button>
                </div>

                {/* AI RESPONSE BENTO */}
                {(aiPanel.text || aiPanel.loading) && (
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top-4 mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center"><Bot size={16} className="mr-2"/> {aiPanel.title}</span>
                      <button onClick={() => setAiPanel({text:null})} className="text-indigo-400"><X size={16}/></button>
                    </div>
                    {aiPanel.loading ? (
                      <div className="flex items-center text-sm font-bold text-indigo-500"><Loader2 size={16} className="animate-spin mr-2"/> AI Berpikir...</div>
                    ) : (
                      <div className="text-[13px] leading-relaxed text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">{aiPanel.text}</div>
                    )}
                  </div>
                )}
              </div>

              <ActivityHeatmap logs={logs} />
              
            </div>
          ) : (
            
            /* TAB: TRACK LATIHAN (PUSH/PULL/LEGS/ETC) */
            <div className="space-y-4 animate-in fade-in duration-300">
              {(exerciseData[activeTab] || []).map(ex => (
                <ExerciseCard 
                  key={ex.id} exercise={ex} activeTab={activeTab} startRestTimer={setRestTime}
                  onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                  onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise}
                  history={logs.filter(l => l.exerciseId === ex.id)} 
                />
              ))}

              <button onClick={() => {
                const name = prompt("Nama Gerakan Baru:");
                if(name) setExerciseData(p => ({...p, [activeTab]: [...p[activeTab], {id: `c-${Date.now()}`, name, muscle: 'Umum', targetSets: 3, videoId: null}]}));
              }} className="w-full py-6 mt-4 border-2 border-dashed border-gray-300 dark:border-gray-800 text-gray-500 font-black uppercase tracking-widest rounded-[28px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#121215] transition-all text-[11px] active:scale-95">
                <Plus size={16} className="mr-2" /> Tambah Gerakan Cepat
              </button>
            </div>
          )}

        </main>
      </div>

      {/* FLOATING BENTO BOTTOM NAV */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 dark:bg-[#121215]/80 backdrop-blur-3xl border border-gray-200/50 dark:border-white/10 rounded-[28px] p-2 shadow-2xl flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex-1 py-3 flex flex-col items-center justify-center rounded-[20px] transition-all duration-300 ${activeTab === 'home' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
          <Home size={20} className={activeTab === 'home' ? 'mb-1' : ''} />
          {activeTab === 'home' && <span className="text-[9px] font-black uppercase tracking-widest">Home</span>}
        </button>
        <button onClick={() => setActiveTab(getTodaySplit())} className={`flex-1 py-3 flex flex-col items-center justify-center rounded-[20px] transition-all duration-300 ${activeTab !== 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 -translate-y-2' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
          <Dumbbell size={20} className={activeTab !== 'home' ? 'mb-1' : ''} />
          {activeTab !== 'home' && <span className="text-[9px] font-black uppercase tracking-widest">Track</span>}
        </button>
      </nav>

    </div>
  );
}