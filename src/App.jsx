import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Info, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, Utensils, TrendingUp, PlusCircle, Moon, Sun
} from 'lucide-react';

// Data Master Awal (Fallback jika storage kosong)
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
  // MENGAMBIL API KEY DARI ENVIRONMENT VARIABLE (VITE_GEMINI_API_KEY)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
  
  if (!apiKey) {
    console.error("API Key tidak ditemukan di environment variables!");
    return "Maaf, konfigurasi AI belum lengkap (API Key hilang).";
  }
  
  const combinedPrompt = "Anda adalah pelatih gym dan ahli biomekanik yang suportif. Jawab dengan bahasa Indonesia yang jelas, asik, memotivasi, dan logis. Berikan instruksi spesifik (angka beban jika memungkinkan). Maksimal 3 kalimat.\n\nBerikut pesannya:\n" + prompt;

  const payload = {
    contents: [{ parts: [{ text: combinedPrompt }] }]
  };

  // Daftar model publik yang stabil untuk menghindari Error 404
  const modelsToTry = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro'
  ];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI.";
      }
      console.warn(`Model ${modelName} gagal: ${response.status}`);
    } catch (error) {
      console.error(`Error koneksi pada ${modelName}:`, error);
    }
  }
  return "Maaf, AI Coach gagal merespons. Pastikan API Key valid atau coba lagi nanti.";
};

