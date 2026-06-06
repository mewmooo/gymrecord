import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Plus, ChevronRight, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, Moon, Sun, Flame, Clock, Heart, Zap,
  BarChart2, Calendar, Settings, Home, Trophy, Play, Pause, Target,
  Wind, MoonStar, BookOpen, Save, Check, PlusCircle, Navigation,
  Menu, LogOut, Layers
} from 'lucide-react';

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
  return 'General';
};

const INITIAL_EXERCISE_DATA = {
  Push: [
    { id: 'p1', name: 'Chest Press', muscle: 'Chest', videoId: '0GjpPFOx1uQ', targetSets: 3 },
    { id: 'p2', name: 'Chest Fly', muscle: 'Chest', videoId: 'eGjt4jcEA_E', targetSets: 3 },
    { id: 'p3', name: 'Shoulder Press', muscle: 'Shoulders', videoId: 'WvLMauqrnK8', targetSets: 3 },
    { id: 'p4', name: 'Lateral Raise', muscle: 'Shoulders', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'p5', name: 'Tricep Pushdown', muscle: 'Triceps', videoId: '2-LAMcpzODU', targetSets: 3 },
  ],
  Pull: [
    { id: 'pu1', name: 'Lat Pulldown', muscle: 'Back', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'pu2', name: 'Rowing', muscle: 'Back', videoId: 'GZbfZ033f74', targetSets: 3 },
    { id: 'pu3', name: 'Face Pull', muscle: 'Rear Delts', videoId: null, targetSets: 3 }, 
    { id: 'pu4', name: 'Bicep Curl', muscle: 'Biceps', videoId: 'in7PaeYIYfw', targetSets: 3 },
    { id: 'pu5', name: 'Hammer Curl', muscle: 'Biceps', videoId: null, targetSets: 2 },
  ],
  Legs: [
    { id: 'l1', name: 'Hack Squat', muscle: 'Legs', videoId: '0tn5K9NlCfo', targetSets: 3 },
    { id: 'l2', name: 'Leg Press', muscle: 'Legs', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'l3', name: 'Leg Extension', muscle: 'Quads', videoId: 'YyvSfVjQeL0', targetSets: 3 },
    { id: 'l4', name: 'Leg Curl', muscle: 'Hamstrings', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'l5', name: 'Calf Raise', muscle: 'Calves', videoId: '-M4-G8p8fmc', targetSets: 4 },
  ],
  Upper: [
    { id: 'u1', name: 'Chest Press', muscle: 'Chest', videoId: '0GjpPFOx1uQ', targetSets: 3 },
    { id: 'u2', name: 'Lat Pulldown', muscle: 'Back', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'u3', name: 'Shoulder Press', muscle: 'Shoulders', videoId: 'WvLMauqrnK8', targetSets: 2 },
    { id: 'u4', name: 'Lateral Raise', muscle: 'Shoulders', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'u5', name: 'Bicep Curl', muscle: 'Biceps', videoId: 'in7PaeYIYfw', targetSets: 2 },
    { id: 'u6', name: 'Tricep Pushdown', muscle: 'Triceps', videoId: '2-LAMcpzODU', targetSets: 2 },
  ],
};

const getTodaySplit = () => {
  const day = new Date().getDay(); 
  if (day === 1) return 'Push';
  if (day === 2) return 'Pull';
  if (day === 3) return 'Legs';
  if (day === 4) return 'Rest'; 
  if (day === 5) return 'Upper';
  return 'Rest'; 
};

const callGeminiAPI = async (prompt, isRaw = false) => {
  let apiKey = "";
  try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    apiKey = env.VITE_GEMINI_API_KEY || "";
  } catch (e) { apiKey = ""; }
  
  if (!apiKey) return "API Key not configured";
  
  const combinedPrompt = isRaw ? prompt : "You are a professional fitness coach. Answer in English briefly (max 3 sentences). Be supportive and analytical.\n\n" + prompt;
  
  const modelsToTry = ['gemini-3-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: combinedPrompt }] }] }) });
      if (response.ok) { const result = await response.json(); return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response"; }
    } catch (error) {}
  }
  return null; 
};

