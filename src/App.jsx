import React, { useState } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Info, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, Utensils, TrendingUp, PlusCircle
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

// Menentukan jadwal hari ini
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
  const apiKey = "AIzaSyDD-YRJiGMiHRrvMukVzOovvOBEtnjo5p0"; // API Key di-handle oleh environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { 
      parts: [{ text: "Anda adalah pelatih gym dan ahli biomekanik yang suportif. Jawab dengan bahasa Indonesia yang jelas, asik, memotivasi, dan logis. Berikan instruksi spesifik (angka beban jika memungkinkan). Maksimal 3 kalimat." }] 
    }
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI.";
    } catch (error) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return "Maaf, AI Coach sedang menganalisis form Anda. Coba sebentar lagi!";
};

// Komponen Kartu Latihan (Exercise Card)
const ExerciseCard = ({ exercise, onLog, history, onEditLog, onDeleteLog }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // State untuk mode edit inline
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', sets: '', reps: '' });

  // AI States
  const [aiTip, setAiTip] = useState(null);
  const [isAiTipLoading, setIsAiTipLoading] = useState(false);
  
  const [aiAlt, setAiAlt] = useState(null);
  const [isAiAltLoading, setIsAiAltLoading] = useState(false);

  const [aiProgress, setAiProgress] = useState(null);
  const [isAiProgressLoading, setIsAiProgressLoading] = useState(false);

  // Fungsi toggle dan fetch AI
  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setAiAlt(null); setAiProgress(null);
    setIsAiTipLoading(true);
    const prompt = `Berikan satu tips form atau koneksi otot-pikiran (mind-muscle connection) untuk gerakan ${exercise.name}. Maksimal 2 kalimat.`;
    const response = await callGeminiAPI(prompt);
    setAiTip(response);
    setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setAiTip(null); setAiProgress(null);
    setIsAiAltLoading(true);
    const prompt = `Berikan 1 opsi alternatif latihan pengganti untuk ${exercise.name} menggunakan Dumbbell atau Mesin lain. Jelaskan cara kerjanya singkat. Maksimal 2 kalimat.`;
    const response = await callGeminiAPI(prompt);
    setAiAlt(response);
    setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setAiTip(null); setAiAlt(null);
    setIsAiProgressLoading(true);
    
    // Siapkan data histori
    const recentLogs = history.slice(0, 3).map(l => `${l.weight}kg x ${l.sets} sets x ${l.reps} reps`).join(' -> ');
    
    const prompt = `Saya baru saja melakukan ${exercise.name} dengan histori: ${recentLogs}. 
    PENTING: Target baku saya adalah selalu melakukan 2 set x 8 repetisi.
    Tolong evaluasi performa saya:
    1. Jika saya berhasil mencapai minimal 8 rep dengan stabil, rekomendasikan saya untuk NAIK BEBAN (sebutkan perkiraan naik berapa kg) untuk sesi berikutnya.
    2. Jika saya gagal mencapai 8 repetisi atau reps saya turun, sarankan saya untuk TETAP di beban yang sama atau perbaiki form, jangan sarankan untuk tambah rep/set.
    Fokuskan saran HANYA pada penyesuaian beban (progressive overload). Maksimal 3 kalimat.`;
    
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

    setSets('');
    setReps('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const startEdit = (log) => {
    setEditingId(log.id);
    setEditForm({ weight: log.weight.toString(), sets: log.sets.toString(), reps: log.reps.toString() });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ weight: '', sets: '', reps: '' });
  };

  const saveEdit = (id) => {
    if (!editForm.weight || !editForm.sets || !editForm.reps) return;
    onEditLog(id, {
      weight: parseFloat(editForm.weight), sets: parseInt(editForm.sets), reps: parseInt(editForm.reps),
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{exercise.name}</h3>
          <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {exercise.muscle}
          </span>
        </div>
        <div className="flex space-x-1.5">
          <button 
            onClick={handleGetAlternative}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-2 rounded-lg border border-emerald-100 transition-colors"
            title="Alat Penuh? Alternatif ✨"
          >
            {isAiAltLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button 
            onClick={handleGetTip}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-lg border border-indigo-100 transition-colors"
            title="Tips Form AI ✨"
          >
            {isAiTipLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
          </button>
        </div>
      </div>

      {/* AI Modals/Banners */}
      {aiTip && (
        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-800 flex items-start animate-in fade-in duration-300">
          <Bot className="shrink-0 mr-2 mt-0.5 text-indigo-500" size={16} />
          <p className="leading-relaxed"><strong>Form Tips:</strong> {aiTip}</p>
        </div>
      )}

      {aiAlt && (
        <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-800 flex items-start animate-in fade-in duration-300">
          <RefreshCw className="shrink-0 mr-2 mt-0.5 text-emerald-500" size={16} />
          <p className="leading-relaxed"><strong>Alternatif:</strong> {aiAlt}</p>
        </div>
      )}
      
      {aiProgress && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 flex items-start animate-in fade-in duration-300 shadow-sm">
          <TrendingUp className="shrink-0 mr-2 mt-0.5 text-amber-500" size={18} />
          <p className="leading-relaxed font-medium"><strong>Target Beban Berikutnya:</strong> {aiProgress}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[80px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Beban (Kg)</label>
          <input
            type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="0"
          />
        </div>
        <div className="w-16">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Set</label>
          <input
            type="number" value={sets} onChange={(e) => setSets(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="2"
          />
        </div>
        <div className="w-16">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Reps</label>
          <input
            type="number" value={reps} onChange={(e) => setReps(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="8"
          />
        </div>
        <div className="w-full mt-2">
          <button
            type="submit" disabled={!weight || !sets || !reps}
            className={`w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
              showSuccess ? 'bg-green-500 text-white' : (!weight || !sets || !reps) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {showSuccess ? <><CheckCircle size={18} className="mr-2" />Tersimpan!</> : <><Plus size={18} className="mr-2" />Catat Progres</>}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              <History size={16} className="mr-2" /> Histori ({history.length})
              {showHistory ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1"/>}
            </button>
            
            <button
              onClick={handleGetProgressAdvice}
              disabled={isAiProgressLoading}
              className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-md border border-amber-200 transition-colors"
            >
              {isAiProgressLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
              Evaluasi Target Beban
            </button>
          </div>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map((log) => (
                <div key={log.id}>
                  {editingId === log.id ? (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-200">
                      <div className="flex space-x-2 mb-2">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-blue-600">Beban</label>
                          <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="w-full bg-white border border-blue-100 rounded px-2 py-1 mt-1 text-sm outline-none" />
                        </div>
                        <div className="w-16">
                          <label className="text-[10px] uppercase font-bold text-blue-600">Set</label>
                          <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="w-full bg-white border border-blue-100 rounded px-2 py-1 mt-1 text-sm outline-none" />
                        </div>
                        <div className="w-16">
                          <label className="text-[10px] uppercase font-bold text-blue-600">Reps</label>
                          <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="w-full bg-white border border-blue-100 rounded px-2 py-1 mt-1 text-sm outline-none" />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={cancelEdit} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><X size={16} /></button>
                        <button onClick={() => saveEdit(log.id)} className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded"><Check size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg text-sm group hover:bg-slate-100 transition-colors">
                      <div>
                        <span className="text-slate-500 text-xs block mb-0.5">{log.time}</span>
                        <span className="font-semibold text-slate-700">{log.weight} kg <span className="text-slate-400 font-normal mx-1">×</span> {log.sets} sets <span className="text-slate-400 font-normal mx-1">×</span> {log.reps} reps</span>
                      </div>
                      <div className="flex space-x-1 opacity-80">
                        <button onClick={() => startEdit(log)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit2 size={16} /></button>
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
  const [logs, setLogs] = useState([]);
  
  // State untuk Data Latihan (agar bisa ditambah manual)
  const [exerciseData, setExerciseData] = useState(INITIAL_EXERCISE_DATA);

  // State untuk form Tambah Latihan Manual
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');

  // AI States (Summary & Nutrition)
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const [aiNutrition, setAiNutrition] = useState(null);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const workoutData = logs.map(l => {
      const exerciseName = exerciseData[activeTab]?.find(e => e.id === l.exerciseId)?.name || l.exerciseId;
      return `${exerciseName} (${l.weight}kg, ${l.sets}x${l.reps})`;
    }).join(', ');
    
    const prompt = `Saya baru latihan rincian: ${workoutData}. Berikan 1 kalimat evaluasi singkat.`;
    const response = await callGeminiAPI(prompt);
    setAiSummary(response);
    setIsSummaryLoading(false);
  };

  const handleGenerateNutrition = async () => {
    setIsNutritionLoading(true);
    const musclesTrained = exerciseData[activeTab].map(e => e.muscle).join(', ');
    const prompt = `Latihan ${activeTab} otot: ${musclesTrained}. Berikan 1 rekomendasi makanan lokal Indonesia tinggi protein untuk pemulihan. Sebutkan perkiraan protein. Singkat.`;
    const response = await callGeminiAPI(prompt);
    setAiNutrition(response);
    setIsNutritionLoading(false);
  };

  const handleAddLog = (logData) => {
    const newLog = {
      ...logData, id: Date.now().toString(),
      date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    setLogs([newLog, ...logs]);
  };

  const handleEditLog = (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  const handleDeleteLog = (id) => { if(window.confirm("Hapus catatan ini?")) setLogs(logs.filter(log => log.id !== id)); };

  const handleSaveCustomExercise = (e) => {
    e.preventDefault();
    if (!newExerciseName) return;

    const newExercise = {
      id: `custom-${Date.now()}`,
      name: newExerciseName,
      muscle: newExerciseMuscle || 'Umum'
    };

    setExerciseData({
      ...exerciseData,
      [activeTab]: [...exerciseData[activeTab], newExercise]
    });

    setIsAddingExercise(false);
    setNewExerciseName('');
    setNewExerciseMuscle('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
                <Activity className="mr-2 text-blue-600" size={28} /> GymLogs
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center font-medium">
                <Calendar size={14} className="mr-1.5" /> {getHariIndonesia()} • Jadwal: <span className="ml-1 text-blue-600 font-bold">{todaySplit}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="flex space-x-2 pb-4 overflow-x-auto no-scrollbar">
            {['Push', 'Pull', 'Legs'].map((tab) => (
              <button
                key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Hari {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {todaySplit === 'Rest' && activeTab === 'Push' && (
           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start">
             <Info className="text-blue-500 mt-0.5 mr-3 shrink-0" size={20} />
             <div>
               <h4 className="text-sm font-bold text-blue-900">Hari ini jadwal Rest (Istirahat)</h4>
               <p className="text-xs text-blue-700 mt-1">Otot butuh pemulihan, tapi bebas catat jika tetap ingin workout.</p>
             </div>
           </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Latihan {activeTab}</h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            {exerciseData[activeTab].length} Gerakan
          </span>
        </div>

        {logs.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold flex items-center text-sm">
                  <Sparkles size={16} className="mr-2 text-yellow-300" /> Analisis Sesi AI ✨
                </h3>
                <button 
                  onClick={handleGenerateSummary} disabled={isSummaryLoading}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSummaryLoading ? <><Loader2 size={12} className="animate-spin mr-1.5" /> Memproses...</> : 'Beri Nilai Sesi'}
                </button>
              </div>
              {aiSummary ? (
                <p className="text-sm text-indigo-50 mt-2 leading-relaxed bg-black/10 p-3 rounded-lg border border-white/10 animate-in fade-in duration-300">
                  {aiSummary}
                </p>
              ) : (
                <p className="text-xs text-indigo-100 mt-1">Cek performa dan dapatkan suntikan motivasi dari Pelatih AI Anda.</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white shadow-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold flex items-center text-sm">
                  <Utensils size={16} className="mr-2 text-yellow-200" /> Saran Pemulihan ✨
                </h3>
                <button 
                  onClick={handleGenerateNutrition} disabled={isNutritionLoading}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isNutritionLoading ? <><Loader2 size={12} className="animate-spin mr-1.5" /> Meracik Menu...</> : 'Menu Makanan'}
                </button>
              </div>
              {aiNutrition ? (
                <p className="text-sm text-orange-50 mt-2 leading-relaxed bg-black/10 p-3 rounded-lg border border-white/10 animate-in fade-in duration-300">
                  {aiNutrition}
                </p>
              ) : (
                <p className="text-xs text-orange-100 mt-1">Tanya AI menu makanan lokal tinggi protein yang cocok buat ngisi bensin!</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Mapping Data Latihan */}
          {exerciseData[activeTab].map((exercise) => {
            const exerciseLogs = logs.filter(l => l.exerciseId === exercise.id);
            return (
              <ExerciseCard 
                key={exercise.id} exercise={exercise} 
                onLog={handleAddLog} onEditLog={handleEditLog} onDeleteLog={handleDeleteLog}
                history={exerciseLogs}
              />
            );
          })}

          {/* Form Tambah Latihan Kustom */}
          {isAddingExercise ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Tambah Latihan Baru</h3>
                <button onClick={() => setIsAddingExercise(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveCustomExercise} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Gerakan/Alat</label>
                  <input 
                    type="text" 
                    value={newExerciseName} 
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    placeholder="Contoh: Dumbbell Bench Press"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Otot (Opsional)</label>
                  <input 
                    type="text" 
                    value={newExerciseMuscle} 
                    onChange={(e) => setNewExerciseMuscle(e.target.value)}
                    placeholder="Contoh: Dada Atas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!newExerciseName}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
                >
                  Simpan ke Hari {activeTab}
                </button>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingExercise(true)}
              className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-semibold rounded-2xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} /> Tambah Latihan Manual
            </button>
          )}
        </div>
      </main>
    </div>
  );
}