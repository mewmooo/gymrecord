import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, Utensils, TrendingUp, PlusCircle, Moon, Sun, ChevronRight, Flame
} from 'lucide-react';

// Data Master Awal
const INITIAL_EXERCISE_DATA = {
  Push: [
    { id: 'p1', name: 'Chest Press (Smith Machine)', muscle: 'Dada' },
    { id: 'p2', name: 'Chest Fly (Machine)', muscle: 'Dada' },
    { id: 'p3', name: 'Shoulder Press', muscle: 'Bahu Depan' },
    { id: 'p4', name: 'Lateral Raise / Bahu Samping (Cable)', muscle: 'Bahu Samping' },
    { id: 'p5', name: 'Rear Delt Fly (Machine)', muscle: 'Bahu Belakang' },
    { id: 'p6', name: 'Tricep Pushdown (Cable)', muscle: 'Trisep' },
  ],
  Pull: [
    { id: 'pu1', name: 'Lat Pulldown', muscle: 'Punggung (Lats)' },
    { id: 'pu2', name: 'Rowing', muscle: 'Punggung Tengah' },
    { id: 'pu3', name: 'Bicep Curl (Cable)', muscle: 'Bisep' },
    { id: 'pu4', name: 'Trapezius (Shrugs / Upright Row)', muscle: 'Trapesius' },
  ],
  Legs: [
    { id: 'l1', name: 'Hack Squat (Machine)', muscle: 'Paha Depan & Bokong' },
    { id: 'l2', name: 'Leg Press (Machine)', muscle: 'Paha Depan' },
    { id: 'l3', name: 'Leg Extension (Machine)', muscle: 'Paha Depan Isolasi' },
    { id: 'l4', name: 'Leg Curl (Machine)', muscle: 'Paha Belakang' },
    { id: 'l5', name: 'Calf Raise (Machine)', muscle: 'Betis' },
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

const callGeminiAPI = async (prompt) => {
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
  
  const combinedPrompt = "Anda adalah Pelatih Kebugaran Profesional tingkat lanjut. Jawab dalam Bahasa Indonesia, gunakan nada profesional namun suportif, ringkas maksimal 3-4 kalimat. Analisis data secara harfiah tanpa asumsi.\n\n" + prompt;

  // Daftar model diperbarui berdasarkan Google AI Studio (Gemini 3 dan 2.5)
  const modelsToTry = [
    'gemini-3-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2-flash',
    'gemini-1.5-flash'
  ];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: combinedPrompt }] }]
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons.";
      }
    } catch (error) {
      console.error(`Error pada model ${modelName}:`, error);
    }
  }
  return "Maaf, AI Coach gagal merespons. Cek koneksi atau API Key.";
};