// --- HEALTH CARD COMPONENT ---
const HealthCard = ({ label, value, unit, icon: Icon, color }) => (
  <div className={`${color} bg-opacity-10 border border-opacity-20 rounded-2xl p-4 text-center`}>
    <Icon className={`${color.replace('bg-', 'text-')} w-6 h-6 mx-auto mb-2`} />
    <p className={`text-2xl font-bold ${color.replace('bg-', 'text-')}`}>{value || '--'}</p>
    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{label}</p>
    {unit && <p className="text-[10px] text-slate-500">{unit}</p>}
  </div>
);

// --- EXERCISE SELECTOR MODAL ---
const ExerciseSelectorModal = ({ isOpen, onClose, programs, onSelectProgram }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Select Program</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {programs.map(prog => (
            <button
              key={prog}
              onClick={() => { onSelectProgram(prog); onClose(); }}
              className="w-full p-4 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-between group"
            >
              <span className="font-semibold text-slate-900 dark:text-white">{prog}</span>
              <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- EXERCISE DETAIL CARD ---
const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', sets: '', reps: '' });
  const [showVideo, setShowVideo] = useState(false);

  const handleSubmit = () => {
    if (!weight || !sets || !reps) return;
    const w = parseFloat(weight);
    const r = parseInt(reps);
    const rpeVal = rpe ? parseInt(rpe) : 10;
    const new1RM = calculate1RM(w, r, rpeVal);
    
    onLog({
      exerciseId: exercise.id,
      weight: w,
      sets: parseInt(sets),
      reps: r,
      rpe: rpeVal,
      oneRepMax: parseFloat(new1RM.toFixed(1))
    });

    setWeight('');
    setSets('');
    setReps('');
    setRpe('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold dark:text-white">{exercise.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{exercise.muscle}</p>
        </div>
        <button onClick={() => onDeleteExercise(exercise.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-600 dark:text-red-400 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>

      {exercise.videoId && (
        <button 
          onClick={() => setShowVideo(!showVideo)}
          className="w-full mb-4 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
        >
          {showVideo ? 'Hide Video' : 'Show Video'}
        </button>
      )}

      {showVideo && exercise.videoId && (
        <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}`} allowFullScreen></iframe>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase">KG</label>
          <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/30 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase">SET</label>
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/30 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase">REP</label>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/30 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase">RPE</label>
          <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/30 outline-none" />
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={!weight || !sets || !reps}
        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${showSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}
      >
        {showSuccess ? '✓ Logged' : 'Log Set'}
      </button>

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Recent</p>
          <div className="space-y-1">
            {history.slice(0, 3).map(log => (
              <div key={log.id} className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-lg flex justify-between items-center">
                <span className="dark:text-white font-semibold">{log.weight}kg × {log.sets}×{log.reps}</span>
                <button onClick={() => onDeleteLog(log.id)} className="text-red-500 hover:text-red-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const todaySplit = getTodaySplit();
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeProgram, setActiveProgram] = useState(todaySplit);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);

  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_v11'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_v11'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [healthData, setHealthData] = useState(() => { const saved = localStorage.getItem('gym_health_v2'); return saved ? JSON.parse(saved) : {}; });
  const [dailyNote, setDailyNote] = useState('');
  const [healthMetrics, setHealthMetrics] = useState({ cals: '', hr: '', sleep: '', spo2: '' });

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

  const handleAddLog = (log) => {
    const newLog = { 
      ...log,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => { setLogs(logs.filter(l => l.id !== id)); };
  const handleEditLog = (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  const handleDeleteExercise = (id) => { setExerciseData(prev => ({ ...prev, [activeProgram]: (prev[activeProgram] || []).filter(ex => ex.id !== id) })); };
  const handleEditExercise = (id, newName, newMuscle) => { setExerciseData(prev => ({ ...prev, [activeProgram]: (prev[activeProgram] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle } : ex) })); };

  const handleSaveNote = (val) => {
    setDailyNote(val);
    const today = new Date().toLocaleDateString('id-ID');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    allNotes[today] = val;
    localStorage.setItem('gym_notes_v12', JSON.stringify(allNotes));
  };

  const handleSaveHealth = () => {
    const today = new Date().toLocaleDateString('id-ID');
    setHealthData({...healthData, [today]: {
       cals: parseInt(healthMetrics.cals) || 0,
       hr: parseInt(healthMetrics.hr) || 0,
       sleep: parseInt(healthMetrics.sleep) || 0,
       spo2: parseInt(healthMetrics.spo2) || 0,
    }});
    setHealthMetrics({ cals: '', hr: '', sleep: '', spo2: '' });
  };

  // Get today's health data
  const today = new Date().toLocaleDateString('id-ID');
  const todayHealth = healthData[today] || {};

  // Get stats for dashboard
  const todaysLogs = logs.filter(l => l.date === today);
  const totalSets = todaysLogs.reduce((sum, l) => sum + l.sets, 0);

  // HOME PAGE
  if (currentPage === 'home') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto px-4 py-4 sm:px-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold dark:text-white">GymTracker</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
          
          {/* Today's Program */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl p-6 shadow-lg">
            <p className="text-sm font-semibold opacity-90 mb-2">TODAY'S PROGRAM</p>
            <h2 className="text-3xl font-bold mb-4">{activeProgram}</h2>
            {todaySplit === 'Rest' ? (
              <p className="text-blue-100 text-sm font-medium mb-4">Rest day - Focus on recovery</p>
            ) : (
              <>
                <p className="text-blue-100 text-sm font-medium mb-4">
                  {todaysLogs.length > 0 ? `${totalSets} sets completed today` : 'No workouts logged yet'}
                </p>
                {!showWorkout && (
                  <button 
                    onClick={() => setShowWorkout(true)}
                    className="w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Start Workout
                  </button>
                )}
              </>
            )}
          </div>

          {/* Workout Section (if active) */}
          {showWorkout && todaySplit !== 'Rest' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white">Log Exercises</h3>
                <button onClick={() => setShowWorkout(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {(exerciseData[activeProgram] || []).map(ex => (
                  <ExerciseCard 
                    key={ex.id}
                    exercise={ex}
                    onLog={handleAddLog}
                    onDeleteLog={onDeleteLog}
                    onEditLog={handleEditLog}
                    onDeleteExercise={() => handleDeleteExercise(ex.id)}
                    onEditExercise={handleEditExercise}
                    history={logs.filter(l => l.exerciseId === ex.id).slice(0, 3)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Health & Recovery Cards */}
          <div>
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">Health Metrics</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <HealthCard label="Calories" value={todayHealth.cals} unit="kcal" icon={Flame} color="bg-orange-500" />
              <HealthCard label="Heart Rate" value={todayHealth.hr} unit="bpm" icon={Heart} color="bg-red-500" />
              <HealthCard label="Sleep" value={todayHealth.sleep ? `${Math.floor(todayHealth.sleep/60)}h` : '--'} icon={MoonStar} color="bg-purple-500" />
              <HealthCard label="SpO2" value={todayHealth.spo2} unit="%" icon={Wind} color="bg-blue-500" />
            </div>

            {/* Quick Input */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-3">Log Health Data</p>
              <div className="space-y-2">
                <input type="number" value={healthMetrics.cals} onChange={(e) => setHealthMetrics({...healthMetrics, cals: e.target.value})} placeholder="Calories" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                <input type="number" value={healthMetrics.hr} onChange={(e) => setHealthMetrics({...healthMetrics, hr: e.target.value})} placeholder="Heart Rate" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                <input type="number" value={healthMetrics.sleep} onChange={(e) => setHealthMetrics({...healthMetrics, sleep: e.target.value})} placeholder="Sleep (minutes)" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                <input type="number" value={healthMetrics.spo2} onChange={(e) => setHealthMetrics({...healthMetrics, spo2: e.target.value})} placeholder="SpO2 %" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
                <button onClick={handleSaveHealth} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Save</button>
              </div>
            </div>
          </div>

          {/* Session Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-2">Session Notes</label>
            <textarea 
              value={dailyNote}
              onChange={(e) => handleSaveNote(e.target.value)}
              placeholder="How did today's workout go?"
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm resize-none min-h-24 focus:ring-2 focus:ring-blue-500/30 outline-none"
            />
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-pb">
          <div className="max-w-md mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600 dark:text-blue-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('programs')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Layers size={24} />
              <span className="text-[10px] font-semibold">Programs</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <BarChart2 size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Settings size={24} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // PROGRAMS PAGE
  if (currentPage === 'programs') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <button onClick={() => setCurrentPage('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronUp size={20} />
            </button>
            <h1 className="text-xl font-bold dark:text-white">Programs</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 pb-28 space-y-3">
          {Object.keys(exerciseData).map(prog => (
            <button
              key={prog}
              onClick={() => { setActiveProgram(prog); setCurrentPage('home'); setShowWorkout(true); }}
              className="w-full p-4 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors flex justify-between items-center group"
            >
              <div>
                <p className="font-bold dark:text-white">{prog}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{exerciseData[prog]?.length || 0} exercises</p>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </button>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('programs')} className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600 dark:text-blue-400">
              <Layers size={24} />
              <span className="text-[10px] font-semibold">Programs</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <BarChart2 size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Settings size={24} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PROGRESS PAGE
  if (currentPage === 'progress') {
    const todaysLogs = logs.filter(l => l.date === today);
    const thisWeekLogs = logs.filter(l => {
      const logDate = new Date(l.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });

    const muscleVolume = {};
    thisWeekLogs.forEach(l => {
      const muscle = getMuscleById(l.exerciseId, exerciseData);
      muscleVolume[muscle] = (muscleVolume[muscle] || 0) + l.sets;
    });

    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <button onClick={() => setCurrentPage('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronUp size={20} />
            </button>
            <h1 className="text-xl font-bold dark:text-white">Progress</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-bold dark:text-white">{todaysLogs.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Exercises Today</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-bold dark:text-white">{todaysLogs.reduce((sum, l) => sum + l.sets, 0)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Sets This Week</p>
            </div>
          </div>

          {/* Muscle Volume */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-bold dark:text-white mb-4">Muscle Volume (7d)</h3>
            <div className="space-y-3">
              {Object.entries(muscleVolume).sort((a, b) => b[1] - a[1]).map(([muscle, sets]) => (
                <div key={muscle}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium dark:text-white">{muscle}</span>
                    <span className="text-slate-600 dark:text-slate-400">{sets} sets</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (sets / 20) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-bold dark:text-white mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {logs.slice(0, 8).map(log => (
                <div key={log.id} className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="dark:text-white font-medium">
                    {exerciseData[Object.keys(exerciseData)[0]]?.find(e => e.id === log.exerciseId)?.name || 'Exercise'}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{log.weight}kg × {log.sets}×{log.reps}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('programs')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Layers size={24} />
              <span className="text-[10px] font-semibold">Programs</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600 dark:text-blue-400">
              <BarChart2 size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Settings size={24} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SETTINGS PAGE
  if (currentPage === 'settings') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <button onClick={() => setCurrentPage('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronUp size={20} />
            </button>
            <h1 className="text-xl font-bold dark:text-white">Settings</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 py-6 pb-28 space-y-4">
          
          {/* Theme */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold dark:text-white">Dark Mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Toggle theme</p>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                {isDarkMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Clear Data */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</p>
            <button onClick={() => { if (confirm('Clear all data?')) { setLogs([]); setHealthData({}); } }} className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              Clear All Data
            </button>
          </div>

          <div className="text-center text-xs text-slate-600 dark:text-slate-400 pt-4">
            <p>GymTracker v1.0</p>
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('programs')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <Layers size={24} />
              <span className="text-[10px] font-semibold">Programs</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-600 dark:text-slate-400">
              <BarChart2 size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600 dark:text-blue-400">
              <Settings size={24} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}