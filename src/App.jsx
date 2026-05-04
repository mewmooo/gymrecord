import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight
} from 'lucide-react';

// Fungsi Ekstrak ID YouTube yang diperbarui agar sangat akurat untuk Shorts & video biasa
const getYouTubeId = (url) => {
  if (!url) return null;
  // Jika user langsung memasukkan 11 karakter ID
  if (url.length === 11 && !url.includes('/')) return url; 
  // Regex komprehensif untuk YouTube standard dan Shorts
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Data Master
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
    : "Anda adalah Pelatih Kebugaran Profesional tingkat lanjut. Jawab dalam Bahasa Indonesia, gunakan nada profesional, asik, namun suportif. Ringkas maksimal 3-5 kalimat. Analisis data secara harfiah.\n\n" + prompt;

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

const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, activeTab }) => {
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

  // Edit Exercise State
  const [isEditingEx, setIsEditingEx] = useState(false);
  const [exEditForm, setExEditForm] = useState({ 
    name: exercise.name, 
    muscle: exercise.muscle,
    videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : ''
  });

  // Handlers
  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setShowVideo(false);
    setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Berikan satu tips biomekanik singkat terkait postur (form) dan mind-muscle connection untuk memaksimalkan gerakan ${exercise.name}.`);
    setAiTip(response || "Gagal menghubungi AI."); setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setShowVideo(false);
    setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Berikan 1 alternatif gerakan mesin/dumbbell/cable terbaik yang identik dengan ${exercise.name}. Sebutkan alasannya singkat, DAN jelaskan langkah-langkah cara melakukan gerakan alternatif tersebut secara ringkas.`);
    setAiAlt(response || "Gagal menghubungi AI."); setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setShowVideo(false);
    setIsAiProgressLoading(true);
    const chronologicalHistory = [...history].slice(0, 4).reverse();
    const recentTrend = chronologicalHistory.map((l, idx) => `Sesi ${idx+1}: ${l.weight}kg (${l.sets}x${l.reps})`).join(' ➔ ');
    const prompt = `Histori (terlama ➔ terbaru) ${exercise.name}:\n[ ${recentTrend} ]\n\nEvaluasi tren beban. Jika turun, beri semangat. Jika naik, katakan naik. Berikan saran beban/rep untuk sesi berikutnya (progressive overload).`;
    const response = await callGeminiAPI(prompt);
    setAiProgress(response || "Gagal menghubungi AI."); setIsAiProgressLoading(false);
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
    const extractedVideoId = getYouTubeId(exEditForm.videoUrl);
    onEditExercise(activeTab, exercise.id, exEditForm.name, exEditForm.muscle, extractedVideoId);
    setIsEditingEx(false);
  };

  return (
    <div className="group bg-white dark:bg-[#0f1117] rounded-[24px] p-5 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:shadow-none border border-gray-100 dark:border-gray-800/80 mb-6 transition-all duration-300 relative overflow-hidden">
      
      {/* Subtle Gradient Accent Line at the top of card */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500/0 via-fuchsia-500/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6">
        <div className="flex-1 w-full">
          {isEditingEx ? (
            <div className="space-y-3 mb-2 animate-in fade-in">
              <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none" placeholder="Nama Latihan" />
              <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[16px] sm:text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none" placeholder="Target Otot" />
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
                      // Reset state input form ke data terbaru dari exercise sebelum mulai edit
                      setExEditForm({ 
                        name: exercise.name, 
                        muscle: exercise.muscle,
                        videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : ''
                      });
                      setIsEditingEx(true);
                    }} 
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit Gerakan & Video"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="inline-flex items-center mt-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gray-100 dark:bg-[#1a1d27] text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                {exercise.muscle}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons: Berbaris ke kanan agar rapi di HP */}
        <div className="flex space-x-2 shrink-0 self-end sm:self-start w-full sm:w-auto justify-end">
          {exercise.videoId ? (
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowVideo(!showVideo);
                setAiTip(null);
                setAiAlt(null);
              }}
              className={`p-3 rounded-2xl transition-all active:scale-95 border flex items-center justify-center ${showVideo ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25' : 'bg-white dark:bg-[#1a1d27] text-rose-500 border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`} 
              title="Putar Video Tutorial"
            >
              <PlayCircle size={18} className={showVideo ? "animate-pulse" : ""} />
            </button>
          ) : (
            <a 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " gym form tutorial")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl transition-all active:scale-95 border flex items-center justify-center bg-white dark:bg-[#1a1d27] text-rose-500 border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10" 
              title="Cari Tutorial di YouTube"
            >
              <PlayCircle size={18} />
            </a>
          )}
          
          <button onClick={handleGetAlternative} className="p-3 rounded-2xl bg-white dark:bg-[#1a1d27] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 transition-all active:scale-95 flex items-center justify-center group-hover:border-gray-300 dark:group-hover:border-gray-700">
            {isAiAltLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
          <button onClick={handleGetTip} className="p-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center">
            {isAiTipLoading ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
          </button>
        </div>
      </div>

      {/* Embedded Elements (Video / AI Responses) */}
      <div className="space-y-4 mb-6 empty:hidden">
        {showVideo && exercise.videoId && (
          <div className="rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-gray-800 shadow-2xl relative aspect-video animate-in zoom-in-95 duration-300">
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

      {/* Modern Input Form - Dibuat sangat responsif */}
      <div className="bg-gray-50/50 dark:bg-[#0a0a0a] p-2.5 sm:p-2 rounded-2xl border border-gray-100 dark:border-gray-800/80 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-2">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">KG</span>
              {/* text-[16px] kunci menghindari iOS Auto-Zoom */}
              <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl pl-8 sm:pl-10 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">SET</span>
              <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl pl-10 sm:pl-11 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-black text-gray-400">REP</span>
              <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-white dark:bg-[#11131a] border border-gray-200 dark:border-gray-800 rounded-xl pl-10 sm:pl-11 pr-2 py-3.5 sm:py-3 text-[16px] sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none" placeholder="0" />
            </div>
          </div>
          <button type="submit" disabled={!weight || !sets || !reps} className={`sm:w-32 py-3.5 sm:py-3 rounded-xl text-[13px] sm:text-xs font-black tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-gray-900/10 dark:shadow-white/10 disabled:opacity-30 hover:bg-gray-800 dark:hover:bg-gray-100'}`}>
            {showSuccess ? <CheckCircle size={18} /> : 'CATAT'}
          </button>
        </form>
      </div>

      {/* Minimalist History Section */}
      {history.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center px-2 mb-4 gap-3 sm:gap-0">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-[11px] font-extrabold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-widest transition-colors">
              Histori Sesi <span className="ml-2 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{history.length}</span>
              {showHistory ? <ChevronUp size={14} className="ml-2 opacity-50" /> : <ChevronDown size={14} className="ml-2 opacity-50" />}
            </button>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] w-fit font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors px-3 py-2 rounded-lg flex items-center active:scale-95 border border-indigo-100 dark:border-indigo-500/20 sm:border-transparent">
              {isAiProgressLoading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Zap size={14} className="mr-1.5" />} 
              Analisis AI
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              {history.map((log) => (
                <div key={log.id} className="relative">
                  {editingId === log.id ? (
                    <div className="bg-gray-50 dark:bg-[#1a1d27] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-inner">
                      <div className="flex gap-2">
                         <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                         <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                         <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />
                      </div>
                      <div className="flex justify-end mt-3 space-x-2">
                        <button onClick={() => setEditingId(null)} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all">Batal</button>
                        <button onClick={() => saveEdit(log.id)} className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20">Simpan</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-white dark:bg-[#11131a] border border-gray-100 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 p-4 rounded-2xl transition-all group shadow-sm flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
                      <div className="flex flex-col w-full sm:w-auto">
                        <div className="font-black text-gray-900 dark:text-white text-[15px] tracking-tight">
                          {log.weight} <span className="text-gray-400 font-semibold text-xs tracking-widest mr-1">KG</span> 
                          <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                          {log.sets} <span className="text-gray-400 font-semibold text-xs tracking-widest mr-1">SET</span> 
                          <span className="text-gray-300 dark:text-gray-700 mx-1">×</span> 
                          {log.reps} <span className="text-gray-400 font-semibold text-xs tracking-widest">REP</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-semibold mt-1 flex items-center"><Calendar size={10} className="mr-1 opacity-70"/> {log.date} &nbsp;•&nbsp; {log.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 border-t border-gray-100 dark:border-gray-800/80 sm:border-0 pt-2 sm:pt-0">
                        <button onClick={() => startEdit(log)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all bg-gray-50 dark:bg-gray-800/50"><Edit2 size={14} /></button>
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
  
  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_pro'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_pro'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem('gym_dark_pro'); return saved === 'true'; });

  useEffect(() => { localStorage.setItem('gym_logs_pro', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_pro', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => {
    localStorage.setItem('gym_dark_pro', isDarkMode);
    if(isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '' });

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
  
  const handleSaveCustom = (e) => {
    e.preventDefault(); if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Umum', videoId: null };
    setExerciseData({ ...exerciseData, [activeTab]: [...exerciseData[activeTab], item] });
    setIsAddingExercise(false); setNewExercise({ name: '', muscle: '' });
  };
  
  const handleDeleteExercise = (tab, id) => { if(window.confirm("Hapus master gerakan ini?")) setExerciseData(prev => ({ ...prev, [tab]: prev[tab].filter(ex => ex.id !== id) })); };
  
  const handleEditExercise = (tab, id, newName, newMuscle, newVideoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: prev[tab].map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, videoId: newVideoId } : ex) })); 
  };

  return (
    // pb-[env(safe-area-inset-bottom)] sangat krusial untuk iPhone x dan keatas (notch/home indicator padding)
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500/30 ${isDarkMode ? 'dark bg-[#0a0a0a] text-white' : 'bg-[#FAFAFA] text-gray-900'} transition-colors duration-500 pb-[env(safe-area-inset-bottom)]`}>
      
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-indigo-600/30' : 'bg-indigo-300'}`}></div>
        <div className={`absolute top-40 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-200'}`}></div>
      </div>

      <div className="relative z-10 pb-24 sm:pb-32">
        {/* Premium Glass Header */}
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
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-gray-100/80 dark:bg-[#1a1d27]/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all active:scale-90 shrink-0">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Premium Segmented Control */}
          <div className="max-w-2xl mx-auto mt-6 sm:mt-8">
            <div className="flex p-1.5 bg-gray-200/50 dark:bg-[#11131a] rounded-[18px] sm:rounded-[20px] relative overflow-x-auto no-scrollbar">
              {['Push', 'Pull', 'Legs'].map((t) => (
                <button 
                  key={t} onClick={() => setActiveTab(t)} 
                  className={`relative flex-1 min-w-[80px] py-3 rounded-[14px] sm:rounded-2xl text-[12px] sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeTab === t ? 'text-gray-900 dark:text-white shadow-md bg-white dark:bg-[#1f2230]' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-5 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
          
          {/* AI Banner - High End SaaS Style */}
          {logs.length > 0 && (
            <div className={`rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 relative overflow-hidden transition-all duration-700 ${aiBannerData.type === 'roast' ? 'bg-[#1a0b11] border border-rose-900/30' : 'bg-[#0a0f1c] border border-indigo-900/30'}`}>
              
              {/* Animated Glow */}
              <div className={`absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-[60px] sm:blur-[80px] -z-0 opacity-40 transition-colors duration-700 ${aiBannerData.type === 'roast' ? 'bg-rose-600' : 'bg-indigo-600'}`}></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5 sm:mb-6">
                  <h3 className="font-black text-xs sm:text-sm tracking-widest flex items-center text-white uppercase">
                    {aiBannerData.type === 'roast' ? <><Skull size={16} className="mr-2.5 text-rose-500" /> Pelatih Keras</> : <><Sparkles size={16} className="mr-2.5 text-indigo-400" /> Analisis AI</>}
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
                  <p className="text-[13px] sm:text-sm text-gray-400 font-medium max-w-[90%] sm:max-w-[85%] leading-relaxed">Selesaikan set Anda, lalu minta AI memberikan evaluasi saintifik atau teguran motivasi tingkat tinggi.</p>
                )}
              </div>
            </div>
          )}

          {/* AI Feature Suite - Pro Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="bg-white dark:bg-[#0f1117] hover:border-orange-500/50 border border-gray-100 dark:border-gray-800/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 transition-all flex sm:flex-col items-center sm:justify-center group active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-orange-500/10 gap-4 sm:gap-0 text-left sm:text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center sm:mb-4 text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                {isWarmupLoading ? <Loader2 size={22} className="animate-spin" /> : <Flame size={22} />}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Pemanasan <span className="hidden sm:inline"><br/></span><span className="text-gray-400 font-bold">Dinamis AI</span></span>
            </button>
            
            <button onClick={handleCheckImbalance} disabled={isImbalanceLoading} className="bg-white dark:bg-[#0f1117] hover:border-cyan-500/50 border border-gray-100 dark:border-gray-800/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 transition-all flex sm:flex-col items-center sm:justify-center group active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 gap-4 sm:gap-0 text-left sm:text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center sm:mb-4 text-cyan-500 group-hover:scale-110 transition-transform shrink-0">
                {isImbalanceLoading ? <Loader2 size={22} className="animate-spin" /> : <Scale size={22} />}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Deteksi <span className="hidden sm:inline"><br/></span><span className="text-gray-400 font-bold">Postur Otot</span></span>
            </button>
          </div>

          {/* Overlays for AI Tools */}
          {aiWarmup && (
            <div className="bg-gradient-to-br from-orange-50 to-white dark:from-[#1f130a] dark:to-[#0f1117] border border-orange-200/50 dark:border-orange-900/30 p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] animate-in slide-in-from-top-4 relative shadow-2xl shadow-orange-500/10">
              <button onClick={() => setAiWarmup(null)} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={16} /></button>
              <span className="font-black text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4 flex items-center text-orange-600 dark:text-orange-500"><Flame size={16} className="mr-2.5 sm:mr-2.5"/> Pemanasan Hari Ini</span>
              <div className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiWarmup}</div>
            </div>
          )}

          {aiImbalance && (
            <div className="bg-gradient-to-br from-cyan-50 to-white dark:from-[#081a20] dark:to-[#0f1117] border border-cyan-200/50 dark:border-cyan-900/30 p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] animate-in slide-in-from-top-4 relative shadow-2xl shadow-cyan-500/10">
              <button onClick={() => setAiImbalance(null)} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={16} /></button>
              <span className="font-black text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4 flex items-center text-cyan-600 dark:text-cyan-500"><Scale size={16} className="mr-2.5 sm:mr-2.5"/> Fisioterapi AI</span>
              <div className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-medium">{aiImbalance}</div>
            </div>
          )}

          <div className="flex items-center justify-center my-8 sm:my-10">
            <div className="h-px bg-gray-200 dark:bg-gray-800/60 w-full max-w-[150px] sm:max-w-[200px]"></div>
            <Activity size={16} className="mx-4 text-gray-300 dark:text-gray-700 shrink-0" />
            <div className="h-px bg-gray-200 dark:bg-gray-800/60 w-full max-w-[150px] sm:max-w-[200px]"></div>
          </div>

          {/* Exercise List */}
          <div className="space-y-6">
            {exerciseData[activeTab].map(ex => (
              <ExerciseCard 
                key={ex.id} exercise={ex} activeTab={activeTab}
                onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise}
                history={logs.filter(l => l.exerciseId === ex.id)} 
              />
            ))}
          </div>

          {/* Add Manual Form */}
          {isAddingExercise ? (
            <form onSubmit={handleSaveCustom} className="bg-white dark:bg-[#0f1117] p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in zoom-in-95 duration-300 mt-8 sm:mt-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <h3 className="font-black mb-5 sm:mb-6 text-sm uppercase tracking-widest text-gray-900 dark:text-white flex items-center"><PlusCircle size={20} className="mr-3 text-indigo-500"/> Gerakan Custom</h3>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nama Mesin/Gerakan</label>
                  {/* text-[16px] krusial menghindari iOS Auto Zoom */}
                  <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Cth: Incline Dumbbell Press" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-[16px] sm:text-[15px] font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" autoFocus/>
                </div>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Target Otot (Opsional)</label>
                  <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Cth: Dada Atas" className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-[16px] sm:text-[15px] font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 pt-3 sm:pt-4 gap-3 sm:gap-0">
                  <button type="button" onClick={() => setIsAddingExercise(false)} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300 text-[13px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors active:scale-95">Batal</button>
                  <button type="submit" disabled={!newExercise.name} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-black uppercase tracking-widest py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl shadow-gray-900/20 dark:shadow-white/20 disabled:opacity-30 transition-all active:scale-95">Tambahkan ke {activeTab}</button>
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
        </main>
      </div>
    </div>
  );
}