const ExerciseCard = ({ exercise, onLog, history, onEditLog, onDeleteLog }) => {
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
    setAiAlt(null); setAiProgress(null);
    setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Berikan satu tips form atau koneksi otot-pikiran untuk gerakan ${exercise.name}. Maksimal 2 kalimat.`);
    setAiTip(response);
    setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setAiTip(null); setAiProgress(null);
    setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Berikan 1 opsi alternatif pengganti untuk ${exercise.name} menggunakan Dumbbell/Mesin. Maksimal 2 kalimat.`);
    setAiAlt(response);
    setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setAiTip(null); setAiAlt(null);
    setIsAiProgressLoading(true);
    const recentLogs = history.slice(0, 3).map(l => `${l.weight}kg x ${l.sets}x${l.reps}`).join(' -> ');
    const response = await callGeminiAPI(`Saya baru saja melakukan ${exercise.name} dengan histori: ${recentLogs}. Target saya 2x8. Evaluasi penyesuaian beban berikutnya. Maksimal 3 kalimat.`);
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
    setSets('');
    setReps('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{exercise.name}</h3>
          <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
            {exercise.muscle}
          </span>
        </div>
        <div className="flex space-x-1.5">
          <button onClick={handleGetAlternative} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-colors">
            {isAiAltLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button onClick={handleGetTip} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 transition-colors">
            {isAiTipLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
          </button>
        </div>
      </div>

      {aiTip && <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl text-sm text-indigo-800 dark:text-indigo-200 flex animate-in fade-in"><Bot className="mr-2 mt-0.5 shrink-0" size={16} /><p>{aiTip}</p></div>}
      {aiAlt && <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl text-sm text-emerald-800 dark:text-emerald-200 flex animate-in fade-in"><RefreshCw className="mr-2 mt-0.5 shrink-0" size={16} /><p>{aiAlt}</p></div>}
      {aiProgress && <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl text-sm text-amber-900 dark:text-amber-200 flex animate-in fade-in shadow-sm"><TrendingUp className="mr-2 mt-0.5 shrink-0" size={18} /><p>{aiProgress}</p></div>}

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[80px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1 dark:text-slate-400">Beban (Kg)</label>
          <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
        </div>
        <div className="w-16">
          <label className="block text-xs font-semibold text-slate-500 mb-1 dark:text-slate-400">Set</label>
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2" />
        </div>
        <div className="w-16">
          <label className="block text-xs font-semibold text-slate-500 mb-1 dark:text-slate-400">Reps</label>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="8" />
        </div>
        <div className="w-full mt-2">
          <button type="submit" disabled={!weight || !sets || !reps} className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${showSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50'}`}>
            {showSuccess ? <div className="flex items-center justify-center"><CheckCircle size={18} className="mr-2" />Tersimpan!</div> : <div className="flex items-center justify-center"><Plus size={18} className="mr-2" />Catat Progres</div>}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
              <History size={16} className="mr-2" /> Histori ({history.length})
              {showHistory ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1"/>}
            </button>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1.5 rounded-md border border-amber-200 dark:border-amber-800/60 flex items-center transition-colors">
              {isAiProgressLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />} Evaluasi Progres AI
            </button>
          </div>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map((log) => (
                <div key={log.id}>
                  {editingId === log.id ? (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                      <div className="flex space-x-2">
                        <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm dark:text-white" />
                        <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm dark:text-white" />
                        <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm dark:text-white" />
                        <button onClick={() => saveEdit(log.id)} className="p-1.5 text-white bg-blue-600 rounded"><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-500 rounded hover:bg-slate-200"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-lg text-sm group transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs block">{log.time}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{log.weight} kg <span className="text-slate-400">×</span> {log.sets} sets <span className="text-slate-400">×</span> {log.reps} reps</span>
                      </div>
                      <div className="flex space-x-1 opacity-80">
                        <button onClick={() => startEdit(log)} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteLog(log.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
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
  
  // Persistensi Data melalui LocalStorage
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('gym_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [exerciseData, setExerciseData] = useState(() => {
    const saved = localStorage.getItem('gym_exercises');
    return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('gym_dark_mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('gym_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('gym_exercises', JSON.stringify(exerciseData));
  }, [exerciseData]);

  useEffect(() => {
    localStorage.setItem('gym_dark_mode', isDarkMode);
  }, [isDarkMode]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');

  const [aiSummary, setAiSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [aiNutrition, setAiNutrition] = useState(null);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const workoutData = logs.map(l => `${exerciseData[activeTab]?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg, ${l.sets}x${l.reps})`).join(', ');
    const response = await callGeminiAPI(`Saya baru latihan: ${workoutData}. Berikan evaluasi singkat.`);
    setAiSummary(response);
    setIsSummaryLoading(false);
  };

  const handleGenerateNutrition = async () => {
    setIsNutritionLoading(true);
    const muscles = exerciseData[activeTab].map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`Latihan ${activeTab} otot: ${muscles}. Rekomendasikan 1 makanan Indonesia tinggi protein. Singkat.`);
    setAiNutrition(response);
    setIsNutritionLoading(false);
  };

  const handleAddLog = (logData) => {
    const newLog = { ...logData, id: Date.now().toString(), date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
    setLogs([newLog, ...logs]);
  };

  const handleEditLog = (id, updatedData) => setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log));
  const handleDeleteLog = (id) => { if(window.confirm("Hapus catatan ini?")) setLogs(logs.filter(log => log.id !== id)); };

  const handleSaveCustomExercise = (e) => {
    e.preventDefault();
    if (!newExerciseName) return;
    const newExercise = { id: `custom-${Date.now()}`, name: newExerciseName, muscle: newExerciseMuscle || 'Umum' };
    setExerciseData({ ...exerciseData, [activeTab]: [...exerciseData[activeTab], newExercise] });
    setIsAddingExercise(false);
    setNewExerciseName('');
    setNewExerciseMuscle('');
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors">
          <div className="max-w-2xl mx-auto px-4 py-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center text-slate-800 dark:text-white">
                <Activity className="mr-2 text-blue-600 dark:text-blue-400" size={28} /> GymLogs
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center font-medium">
                <Calendar size={14} className="mr-1.5" /> {getHariIndonesia()} • Jadwal: <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">{todaySplit}</span>
              </p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
              title="Ganti Tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <div className="max-w-2xl mx-auto px-4 flex space-x-2 pb-4 overflow-x-auto no-scrollbar">
            {['Push', 'Pull', 'Legs'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === tab ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
              >
                Hari {tab}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Latihan {activeTab}</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">{exerciseData[activeTab].length} Gerakan</span>
          </div>

          {logs.length > 0 && (
            <div className="mb-8 space-y-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold flex items-center text-sm"><Sparkles size={16} className="mr-2 text-yellow-300" /> Analisis Sesi AI</h3>
                  <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors">{isSummaryLoading ? <Loader2 size={12} className="animate-spin" /> : 'Nilai Sesi'}</button>
                </div>
                {aiSummary && <p className="text-sm text-indigo-50 mt-2 bg-black/10 p-3 rounded-lg border border-white/10 animate-in fade-in duration-300">{aiSummary}</p>}
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold flex items-center text-sm"><Utensils size={16} className="mr-2 text-yellow-200" /> Saran Pemulihan</h3>
                  <button onClick={handleGenerateNutrition} disabled={isNutritionLoading} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors">{isNutritionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Menu Protein'}</button>
                </div>
                {aiNutrition && <p className="text-sm text-orange-50 mt-2 bg-black/10 p-3 rounded-lg border border-white/10 animate-in fade-in duration-300">{aiNutrition}</p>}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {exerciseData[activeTab].map((exercise) => (
              <ExerciseCard 
                key={exercise.id} 
                exercise={exercise} 
                onLog={handleAddLog} 
                onEditLog={handleEditLog} 
                onDeleteLog={handleDeleteLog} 
                history={logs.filter(l => l.exerciseId === exercise.id)} 
              />
            ))}

            {isAddingExercise ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 animate-in fade-in shadow-sm">
                <div className="flex justify-between mb-4"><h3 className="font-bold text-slate-800 dark:text-slate-100">Tambah Latihan Manual</h3><button onClick={() => setIsAddingExercise(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
                <form onSubmit={handleSaveCustomExercise} className="space-y-3">
                  <input type="text" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} placeholder="Nama Latihan (misal: Dumbbell Press)" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={newExerciseMuscle} onChange={(e) => setNewExerciseMuscle(e.target.value)} placeholder="Otot Target (misal: Dada Atas)" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" disabled={!newExerciseName} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50">Simpan Ke Jadwal</button>
                </form>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingExercise(true)} 
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 transition-all"
              >
                <PlusCircle size={20} /> Tambah Latihan Manual
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}