const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', sets: '', reps: '' });

  const [aiTip, setAiTip] = useState(null);
  const [isAiTipLoading, setIsAiTipLoading] = useState(false);
  const [aiAlt, setAiAlt] = useState(null);
  const [isAiAltLoading, setIsAiAltLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(null);
  const [isAiProgressLoading, setIsAiProgressLoading] = useState(false);

  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Berikan satu tips biomekanik singkat terkait postur (form) dan mind-muscle connection untuk memaksimalkan gerakan ${exercise.name}.`);
    setAiTip(response);
    setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Berikan 1 alternatif gerakan mesin/dumbbell/cable terbaik yang secara biomekanik identik dengan ${exercise.name}. Sebutkan alasannya singkat.`);
    setAiAlt(response);
    setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setIsAiProgressLoading(true);
    
    // PERBAIKAN LOGIKA: Array history menyimpan data terbaru di awal. 
    // Kita ambil 4 data terakhir, lalu balik (reverse) agar kronologinya "Terlama -> Terbaru"
    const chronologicalHistory = [...history].slice(0, 4).reverse();
    const recentTrend = chronologicalHistory.map((l, index) => `Sesi ${index+1}: ${l.weight}kg (${l.sets}x${l.reps})`).join(' ➔ ');
    
    const prompt = `Ini adalah histori latihan saya (diurutkan kronologis dari sesi terlama ➔ sesi paling baru) untuk gerakan ${exercise.name}:
    [ ${recentTrend} ]
    
    Tugas Anda: Evaluasi akurat tren beban tersebut. 
    Jika di sesi terbaru beban saya turun dibanding sebelumnya, katakan beban saya turun dan beri semangat. 
    Jika beban saya naik, katakan naik. 
    Lalu berikan saran beban (dalam kg) atau repetisi spesifik untuk sesi berikutnya berdasarkan prinsip progressive overload.`;

    const response = await callGeminiAPI(prompt);
    setAiProgress(response);
    setIsAiProgressLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || !sets || !reps) return;
    onLog({
      exerciseId: exercise.id,
      weight: parseFloat(weight),
      sets: parseInt(sets),
      reps: parseInt(reps),
    });
    setWeight('');
    setSets('');
    setReps('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const startEdit = (log) => {
    setEditingId(log.id);
    setEditForm({ weight: log.weight.toString(), sets: log.sets.toString(), reps: log.reps.toString() });
  };

  const saveEdit = (id) => {
    if (!editForm.weight || !editForm.sets || !editForm.reps) return;
    onEditLog(id, {
      weight: parseFloat(editForm.weight), sets: parseInt(editForm.sets), reps: parseInt(editForm.reps),
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-5 transition-all hover:shadow-md">
      {/* Header Card */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">{exercise.name}</h3>
          <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {exercise.muscle}
          </span>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleGetAlternative} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
            {isAiAltLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button onClick={handleGetTip} className="p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm">
            {isAiTipLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
          </button>
        </div>
      </div>

      {/* AI Modals */}
      {aiTip && (
        <div className="mb-5 text-[13px] bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl text-indigo-900 dark:text-indigo-100 border border-indigo-100/50 dark:border-indigo-800/30 animate-in fade-in flex items-start leading-relaxed">
          <Sparkles size={16} className="shrink-0 mr-2.5 mt-0.5 text-indigo-500" />
          <span className="font-medium">{aiTip}</span>
        </div>
      )}
      {aiAlt && (
        <div className="mb-5 text-[13px] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 animate-in fade-in flex items-start leading-relaxed">
          <RefreshCw size={16} className="shrink-0 mr-2.5 mt-0.5 text-slate-500" />
          <span className="font-medium">{aiAlt}</span>
        </div>
      )}
      {aiProgress && (
        <div className="mb-5 text-[13px] bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl text-emerald-900 dark:text-emerald-100 border border-emerald-100/50 dark:border-emerald-800/30 font-medium animate-in fade-in flex items-start leading-relaxed">
          <TrendingUp size={16} className="shrink-0 mr-2.5 mt-0.5 text-emerald-500" />
          <span>{aiProgress}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-3 mb-5">
        <div className="col-span-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KG</span>
          <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" placeholder="0.0" />
        </div>
        <div className="col-span-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">SET</span>
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" placeholder="0" />
        </div>
        <div className="col-span-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">REP</span>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" placeholder="0" />
        </div>
        
        <button type="submit" disabled={!weight || !sets || !reps} className={`col-span-12 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm flex justify-center items-center ${showSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-900'}`}>
          {showSuccess ? <><CheckCircle size={16} className="mr-2" /> DISIMPAN</> : 'CATAT LATIHAN'}
        </button>
      </form>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-[11px] uppercase tracking-wider font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              <History size={14} className="mr-1.5" /> Catatan Terdahulu <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{history.length}</span>
              {showHistory ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
            </button>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors px-2.5 py-1.5 rounded-lg flex items-center">
              {isAiProgressLoading ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <TrendingUp size={12} className="mr-1.5" />} 
              Cek Tren AI
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-200">
              {history.map((log) => (
                <div key={log.id}>
                  {editingId === log.id ? (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-3 gap-2">
                         <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium dark:text-white" />
                         <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium dark:text-white" />
                         <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium dark:text-white" />
                      </div>
                      <div className="flex justify-end mt-2 space-x-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">Batal</button>
                        <button onClick={() => saveEdit(log.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900">Simpan</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 p-3 rounded-xl transition-all group">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px]">{log.weight} kg <span className="text-slate-400 font-normal mx-0.5">×</span> {log.sets} sets <span className="text-slate-400 font-normal mx-0.5">×</span> {log.reps} reps</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{log.date} • {log.time}</span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(log)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => onDeleteLog(log.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
  
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('gym_logs_v4');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [exerciseData, setExerciseData] = useState(() => {
    const saved = localStorage.getItem('gym_exercises_v4');
    return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('gym_dark_v4');
    return saved === 'true';
  });

  useEffect(() => { localStorage.setItem('gym_logs_v4', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_v4', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => { localStorage.setItem('gym_dark_v4', isDarkMode); }, [isDarkMode]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '' });

  const [aiSummary, setAiSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [aiNutrition, setAiNutrition] = useState(null);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);

  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${exerciseData[activeTab]?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const response = await callGeminiAPI(`Saya baru latihan: ${workoutData}. Berikan pujian dan evaluasi singkat ala pelatih profesional.`);
    setAiSummary(response);
    setIsSummaryLoading(false);
  };

  const handleGenerateNutrition = async () => {
    setIsNutritionLoading(true);
    const response = await callGeminiAPI(`Saya baru saja menyelesaikan latihan beban untuk ${activeTab} day. Berikan 1 rekomendasi menu makanan post-workout lokal Indonesia yang tinggi protein. Sebutkan estimasi kalorinya. Format ringkas.`);
    setAiNutrition(response);
    setIsNutritionLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = exerciseData[activeTab].map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`Saya akan melakukan latihan ${activeTab} day yang berfokus pada otot: ${muscles}. Berikan 3 gerakan pemanasan dinamis spesifik untuk otot tersebut. Format ringkas.`);
    setAiWarmup(response);
    setIsWarmupLoading(false);
  };

  const handleAddLog = (log) => {
    const newLog = { 
      ...log, 
      id: Date.now().toString(), 
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
    };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => {
    if(window.confirm("Hapus catatan latihan ini permanen?")) {
      setLogs(logs.filter(l => l.id !== id));
    }
  };

  const handleEditLog = (id, updatedData) => {
    setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log));
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Umum' };
    setExerciseData({ ...exerciseData, [activeTab]: [...exerciseData[activeTab], item] });
    setIsAddingExercise(false);
    setNewExercise({ name: '', muscle: '' });
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors duration-300">
        
        {/* Modern App Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-5 pt-6 pb-4 transition-colors">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center rounded-xl shadow-sm">
                <Dumbbell size={20} className="transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">GymTracker</h1>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mt-0.5">{getHariIndonesia()} • Jadwal {todaySplit}</p>
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Navigation Pills */}
          <div className="max-w-xl mx-auto flex space-x-2 mt-6 overflow-x-auto no-scrollbar pb-1">
            {['Push', 'Pull', 'Legs'].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${activeTab === t ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-100' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transform scale-95'}`}
              >
                {t} DAY
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-xl mx-auto px-5 pt-6 space-y-6">
          
          {/* AI Feature Suite */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800/30 text-orange-700 dark:text-orange-300 rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center group shadow-sm">
              {isWarmupLoading ? <Loader2 size={24} className="animate-spin mb-2" /> : <Flame size={24} className="mb-2 group-hover:scale-110 transition-transform" />}
              <span className="text-[11px] font-bold uppercase tracking-wider">Pemanasan ✨</span>
            </button>
            
            <button onClick={handleGenerateNutrition} disabled={isNutritionLoading} className="bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-300 rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center group shadow-sm">
              {isNutritionLoading ? <Loader2 size={24} className="animate-spin mb-2" /> : <Utensils size={24} className="mb-2 group-hover:scale-110 transition-transform" />}
              <span className="text-[11px] font-bold uppercase tracking-wider">Nutrisi ✨</span>
            </button>
          </div>

          {aiWarmup && (
            <div className="bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 p-4 rounded-xl text-[13px] text-orange-900 dark:text-orange-100 font-medium animate-in fade-in relative shadow-sm">
              <button onClick={() => setAiWarmup(null)} className="absolute top-3 right-3 text-orange-400 hover:text-orange-600"><X size={16} /></button>
              <span className="font-bold block mb-2 flex items-center text-orange-700 dark:text-orange-400"><Flame size={16} className="mr-1.5"/> Rekomendasi Pemanasan:</span>
              <div className="leading-relaxed whitespace-pre-wrap">{aiWarmup}</div>
            </div>
          )}

          {aiNutrition && (
            <div className="bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 p-4 rounded-xl text-[13px] text-rose-900 dark:text-rose-100 font-medium animate-in fade-in relative shadow-sm">
              <button onClick={() => setAiNutrition(null)} className="absolute top-3 right-3 text-rose-400 hover:text-rose-600"><X size={16} /></button>
              <span className="font-bold block mb-2 flex items-center text-rose-700 dark:text-rose-400"><Utensils size={16} className="mr-1.5"/> Saran Nutrisi Post-Workout:</span>
              <div className="leading-relaxed whitespace-pre-wrap">{aiNutrition}</div>
            </div>
          )}

          {/* AI Summary Banner */}
          {logs.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-black rounded-2xl p-5 text-white shadow-xl shadow-indigo-900/10 border border-indigo-800/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-sm tracking-wide flex items-center text-indigo-100"><Sparkles size={16} className="mr-2 text-indigo-400" /> PELATIH AI</h3>
                  <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors flex items-center backdrop-blur-sm">
                    {isSummaryLoading ? <Loader2 size={12} className="animate-spin" /> : 'Evaluasi Sesi'}
                  </button>
                </div>
                {aiSummary ? (
                  <p className="text-[13px] leading-relaxed text-indigo-50 font-medium animate-in fade-in bg-white/5 p-4 rounded-xl border border-white/10">{aiSummary}</p>
                ) : (
                  <p className="text-xs text-indigo-300 font-medium max-w-[80%]">Tanya AI untuk menganalisis performa latihan Anda hari ini.</p>
                )}
              </div>
            </div>
          )}

          {/* Exercise List */}
          <div className="space-y-0">
            {exerciseData[activeTab].map(ex => (
              <ExerciseCard 
                key={ex.id} 
                exercise={ex} 
                onLog={handleAddLog} 
                onDeleteLog={onDeleteLog}
                onEditLog={handleEditLog}
                history={logs.filter(l => l.exerciseId === ex.id)} 
              />
            ))}
          </div>

          {/* Add Manual Exercise */}
          {isAddingExercise ? (
            <form onSubmit={handleSaveCustom} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-slate-900 dark:text-white">Tambah Latihan Custom</h3>
              <div className="space-y-3">
                <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Nama Latihan (cth: Bicep Curl)" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" autoFocus/>
                <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Otot Target (opsional)" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex space-x-3 pt-3">
                  <button type="submit" disabled={!newExercise.name} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold py-3 rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity">Simpan Gerakan</button>
                  <button type="button" onClick={() => setIsAddingExercise(false)} className="px-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                </div>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingExercise(true)} 
              className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-[13px] tracking-wide"
            >
              <PlusCircle size={18} className="mr-2" /> TAMBAH GERAKAN MANUAL
            </button>
          )}
        </main>
      </div>
    </div>
  );
}