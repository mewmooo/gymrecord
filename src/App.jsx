import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Plus, ChevronRight, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, Moon, Sun, Flame, Clock, Heart, Zap,
  BarChart2, Calendar, Settings, Home, Trophy, Play, Pause, Target,
  Wind, MoonStar, BookOpen, Save, Check, PlusCircle, Navigation,
  Menu, LogOut, Layers, Battery, BatteryCharging, BatteryFull, Crown,
  Video, PenTool, MessageSquare, Skull, Timer, PlayCircle, Skull as SkullIcon
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
  
  const combinedPrompt = isRaw ? prompt : "You are a professional fitness coach. Answer in English briefly (max 3 sentences). Be supportive.\n\n" + prompt;
  
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

// --- MUSCLE RECOVERY COMPONENT ---
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
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Muscle Status</p>
      <div className="flex gap-2 overflow-x-auto">
        {recoveryData.map((item, idx) => {
          let bg = "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400";
          let Icon = BatteryFull;
          let label = "Ready";
          
          if (item.status === 'tired') {
             bg = "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400";
             Icon = Battery;
             label = "Tired";
          } else if (item.status === 'recovering') {
             bg = "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
             Icon = BatteryCharging;
             label = "Recovering";
          }

          return (
            <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${bg}`}>
               <Icon size={14} />
               <span>{item.muscle}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// --- EXERCISE CARD COMPONENT (FULL FEATURED) ---
const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, activeTab, onEditExercise, exerciseData }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState('Normal');
  const [tempSubSets, setTempSubSets] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState('list');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', sets: '', reps: '' });
  const [showVideo, setShowVideo] = useState(false);
  const [aiTip, setAiTip] = useState(null);
  const [isAiTipLoading, setIsAiTipLoading] = useState(false);
  const [aiAlt, setAiAlt] = useState(null);
  const [isAiAltLoading, setIsAiAltLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(null);
  const [isAiProgressLoading, setIsAiProgressLoading] = useState(false);

  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setShowVideo(false); setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Brief biomechanics tip for form on ${exercise.name}.`);
    setAiTip(response || "Failed to get tip."); setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setShowVideo(false); setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Best alternative exercise to ${exercise.name}. Brief explanation and steps.`);
    setAiAlt(response || "Failed to get alternative."); setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setShowVideo(false); setIsAiProgressLoading(true);
    const chronologicalHistory = [...history].slice(0, 4).reverse();
    const recentTrend = chronologicalHistory.map((l, idx) => `Session ${idx+1}: ${l.weight}kg (${l.sets}x${l.reps})`).join(' → ');
    const prompt = `${exercise.name} history:\n[ ${recentTrend} ]\n\nProgress advice and next load suggestion (3 sentences max).`;
    const response = await callGeminiAPI(prompt);
    setAiProgress(response || "Failed."); setIsAiProgressLoading(false);
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
      isPR = true;
    }
    logData.isPR = isPR;

    onLog(logData);
    setWeight(''); setSets(''); setReps(''); setRpe(''); setTempSubSets([]);
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000);
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (setType === 'Normal') handleSubmit();
    else if (weight && reps) handleAddSubSet();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold dark:text-white">{exercise.name}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{exercise.muscle}</p>
        </div>
        <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1 rounded">
          <Trash2 size={16} />
        </button>
      </div>

      {exercise.videoId && (
        <button 
          onClick={() => setShowVideo(!showVideo)}
          className="w-full mb-2 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-semibold hover:bg-red-600"
        >
          {showVideo ? 'Hide Video' : 'Video'}
        </button>
      )}

      {showVideo && exercise.videoId && (
        <div className="mb-2 rounded-lg overflow-hidden bg-black aspect-video">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}`} allowFullScreen></iframe>
        </div>
      )}

      {aiTip && (
        <div className="mb-2 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg text-xs text-blue-900 dark:text-blue-200">
          <p className="font-semibold mb-1">💡 Tip</p>
          {aiTip}
        </div>
      )}

      {aiAlt && (
        <div className="mb-2 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg text-xs text-amber-900 dark:text-amber-200">
          <p className="font-semibold mb-1">🔄 Alternative</p>
          {aiAlt}
        </div>
      )}

      {aiProgress && (
        <div className="mb-2 bg-green-50 dark:bg-green-500/10 p-2 rounded-lg text-xs text-green-900 dark:text-green-200">
          <p className="font-semibold mb-1">📈 Progress</p>
          {aiProgress}
        </div>
      )}

      <div className="flex gap-1.5 mb-3">
        {['Normal', 'Drop', 'Superset'].map(type => (
          <button 
            key={type} onClick={() => handleSetTypeChange(type)}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${setType === type ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {setType !== 'Normal' && tempSubSets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {tempSubSets.map((s, i) => (
            <div key={i} className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
              {s.weight}kg × {s.reps}
              <button onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))}>
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onFormSubmit} className="space-y-2 mb-3">
        <div className={`grid gap-1.5 ${setType === 'Normal' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs font-bold" placeholder="kg" />
          {setType === 'Normal' && <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs font-bold" placeholder="sets" />}
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs font-bold" placeholder="reps" />
          <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs font-bold" placeholder="rpe" />
        </div>
        
        {setType === 'Normal' ? (
          <button type="submit" disabled={!weight || !sets || !reps} className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${showSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}>
            {showSuccess ? '✓ Logged' : 'Log'}
          </button>
        ) : (
          <div className="flex gap-1.5">
             <button type="submit" disabled={!weight || !reps} className="flex-1 py-1.5 rounded text-xs font-bold bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 disabled:opacity-40">Add</button>
             <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${showSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}>
               {showSuccess ? '✓' : 'Save'}
             </button>
          </div>
        )}
      </form>

      <div className="flex gap-1.5 justify-between">
        <button onClick={handleGetTip} className="flex-1 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-semibold rounded hover:bg-blue-200 dark:hover:bg-blue-500/30" disabled={isAiTipLoading}>
          {isAiTipLoading ? '⏳' : '💡'} Tip
        </button>
        <button onClick={handleGetAlternative} className="flex-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold rounded hover:bg-amber-200 dark:hover:bg-amber-500/30" disabled={isAiAltLoading}>
          {isAiAltLoading ? '⏳' : '🔄'} Alt
        </button>
        <button onClick={handleGetProgressAdvice} className="flex-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded hover:bg-green-200 dark:hover:bg-green-500/30" disabled={isAiProgressLoading}>
          {isAiProgressLoading ? '⏳' : '📈'} Progress
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={() => setShowHistory(!showHistory)} className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
            <span>History ({history.length})</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showHistory && (
            <div className="space-y-1">
              {history.slice(0, 5).map(log => (
                <div key={log.id} className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded flex justify-between items-center">
                  <span className="dark:text-white font-semibold">{log.weight}kg × {log.sets}×{log.reps} {log.rpe && `(RPE${log.rpe})`}</span>
                  <button onClick={() => onDeleteLog(log.id)} className="text-red-500 hover:text-red-600">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- INSIGHTS MODAL ---
const InsightsModal = ({ isOpen, onClose, logs, exerciseData, healthData }) => {
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

  if (!isOpen) return null;

  const healthList = Object.values(healthData);
  const avgCals = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.cals || 0), 0) / healthList.length) : 0;
  const avgHr = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.hr || 0), 0) / healthList.length) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold dark:text-white">Progress & Insights</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Consistency (35d)</p>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                const dateStr = d.toLocaleDateString('en-US');
                const isActive = activeDates.has(d.toLocaleDateString('en-US'));
                return (
                  <div key={i} className={`aspect-square rounded text-[10px] font-bold flex items-center justify-center ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {d.getDate()}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Weekly Volume</p>
            {weeklyVolume.length === 0 ? (
              <p className="text-xs text-slate-500">No data</p>
            ) : (
              weeklyVolume.map(item => (
                <div key={item.muscle} className="mb-2">
                  <div className="flex justify-between text-xs mb-1 dark:text-white">
                    <span className="font-semibold">{item.muscle}</span>
                    <span>{item.sets}s</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (item.sets / 20) * 100)}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-lg">
              <Heart size={16} className="text-orange-600 dark:text-orange-400 mb-1" />
              <p className="text-lg font-bold dark:text-white">{avgHr}</p>
              <p className="text-xs text-orange-700 dark:text-orange-300">Avg HR</p>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">
              <Flame size={16} className="text-red-600 dark:text-red-400 mb-1" />
              <p className="text-lg font-bold dark:text-white">{avgCals}</p>
              <p className="text-xs text-red-700 dark:text-red-300">Avg Cals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const todaySplit = getTodaySplit();
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeProgram, setActiveProgram] = useState(todaySplit === 'Rest' ? 'Push' : todaySplit);

  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_v11'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_v11'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [healthData, setHealthData] = useState(() => { const saved = localStorage.getItem('gym_health_v2'); return saved ? JSON.parse(saved) : {}; });
  
  const [dailyNote, setDailyNote] = useState('');
  const [restTime, setRestTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({ cals: '', hr: '', sleep: '', spo2: '' });
  const [showWorkout, setShowWorkout] = useState(false);
  const [preWorkoutAdvice, setPreWorkoutAdvice] = useState(null);
  const [isPreWorkoutLoading, setIsPreWorkoutLoading] = useState(false);
  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);
  const [aiBannerData, setAiBannerData] = useState({ text: null, type: null });
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isRoastLoading, setIsRoastLoading] = useState(false);

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
    const today = new Date().toLocaleDateString('en-US');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    setDailyNote(allNotes[today] || '');
  }, []);

  useEffect(() => { localStorage.setItem('gym_logs_v11', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_v11', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => { localStorage.setItem('gym_health_v2', JSON.stringify(healthData)); }, [healthData]);

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
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restTime]);

  const handleAddLog = (log) => {
    const newLog = { 
      ...log,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => { setLogs(logs.filter(l => l.id !== id)); };
  const handleEditLog = (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  const handleDeleteExercise = (tab, id) => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).filter(ex => ex.id !== id) })); };
  const handleEditExercise = (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); 
  };

  const handleSaveNote = (val) => {
    setDailyNote(val);
    const today = new Date().toLocaleDateString('en-US');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    allNotes[today] = val;
    localStorage.setItem('gym_notes_v12', JSON.stringify(allNotes));
  };

  const handleSaveHealth = () => {
    const today = new Date().toLocaleDateString('en-US');
    setHealthData({...healthData, [today]: {
       cals: parseInt(healthMetrics.cals) || 0,
       hr: parseInt(healthMetrics.hr) || 0,
       sleep: parseInt(healthMetrics.sleep) || 0,
       spo2: parseInt(healthMetrics.spo2) || 0,
    }});
    setHealthMetrics({ cals: '', hr: '', sleep: '', spo2: '' });
  };

  const handleGetPreWorkoutBriefing = async () => {
    setIsPreWorkoutLoading(true);
    const response = await callGeminiAPI(`${activeProgram} day workout. Brief pre-workout strategy (2 sentences).`);
    setPreWorkoutAdvice(response || "Couldn't get briefing.");
    setIsPreWorkoutLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = (exerciseData[activeProgram] || []).map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`${activeProgram} day (muscles: ${muscles}). 3 dynamic warm-up exercises briefly.`);
    setAiWarmup(response); setIsWarmupLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    const workoutData = logs.slice(0, 5).map(l => {
      const ex = Object.values(exerciseData).flat().find(e => e.id === l.exerciseId);
      return `${ex?.name || 'Exercise'}: ${l.weight}kg`;
    }).join(', ');
    const response = await callGeminiAPI(`Workout summary: ${workoutData}. Brief praise and feedback (2 sentences).`);
    setAiBannerData({ text: response, type: 'summary' }); setIsSummaryLoading(false);
  };

  const handleGenerateRoast = async () => {
    if (logs.length === 0) return;
    setIsRoastLoading(true);
    const workoutData = logs.slice(0, 3).map(l => {
      const ex = Object.values(exerciseData).flat().find(e => e.id === l.exerciseId);
      return ex?.name || 'Exercise';
    }).join(', ');
    const response = await callGeminiAPI(`Sarcastic 2-sentence roast of this workout: ${workoutData}`, true);
    setAiBannerData({ text: response, type: 'roast' }); setIsRoastLoading(false);
  };

  const today = new Date().toLocaleDateString('en-US');
  const todayHealth = healthData[today] || {};
  const todaysLogs = logs.filter(l => l.date === today);

  // HOME PAGE
  if (currentPage === 'home') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'} pb-24`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-2xl font-bold dark:text-white">GymTracker</h1>
              <div className="flex gap-2">
                <button onClick={() => setShowInsights(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <BarChart2 size={20} />
                </button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {Object.keys(exerciseData).map(prog => (
                <button
                  key={prog}
                  onClick={() => setActiveProgram(prog)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeProgram === prog ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  {prog}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          
          {/* Program Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl p-6">
            <p className="text-sm font-semibold opacity-90 mb-1">TODAY'S PROGRAM</p>
            <h2 className="text-3xl font-bold mb-4">{activeProgram}</h2>
            <p className="text-blue-100 text-sm mb-4">{todaysLogs.length > 0 ? `${todaysLogs.length} exercises logged` : 'Ready to start?'}</p>
            {todaySplit !== 'Rest' && (
              <button 
                onClick={() => setShowWorkout(!showWorkout)}
                className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                {showWorkout ? 'Close Workout' : 'Start Workout'}
              </button>
            )}
          </div>

          {/* Muscle Recovery */}
          <MuscleRecovery logs={logs} exerciseData={exerciseData} />

          {/* Pre-workout Section */}
          {!preWorkoutAdvice && !isPreWorkoutLoading ? (
            <button onClick={handleGetPreWorkoutBriefing} className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white font-semibold flex items-center justify-between hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span>📋 Pre-Workout Briefing</span>
              <ChevronRight size={20} />
            </button>
          ) : isPreWorkoutLoading ? (
            <div className="w-full bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-center">
              <Loader2 size={20} className="animate-spin mx-auto text-blue-600" />
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-blue-900 dark:text-blue-100 text-sm font-medium">
              {preWorkoutAdvice}
              <button onClick={() => setPreWorkoutAdvice(null)} className="ml-2 text-xs text-blue-600 dark:text-blue-400">Close</button>
            </div>
          )}

          {/* Warmup */}
          <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="w-full bg-orange-100 dark:bg-orange-500/20 p-4 rounded-xl text-orange-900 dark:text-orange-200 font-semibold hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors disabled:opacity-50">
            🔥 {isWarmupLoading ? 'Loading...' : 'Warm-up Guide'}
          </button>

          {aiWarmup && (
            <div className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-xl text-orange-900 dark:text-orange-100 text-sm whitespace-pre-wrap font-medium">
              {aiWarmup}
              <button onClick={() => setAiWarmup(null)} className="ml-2 text-xs text-orange-600 dark:text-orange-400">Close</button>
            </div>
          )}

          {/* Workout Section */}
          {showWorkout && todaySplit !== 'Rest' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-lg font-bold dark:text-white mb-4">Log Exercises</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(exerciseData[activeProgram] || []).map(ex => (
                  <ExerciseCard 
                    key={ex.id}
                    exercise={ex}
                    onLog={handleAddLog}
                    onDeleteLog={onDeleteLog}
                    onEditLog={handleEditLog}
                    onDeleteExercise={handleDeleteExercise}
                    onEditExercise={handleEditExercise}
                    activeTab={activeProgram}
                    exerciseData={exerciseData}
                    history={logs.filter(l => l.exerciseId === ex.id).slice(0, 5)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Session Summary */}
          {logs.length > 0 && (
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSummaryLoading ? '⏳' : '✨'} Evaluate
                </button>
                <button onClick={handleGenerateRoast} disabled={isRoastLoading} className="flex-1 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50">
                  {isRoastLoading ? '⏳' : '🔥'} Roast
                </button>
              </div>
              {aiBannerData.text && (
                <div className={`p-3 rounded-lg text-xs text-white ${aiBannerData.type === 'roast' ? 'bg-slate-800' : 'bg-slate-800'}`}>
                  {aiBannerData.text}
                </div>
              )}
            </div>
          )}

          {/* Health Metrics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-bold dark:text-white mb-3">Health Metrics</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-lg">
                <Flame className="text-orange-600 dark:text-orange-400 mb-1" size={18} />
                <p className="text-xl font-bold dark:text-white">{todayHealth.cals || '--'}</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">Calories</p>
              </div>
              <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">
                <Heart className="text-red-600 dark:text-red-400 mb-1" size={18} />
                <p className="text-xl font-bold dark:text-white">{todayHealth.hr || '--'}</p>
                <p className="text-xs text-red-700 dark:text-red-300">HR (bpm)</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-lg">
                <MoonStar className="text-purple-600 dark:text-purple-400 mb-1" size={18} />
                <p className="text-xl font-bold dark:text-white">{todayHealth.sleep ? `${Math.floor(todayHealth.sleep/60)}h` : '--'}</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">Sleep</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg">
                <Wind className="text-blue-600 dark:text-blue-400 mb-1" size={18} />
                <p className="text-xl font-bold dark:text-white">{todayHealth.spo2 || '--'}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">SpO2 (%)</p>
              </div>
            </div>

            <div className="space-y-2">
              <input type="number" value={healthMetrics.cals} onChange={(e) => setHealthMetrics({...healthMetrics, cals: e.target.value})} placeholder="Calories" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
              <input type="number" value={healthMetrics.hr} onChange={(e) => setHealthMetrics({...healthMetrics, hr: e.target.value})} placeholder="Heart Rate" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
              <input type="number" value={healthMetrics.sleep} onChange={(e) => setHealthMetrics({...healthMetrics, sleep: e.target.value})} placeholder="Sleep (minutes)" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm" />
              <button onClick={handleSaveHealth} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Save Health Data</button>
            </div>
          </div>

          {/* Session Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-2">Session Notes</label>
            <textarea 
              value={dailyNote}
              onChange={(e) => handleSaveNote(e.target.value)}
              placeholder="How did today's workout go?"
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm resize-none min-h-20 focus:ring-2 focus:ring-blue-500/30 outline-none"
            />
          </div>

          {/* Rest Timer Widget */}
          {restTime > 0 && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl text-center">
              <p className="text-5xl font-bold font-mono mb-2">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}</p>
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-full py-2 rounded-lg font-semibold ${isTimerRunning ? 'bg-amber-500' : 'bg-blue-600'}`}>
                {isTimerRunning ? 'Pause' : 'Resume'}
              </button>
            </div>
          )}

        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-4 text-blue-600 dark:text-blue-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('timer')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Timer size={24} />
              <span className="text-[10px] font-semibold">Timer</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <TrendingUp size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Settings size={24} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        </div>

        {/* Insights Modal */}
        <InsightsModal isOpen={showInsights} onClose={() => setShowInsights(false)} logs={logs} exerciseData={exerciseData} healthData={healthData} />
      </div>
    );
  }

  // TIMER PAGE
  if (currentPage === 'timer') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'} pb-24`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold dark:text-white mb-8">Rest Timer</h1>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-6xl font-bold font-mono dark:text-white mb-8">
              {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              <button onClick={() => { setRestTime(prev => prev + 30); setIsTimerRunning(true); }} className="py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">+30s</button>
              <button onClick={() => { setRestTime(prev => prev + 60); setIsTimerRunning(true); }} className="py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">+60s</button>
              <button onClick={() => { setRestTime(prev => prev + 90); setIsTimerRunning(true); }} className="py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">+90s</button>
              <button onClick={() => { setRestTime(0); setIsTimerRunning(false); }} className="py-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-500/30">Reset</button>
            </div>

            <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={restTime === 0} className={`w-full py-4 rounded-xl font-bold text-white text-lg ${isTimerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40'}`}>
              {isTimerRunning ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('timer')} className="flex flex-col items-center gap-1 py-2 px-4 text-blue-600 dark:text-blue-400">
              <Timer size={24} />
              <span className="text-[10px] font-semibold">Timer</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <TrendingUp size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
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
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'} pb-24`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold dark:text-white mb-6">Progress</h1>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-2xl font-bold dark:text-white">{logs.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Logs</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-2xl font-bold dark:text-white">{todaysLogs.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Today</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
            <h3 className="font-bold dark:text-white mb-3">Muscle Volume (7d)</h3>
            <div className="space-y-2">
              {Object.entries(muscleVolume).sort((a, b) => b[1] - a[1]).map(([muscle, sets]) => (
                <div key={muscle}>
                  <div className="flex justify-between text-xs mb-1 dark:text-white">
                    <span className="font-semibold">{muscle}</span>
                    <span>{sets}s</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (sets / 25) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-bold dark:text-white mb-3">Recent Sessions</h3>
            <div className="space-y-1">
              {logs.slice(0, 10).map(log => (
                <div key={log.id} className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded flex justify-between dark:text-white">
                  <span className="font-semibold">
                    {Object.values(exerciseData).flat().find(e => e.id === log.exerciseId)?.name || 'Exercise'}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{log.weight}kg × {log.sets}×{log.reps}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('timer')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <Timer size={24} />
              <span className="text-[10px] font-semibold">Timer</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-4 text-blue-600 dark:text-blue-400">
              <TrendingUp size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
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
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'} pb-24`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold dark:text-white mb-6">Settings</h1>

          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Toggle theme</p>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                {isDarkMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</p>
              <button onClick={() => { if (confirm('Clear all data?')) { setLogs([]); setHealthData({}); } }} className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                Clear All Data
              </button>
            </div>

            <div className="text-center text-xs text-slate-600 dark:text-slate-400 pt-4">
              <p>GymTracker v2.0</p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto flex justify-around px-4 py-3">
            <button onClick={() => setCurrentPage('home')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <Home size={24} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button onClick={() => setCurrentPage('timer')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <Timer size={24} />
              <span className="text-[10px] font-semibold">Timer</span>
            </button>
            <button onClick={() => setCurrentPage('progress')} className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 dark:text-slate-400">
              <TrendingUp size={24} />
              <span className="text-[10px] font-semibold">Progress</span>
            </button>
            <button onClick={() => setCurrentPage('settings')} className="flex flex-col items-center gap-1 py-2 px-4 text-blue-600 dark:text-blue-400">
              <Settings size={24} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}