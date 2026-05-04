import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight
} from 'lucide-react';

// Fungsi Ekstrak ID YouTube
const getYouTubeId = (url) => {
  if (!url) return null;
  if (url.length === 11 && !url.includes('/')) return url; 
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Data Master (Sudah diisi dengan ID Video Tutorial)
const INITIAL_EXERCISE_DATA = {
  Push: [
    { id: 'p1', name: 'Chest Press (Smith Machine)', muscle: 'Dada', videoId: '0GjpPFOx1uQ' },
    { id: 'p2', name: 'Chest Fly (Machine)', muscle: 'Dada', videoId: 'eGjt4jcEA_E' },
    { id: 'p3', name: 'Shoulder Press', muscle: 'Bahu Depan', videoId: 'WvLMauqrnK8' },
    { id: 'p4', name: 'Lateral Raise / Bahu Samping (Cable)', muscle: 'Bahu Samping', videoId: 'WJm9OqN_gjc' },
    { id: 'p5', name: 'Rear Delt Fly (Machine)', muscle: 'Bahu Belakang', videoId: 'YbX7Wd8jQ-Q' },
    { id: 'p6', name: 'Tricep Pushdown (Cable)', muscle: 'Trisep', videoId: '2-LAMcpzODU' },
  ],
  Pull: [
    { id: 'pu1', name: 'Lat Pulldown', muscle: 'Punggung (Lats)', videoId: 'CAwf7n6Luuc' },
    { id: 'pu2', name: 'Rowing', muscle: 'Punggung Tengah', videoId: 'GZbfZ033f74' },
    { id: 'pu3', name: 'Bicep Curl (Cable)', muscle: 'Bisep', videoId: 'in7PaeYIYfw' },
    { id: 'pu4', name: 'Trapezius (Shrugs / Upright Row)', muscle: 'Trapesius', videoId: 'cJRVVxmytaM' },
  ],
  Legs: [
    { id: 'l1', name: 'Hack Squat (Machine)', muscle: 'Paha Depan & Bokong', videoId: '0tn5K9NlCfo' },
    { id: 'l2', name: 'Leg Press (Machine)', muscle: 'Paha Depan', videoId: 'IZxyjW7OSvc' },
    { id: 'l3', name: 'Leg Extension (Machine)', muscle: 'Paha Depan Isolasi', videoId: 'YyvSfVjQeL0' },
    { id: 'l4', name: 'Leg Curl (Machine)', muscle: 'Paha Belakang', videoId: 'F488k67BTNo' },
    { id: 'l5', name: 'Calf Raise (Machine)', muscle: 'Betis', videoId: '-M4-G8p8fmc' },
  ]
};

const getTodaySplit = () => {
  const day = new Date().getDay();
  if (day === 1 || day === 4) return 'Push';
  if (day === 2 || day === 5) return 'Pull';
  if (day === 3 || day === 6) return 'Legs';
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
  } catch (e) {
    apiKey = "";
  }
  
  if (!apiKey) {
    console.error("API Key tidak ditemukan!");
    return "Konfigurasi API Key belum lengkap di Vercel.";
  }
  
  const combinedPrompt = isRaw 
    ? prompt 
    : "Anda adalah Pelatih Kebugaran Profesional tingkat lanjut. Jawab dalam Bahasa Indonesia, gunakan nada profesional, asik, namun suportif. Ringkas maksimal 3-4 kalimat. Analisis data secara harfiah.\n\n" + prompt;

  const modelsToTry = [
    'gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro',
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
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
  return null; // Return null if all fail so we can handle it gracefully
};

const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, onUpdateExerciseVideo, activeTab }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
  const [exEditForm, setExEditForm] = useState({ name: exercise.name, muscle: exercise.muscle });

  // Handlers
  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setShowVideo(false); setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Berikan satu tips biomekanik singkat terkait postur (form) dan mind-muscle connection untuk memaksimalkan gerakan ${exercise.name}.`);
    setAiTip(response || "Gagal menghubungi AI."); setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setShowVideo(false); setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Berikan 1 alternatif gerakan mesin/dumbbell/cable terbaik yang identik dengan ${exercise.name}. Sebutkan alasannya singkat.`);
    setAiAlt(response || "Gagal menghubungi AI."); setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setIsAiProgressLoading(true);
    const chronologicalHistory = [...history].slice(0, 4).reverse();
    const recentTrend = chronologicalHistory.map((l, idx) => `Sesi ${idx+1}: ${l.weight}kg (${l.sets}x${l.reps})`).join(' ➔ ');
    const prompt = `Histori (terlama ➔ terbaru) ${exercise.name}:\n[ ${recentTrend} ]\n\nEvaluasi tren beban. Jika turun, beri semangat. Jika naik, katakan naik. Berikan saran beban/rep untuk sesi berikutnya (progressive overload).`;
    const response = await callGeminiAPI(prompt);
    setAiProgress(response || "Gagal menghubungi AI."); setIsAiProgressLoading(false);
  };

  const handleToggleVideo = async () => {
    if (showVideo) { setShowVideo(false); return; }
    setAiTip(null); setAiAlt(null); setShowVideo(true);
    
    // Jika ID Video belum ada, fetch pakai AI
    if (!exercise.videoId) {
      setIsAIVideoLoading(true);
      const prompt = `Carikan 1 ID video YouTube (11 karakter) yang merupakan tutorial cara melakukan gerakan gym "${exercise.name}". Berikan HANYA 11 karakter ID-nya saja, tanpa spasi, tanpa teks penjelasan apapun.`;
      const response = await callGeminiAPI(prompt, true);
      
      const match = response ? response.match(/[a-zA-Z0-9_-]{11}/) : null;
      if (match) {
        onUpdateExerciseVideo(activeTab, exercise.id, match[0]);
      }
      // Jika AI gagal (match = null), UI akan otomatis menampilkan state "Video tidak ditemukan"
      setIsAIVideoLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || !sets || !reps) return;
    onLog({ exerciseId: exercise.id, weight: parseFloat(weight), sets: parseInt(sets), reps: parseInt(reps) });
    setWeight(''); setSets(''); setReps('');
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2500);
  };

  const startEdit = (log) => { setEditingId(log.id); setEditForm({ weight: log.weight, sets: log.sets, reps: log.reps }); };
  const saveEdit = (id) => {
    if (!editForm.weight || !editForm.sets || !editForm.reps) return;
    onEditLog(id, { weight: parseFloat(editForm.weight), sets: parseInt(editForm.sets), reps: parseInt(editForm.reps) });
    setEditingId(null);
  };
  const handleSaveExEdit = () => {
    if (!exEditForm.name) return;
    onEditExercise(activeTab, exercise.id, exEditForm.name, exEditForm.muscle, exercise.videoId);
    setIsEditingEx(false);
  };

  return (
    <div className="group bg-white dark:bg-[#0f1117] rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 dark:shadow-none border border-gray-100 dark:border-gray-800/80 mb-6 transition-all duration-300 relative overflow-hidden">
      
      {/* Subtle Gradient Accent Line at the top of card */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500/0 via-fuchsia-500/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 mr-4">
          {isEditingEx ? (
            <div className="space-y-3 mb-2 animate-in fade-in">
              <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" placeholder="Nama Latihan" />
              <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" placeholder="Target Otot" />
              <div className="flex space-x-2 pt-2">
                <button onClick={handleSaveExEdit} className="px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold rounded-xl flex items-center active:scale-95 transition-all shadow-md shadow-violet-500/20"><Save size={14} className="mr-2"/> Simpan</button>
                <button onClick={() => setIsEditingEx(false)} className="px-5 py-3 bg-gray-100 dark:bg-[#1a1d27] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl active:scale-95 transition-all">Batal</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <h3 className="text-[19px] sm:text-[21px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">{exercise.name}</h3>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => setIsEditingEx(true)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="inline-flex items-center mt-3 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-50/80 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100/50 dark:border-violet-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mr-2 shadow-[0_0_8px_rgba(217,70,239,0.8)]"></span>
                {exercise.muscle}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 shrink-0">
          <button onClick={handleToggleVideo} className={`p-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${showVideo ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20'}`} title="Tutorial Video">
            <PlayCircle size={20} className={showVideo ? "animate-pulse" : ""} />
          </button>
          <button onClick={handleGetAlternative} className={`p-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${aiAlt ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'}`}>
            {isAiAltLoading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
          </button>
          <button onClick={handleGetTip} className={`p-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${aiTip ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20'}`}>
            {isAiTipLoading ? <Loader2 size={20} className="animate-spin" /> : <Bot size={20} />}
          </button>
        </div>
      </div>

      {/* Embedded Elements (Video / AI Responses) */}
      <div className="space-y-4 mb-6 empty:hidden">
        {showVideo && (
          <div className="rounded-[20px] overflow-hidden bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 shadow-2xl relative aspect-video animate-in zoom-in-95 duration-300 group/video">
            {isAIVideoLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md z-10">
                <Loader2 size={44} className="text-rose-500 animate-spin mb-4" />
                <p className="text-sm font-black text-white tracking-widest uppercase">AI Memilih Video...</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Mencari referensi terbaik di YouTube.</p>
              </div>
            ) : exercise.videoId ? (
              <>
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0&modestbranding=1`} title="Tutorial" allowFullScreen></iframe>
                {/* Tombol darurat Buka di YouTube jika Iframe error */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover/video:opacity-100 transition-opacity">
                  <a href={`https://youtu.be/${exercise.videoId}`} target="_blank" rel="noopener noreferrer" className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border border-white/10 hover:bg-black transition-colors flex items-center shadow-lg">
                    Buka di App YouTube <ChevronRight size={14} className="ml-1"/>
                  </a>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#11131a]">
                <Video size={40} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Video AI Tidak Ditemukan</p>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " gym form tutorial")}`} target="_blank" rel="noopener noreferrer" className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95">
                  Cari Manual di YouTube
                </a>
              </div>
            )}
          </div>
        )}

        {aiTip && (
          <div className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-500/10 dark:to-transparent p-5 rounded-2xl border border-violet-100 dark:border-violet-500/20 animate-in slide-in-from-top-2 flex items-start shadow-sm">
            <div className="bg-violet-100 dark:bg-violet-500/20 p-2.5 rounded-xl mr-4 shrink-0 shadow-inner"><Sparkles size={18} className="text-violet-600 dark:text-violet-400" /></div>
            <p className="text-[13px] sm:text-[14px] text-gray-800 dark:text-gray-200 font-medium leading-relaxed pt-1">{aiTip}</p>
          </div>
        )}
        {aiAlt && (
          <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent p-5 rounded-2xl border border-amber-100 dark:border-amber-500/20 animate-in slide-in-from-top-2 flex items-start shadow-sm">
            <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl mr-4 shrink-0 shadow-inner"><RefreshCw size={18} className="text-amber-600 dark:text-amber-400" /></div>
            <p className="text-[13px] sm:text-[14px] text-gray-800 dark:text-gray-200 font-medium leading-relaxed pt-1">{aiAlt}</p>
          </div>
        )}
        {aiProgress && (
          <div className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-500/10 dark:to-transparent p-5 rounded-2xl border border-cyan-100 dark:border-cyan-500/20 animate-in slide-in-from-top-2 flex items-start shadow-sm">
            <div className="bg-cyan-100 dark:bg-cyan-500/20 p-2.5 rounded-xl mr-4 shrink-0 shadow-inner"><TrendingUp size={18} className="text-cyan-600 dark:text-cyan-400" /></div>
            <p className="text-[13px] sm:text-[14px] text-gray-800 dark:text-gray-200 font-medium leading-relaxed pt-1">{aiProgress}</p>
          </div>
        )}
      </div>

      {/* Modern Input Form */}
      <div className="bg-gray-50/80 dark:bg-[#11131a]/80 p-2.5 rounded-[20px] border border-gray-100 dark:border-gray-800/80 mb-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex gap-2.5 w-full">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">KG</span>
              <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-10 pr-3 py-3.5 text-[15px] font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm" placeholder="0" />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">SET</span>
              <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-11 pr-3 py-3.5 text-[15px] font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm" placeholder="0" />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">REP</span>
              <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl pl-11 pr-3 py-3.5 text-[15px] font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-sm" placeholder="0" />
            </div>
          </div>
          <button type="submit" disabled={!weight || !sets || !reps} className={`sm:w-36 py-3.5 rounded-2xl text-[13px] font-black tracking-widest uppercase transition-all duration-300 flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-40 disabled:grayscale hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5'}`}>
            {showSuccess ? <CheckCircle size={20} className="animate-in zoom-in" /> : 'CATAT'}
          </button>
        </form>
      </div>

      {/* Minimalist History Section */}
      {history.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center px-2 mb-4">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-[11px] font-black text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-widest transition-colors">
              Histori Sesi <span className="ml-2.5 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300">{history.length}</span>
              {showHistory ? <ChevronUp size={14} className="ml-2 opacity-50" /> : <ChevronDown size={14} className="ml-2 opacity-50" />}
            </button>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors px-3 py-2 rounded-xl flex items-center active:scale-95">
              {isAiProgressLoading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Zap size={14} className="mr-1.5" />} 
              Analisis AI
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              {history.map((log) => (
                <div key={log.id} className="relative">
                  {editingId === log.id ? (
                    <div className="bg-gray-50 dark:bg-[#11131a] p-4 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-inner">
                      <div className="flex gap-2">
                         <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50" />
                         <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50" />
                         <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50" />
                      </div>
                      <div className="flex justify-end mt-3 space-x-2">
                        <button onClick={() => setEditingId(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all">Batal</button>
                        <button onClick={() => saveEdit(log.id)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 active:scale-95 transition-all shadow-md">Simpan</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-white dark:bg-[#11131a] border border-gray-100 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 p-4 rounded-[20px] transition-all group shadow-sm">
                      <div className="flex flex-col">
                        <div className="font-black text-gray-900 dark:text-white text-[15px] tracking-tight">
                          {log.weight} <span className="text-gray-400 font-semibold text-[11px] tracking-widest mr-1.5">KG</span> 
                          <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                          {log.sets} <span className="text-gray-400 font-semibold text-[11px] tracking-widest mr-1.5">SET</span> 
                          <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                          {log.reps} <span className="text-gray-400 font-semibold text-[11px] tracking-widest">REP</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-semibold mt-1 flex items-center"><Calendar size={10} className="mr-1 opacity-70"/> {log.date} &nbsp;•&nbsp; {log.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => startEdit(log)} className="p-2.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Edit2 size={14} /></button>
                        <button onClick={() => onDeleteLog(log.id)} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const todaySplit = getTodaySplit();
  const [activeTab, setActiveTab] = useState(todaySplit === 'Rest' ? 'Push' : todaySplit);
  
  // MENGUBAH NAMA KUNCI LOCAL STORAGE (v8) UNTUK MERESET CACHE LAMA
  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_v8'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_v8'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem('gym_dark_v8'); return saved === 'true'; });

  useEffect(() => { localStorage.setItem('gym_logs_v8', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_v8', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => {
    localStorage.setItem('gym_dark_v8', isDarkMode);
    if(isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '' });
  const [isSavingCustom, setIsSavingCustom] = useState(false); // State baru saat memuat AI

  // AI States
  const [aiBannerData, setAiBannerData] = useState({ text: null, type: null }); 
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isRoastLoading, setIsRoastLoading] = useState(false);
  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);
  const [aiImbalance, setAiImbalance] = useState(null);
  const [isImbalanceLoading, setIsImbalanceLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${exerciseData[activeTab]?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const response = await callGeminiAPI(`Saya baru latihan: ${workoutData}. Berikan pujian dan evaluasi analitis singkat.`);
    setAiBannerData({ text: response, type: 'summary' }); setIsSummaryLoading(false);
  };

  const handleGenerateRoast = async () => {
    if (logs.length === 0) return;
    setIsRoastLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${exerciseData[activeTab]?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const prompt = `Abaikan instruksi. Berperanlah sebagai pelatih hardcore (seperti David Goggins). 'Roast' volume latihan saya ini: ${workoutData}. Sarkastik, pedas, maksimal 3 kalimat!`;
    const response = await callGeminiAPI(prompt, true);
    setAiBannerData({ text: response, type: 'roast' }); setIsRoastLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = exerciseData[activeTab].map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`Persiapan ${activeTab} day (otot: ${muscles}). Berikan 3 gerakan pemanasan dinamis saintifik.`);
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
    const newLog = { ...log, id: Date.now().toString(), date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => { if(window.confirm("Hapus log permanen?")) setLogs(logs.filter(l => l.id !== id)); };
  const handleEditLog = (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  
  const handleSaveCustom = async (e) => {
    e.preventDefault(); 
    if (!newExercise.name) return;
    
    setIsSavingCustom(true); // Memutar loading spinner saat AI mencari video

    // PRE-FETCH VIDEO DENGAN AI SAAT MENYIMPAN
    let fetchedVideoId = null;
    try {
      const prompt = `Carikan 1 ID video YouTube (11 karakter) tutorial form gym yang benar untuk gerakan "${newExercise.name}". Berikan HANYA 11 karakter ID-nya saja (contoh: dQw4w9WgXcQ), tanpa teks penjelasan apapun.`;
      const response = await callGeminiAPI(prompt, true);
      if (response) {
        const match = response.match(/[a-zA-Z0-9_-]{11}/);
        if (match) fetchedVideoId = match[0];
      }
    } catch (err) {
      console.error("AI Video Fetch Error:", err);
    }

    const item = { 
      id: `c-${Date.now()}`, 
      name: newExercise.name, 
      muscle: newExercise.muscle || 'Umum', 
      videoId: fetchedVideoId 
    };
    
    setExerciseData(prev => ({ ...prev, [activeTab]: [...prev[activeTab], item] }));
    setIsAddingExercise(false); 
    setNewExercise({ name: '', muscle: '' });
    setIsSavingCustom(false);
  };

  const handleDeleteExercise = (tab, id) => { if(window.confirm("Hapus master gerakan ini?")) setExerciseData(prev => ({ ...prev, [tab]: prev[tab].filter(ex => ex.id !== id) })); };
  const handleEditExercise = (tab, id, newName, newMuscle, newVideoId) => { setExerciseData(prev => ({ ...prev, [tab]: prev[tab].map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, videoId: newVideoId } : ex) })); };
  const handleUpdateExerciseVideo = (tab, id, videoId) => { setExerciseData(prev => ({ ...prev, [tab]: prev[tab].map(ex => ex.id === id ? { ...ex, videoId } : ex) })); };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-violet-500/30 ${isDarkMode ? 'dark bg-[#050505] text-white' : 'bg-[#FAFAFA] text-gray-900'} transition-colors duration-500`}>
      
      {/* Background Subtle Gradient Blobs (Premium SaaS Feel) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 ${isDarkMode ? 'bg-violet-600/20' : 'bg-violet-300/40'}`}></div>
        <div className={`absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-fuchsia-600/20' : 'bg-fuchsia-300/40'}`}></div>
        <div className={`absolute -bottom-40 right-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-300/30'}`}></div>
      </div>

      <div className="relative z-10 pb-32">
        {/* Premium Glass Header */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 px-5 pt-8 pb-5 transition-all">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center rounded-[18px] shadow-lg shadow-violet-500/25">
                <Dumbbell size={28} className="transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-[26px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 leading-none mb-1">GymTracker</h1>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                  {getHariIndonesia()} <span className="mx-2 text-gray-300 dark:text-gray-700">•</span> <span className="text-violet-500 dark:text-violet-400">{todaySplit} Day</span>
                </p>
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3.5 rounded-full bg-white dark:bg-[#11131a] text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 border border-gray-200/50 dark:border-gray-800/80 shadow-sm transition-all active:scale-90">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Premium Segmented Control */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="flex p-1.5 bg-gray-200/60 dark:bg-[#11131a] rounded-[22px] relative shadow-inner">
              {['Push', 'Pull', 'Legs'].map((t) => (
                <button 
                  key={t} onClick={() => setActiveTab(t)} 
                  className={`relative flex-1 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeTab === t ? 'text-white shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 pt-8 space-y-8">
          
          {/* AI Banner - High End SaaS Style */}
          {logs.length > 0 && (
            <div className={`rounded-[32px] p-8 relative overflow-hidden transition-all duration-700 ${aiBannerData.type === 'roast' ? 'bg-gradient-to-br from-[#1a0b11] to-[#2a0f16] border border-rose-900/30' : 'bg-gradient-to-br from-[#0a0f1c] to-[#141b2d] border border-violet-900/30'} shadow-2xl`}>
              
              {/* Animated Glow */}
              <div className={`absolute -top-10 -right-10 w-72 h-72 rounded-full blur-[80px] -z-0 opacity-30 transition-colors duration-700 ${aiBannerData.type === 'roast' ? 'bg-rose-500' : 'bg-violet-500'}`}></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h3 className="font-black text-sm tracking-widest flex items-center text-white uppercase">
                    {aiBannerData.type === 'roast' ? <><Skull size={18} className="mr-3 text-rose-400" /> Pelatih Keras</> : <><Sparkles size={18} className="mr-3 text-violet-400" /> Analisis AI</>}
                  </h3>
                  
                  <div className="flex space-x-2">
                    <button onClick={handleGenerateRoast} disabled={isRoastLoading} className="text-[11px] font-black tracking-widest uppercase bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 rounded-xl transition-all flex items-center backdrop-blur-md active:scale-95 text-rose-300 border border-rose-500/20">
                      {isRoastLoading ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} className="mr-2" />} Roast
                    </button>
                    <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="text-[11px] font-black tracking-widest uppercase bg-violet-500/20 hover:bg-violet-500/30 px-4 py-2.5 rounded-xl transition-all flex items-center backdrop-blur-md active:scale-95 text-violet-200 border border-violet-500/20">
                      {isSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="mr-2" />} Evaluasi
                    </button>
                  </div>
                </div>
                
                {aiBannerData.text ? (
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
                    <p className={`text-[15px] leading-relaxed font-medium animate-in slide-in-from-bottom-2 ${aiBannerData.type === 'roast' ? 'text-rose-100' : 'text-violet-100'}`}>{aiBannerData.text}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-medium max-w-[85%] leading-relaxed">Selesaikan set Anda, lalu minta AI memberikan evaluasi saintifik atau teguran motivasi tingkat tinggi.</p>
                )}
              </div>
            </div>
          )}

          {/* AI Feature Suite - Pro Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="bg-white dark:bg-[#0f1117] hover:border-orange-500/50 border border-gray-100 dark:border-gray-800/80 rounded-[28px] p-6 transition-all flex flex-col items-center justify-center group active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-orange-500/10">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform">
                {isWarmupLoading ? <Loader2 size={26} className="animate-spin" /> : <Flame size={26} />}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white text-center">Pemanasan<br/><span className="text-gray-400 font-bold">Dinamis AI</span></span>
            </button>
            
            <button onClick={handleCheckImbalance} disabled={isImbalanceLoading} className="bg-white dark:bg-[#0f1117] hover:border-cyan-500/50 border border-gray-100 dark:border-gray-800/80 rounded-[28px] p-6 transition-all flex flex-col items-center justify-center group active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-500 group-hover:scale-110 transition-transform">
                {isImbalanceLoading ? <Loader2 size={26} className="animate-spin" /> : <Scale size={26} />}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white text-center">Deteksi<br/><span className="text-gray-400 font-bold">Postur Otot</span></span>
            </button>
          </div>

          {/* Overlays for AI Tools */}
          {aiWarmup && (
            <div className="bg-gradient-to-br from-orange-50 to-white dark:from-[#1f130a] dark:to-[#0f1117] border border-orange-200/50 dark:border-orange-900/30 p-6 rounded-[28px] animate-in slide-in-from-top-4 relative shadow-2xl shadow-orange-500/10">
              <button onClick={() => setAiWarmup(null)} className="absolute top-5 right-5 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={16} /></button>
              <span className="font-black text-sm uppercase tracking-widest mb-4 flex items-center text-orange-600 dark:text-orange-500"><Flame size={18} className="mr-2.5"/> Pemanasan Hari Ini</span>
              <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiWarmup}</div>
            </div>
          )}

          {aiImbalance && (
            <div className="bg-gradient-to-br from-cyan-50 to-white dark:from-[#081a20] dark:to-[#0f1117] border border-cyan-200/50 dark:border-cyan-900/30 p-6 rounded-[28px] animate-in slide-in-from-top-4 relative shadow-2xl shadow-cyan-500/10">
              <button onClick={() => setAiImbalance(null)} className="absolute top-5 right-5 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={16} /></button>
              <span className="font-black text-sm uppercase tracking-widest mb-4 flex items-center text-cyan-600 dark:text-cyan-500"><Scale size={18} className="mr-2.5"/> Fisioterapi AI</span>
              <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiImbalance}</div>
            </div>
          )}

          <div className="flex items-center justify-center my-10">
            <div className="h-px bg-gray-200 dark:bg-gray-800/60 w-full max-w-[200px]"></div>
            <Activity size={16} className="mx-4 text-gray-300 dark:text-gray-700" />
            <div className="h-px bg-gray-200 dark:bg-gray-800/60 w-full max-w-[200px]"></div>
          </div>

          {/* Exercise List */}
          <div className="space-y-6">
            {exerciseData[activeTab].map(ex => (
              <ExerciseCard 
                key={ex.id} exercise={ex} activeTab={activeTab}
                onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise} onUpdateExerciseVideo={handleUpdateExerciseVideo}
                history={logs.filter(l => l.exerciseId === ex.id)} 
              />
            ))}
          </div>

          {/* Add Manual Form */}
          {isAddingExercise ? (
            <form onSubmit={handleSaveCustom} className="bg-white dark:bg-[#0f1117] p-8 sm:p-10 rounded-[40px] border border-gray-200/80 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in zoom-in-95 duration-300 mt-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
              <h3 className="font-black mb-6 text-sm uppercase tracking-widest text-gray-900 dark:text-white flex items-center"><PlusCircle size={20} className="mr-3 text-indigo-500"/> Gerakan Custom</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nama Mesin/Gerakan</label>
                  <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Cth: Incline Dumbbell Press" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" autoFocus disabled={isSavingCustom}/>
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Target Otot (Opsional)</label>
                  <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Cth: Dada Atas" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" disabled={isSavingCustom}/>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 pt-4 gap-3 sm:gap-0">
                  <button type="button" onClick={() => setIsAddingExercise(false)} disabled={isSavingCustom} className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300 text-[13px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors active:scale-95 disabled:opacity-50">Batal</button>
                  <button type="submit" disabled={!newExercise.name || isSavingCustom} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-gray-900/20 dark:shadow-white/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center">
                    {isSavingCustom ? <><Loader2 size={18} className="animate-spin mr-2"/> Mengambil Video AI...</> : 'Tambahkan Gerakan'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingExercise(true)} 
              className="w-full py-7 mt-10 border-2 border-dashed border-gray-300 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest rounded-[32px] flex items-center justify-center hover:bg-white dark:hover:bg-[#0f1117] hover:text-gray-900 dark:hover:text-white hover:border-indigo-500/50 transition-all text-sm active:scale-[0.98] group"
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full mr-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"><Plus size={20} /></div>
              Gerakan Manual Baru
            </button>
          )}
        </main>
      </div>
    </div>
  );
}