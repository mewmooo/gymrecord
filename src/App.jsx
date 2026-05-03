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
  let apiKey = "";
  try {
    // Memeriksa environment variable dengan cara yang aman untuk berbagai target build
    const env = (typeof process !== 'undefined' && process.env) || 
                (typeof import.meta !== 'undefined' && import.meta.env) || {};
    apiKey = env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    apiKey = "";
  }
  
  if (!apiKey) {
    console.error("API Key tidak ditemukan!");
    return "Maaf, konfigurasi API Key belum tersedia. Mohon atur VITE_GEMINI_API_KEY di environment variables.";
  }
  
  const combinedPrompt = "Anda adalah pelatih gym suportif. Jawab dalam Bahasa Indonesia, santai, memotivasi, maksimal 3 kalimat.\n\n" + prompt;

  const modelsToTry = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-1.5-pro-latest',
    'gemini-flash-latest',
    
   
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
  return "Maaf, AI gagal merespons. Pastikan API Key valid.";
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
    setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Berikan satu tips singkat mind-muscle connection untuk ${exercise.name}.`);
    setAiTip(response);
    setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Apa alternatif latihan untuk ${exercise.name}?`);
    setAiAlt(response);
    setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setIsAiProgressLoading(true);
    const recent = history.slice(0, 3).map(l => `${l.weight}kg`).join(' -> ');
    const response = await callGeminiAPI(`Histori beban saya: ${recent} untuk ${exercise.name}. Harus naik beban berapa?`);
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{exercise.name}</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
            {exercise.muscle}
          </span>
        </div>
        <div className="flex space-x-1.5">
          <button onClick={handleGetAlternative} className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            {isAiAltLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button onClick={handleGetTip} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            {isAiTipLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
          </button>
        </div>
      </div>

      {aiTip && <div className="mb-4 text-xs bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl dark:text-indigo-200">{aiTip}</div>}
      {aiAlt && <div className="mb-4 text-xs bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl dark:text-emerald-200">{aiAlt}</div>}
      {aiProgress && <div className="mb-4 text-xs bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl dark:text-amber-200 font-medium">{aiProgress}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-2 mb-4">
        <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white" placeholder="Kg" />
        <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white" placeholder="Set" />
        <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white" placeholder="Rep" />
        <button type="submit" disabled={!weight || !sets || !reps} className={`col-span-3 py-2.5 rounded-lg text-sm font-bold text-white transition-all ${showSuccess ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}>
          {showSuccess ? 'Berhasil Dicatat!' : 'Catat Latihan'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400">
              <History size={14} className="mr-1" /> Histori ({history.length})
            </button>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
              {isAiProgressLoading ? 'Menganalisis...' : 'Analisis Beban'}
            </button>
          </div>
          {showHistory && (
            <div className="mt-3 space-y-1.5">
              {history.map((log) => (
                <div key={log.id} className="flex justify-between text-xs bg-slate-50 dark:bg-slate-700/40 p-2 rounded-lg">
                  <span className="font-medium dark:text-slate-200">{log.weight}kg x {log.sets}x{log.reps}</span>
                  <span className="text-slate-400">{log.time}</span>
                  <button onClick={() => onDeleteLog(log.id)} className="text-red-400"><Trash2 size={12} /></button>
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
    const saved = localStorage.getItem('gym_logs_v1');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [exerciseData, setExerciseData] = useState(() => {
    const saved = localStorage.getItem('gym_exercises_v1');
    return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('gym_dark_v1');
    return saved === 'true';
  });

  useEffect(() => { localStorage.setItem('gym_logs_v1', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_v1', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => { localStorage.setItem('gym_dark_v1', isDarkMode); }, [isDarkMode]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '' });

  const handleAddLog = (log) => {
    const newLog = { ...log, id: Date.now().toString(), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => setLogs(logs.filter(l => l.id !== id));

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'Lainnya' };
    setExerciseData({ ...exerciseData, [activeTab]: [...exerciseData[activeTab], item] });
    setIsAddingExercise(false);
    setNewExercise({ name: '', muscle: '' });
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors">
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors p-5">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black flex items-center"><Activity className="mr-2 text-blue-600" /> GymLogs</h1>
              <p className="text-[10px] uppercase font-bold text-slate-400">{getHariIndonesia()} • {todaySplit} Day</p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="max-w-xl mx-auto flex space-x-2 mt-4">
            {['Push', 'Pull', 'Legs'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-xl mx-auto p-5">
          <div className="space-y-4">
            {exerciseData[activeTab].map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} onLog={handleAddLog} onDeleteLog={onDeleteLog} history={logs.filter(l => l.exerciseId === ex.id)} />
            ))}

            {isAddingExercise ? (
              <form onSubmit={handleSaveCustom} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 shadow-sm animate-in fade-in">
                <h3 className="font-bold mb-3 text-sm">Latihan Manual</h3>
                <div className="space-y-2">
                  <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Nama Gerakan" className="w-full bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Otot Target" className="w-full bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex space-x-2 pt-2">
                    <button type="submit" className="flex-1 bg-blue-600 text-white text-sm font-bold py-2 rounded-lg">Simpan</button>
                    <button type="button" onClick={() => setIsAddingExercise(false)} className="px-4 bg-slate-100 dark:bg-slate-700 text-sm font-bold rounded-lg">Batal</button>
                  </div>
                </div>
              </form>
            ) : (
              <button onClick={() => setIsAddingExercise(true)} className="w-full py-4 border-2 border-dashed dark:border-slate-800 text-slate-400 font-bold rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all text-xs">
                <PlusCircle size={16} className="mr-2" /> TAMBAH LATIHAN MANUAL
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}