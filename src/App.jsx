import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight, Timer, Trophy, BarChart2, Crown, Play, Pause, Clock,
  Battery, BatteryCharging, BatteryFull, PenTool, BookOpen, MessageSquare, Heart, CheckSquare, MoonStar, Wind,
  Home, AreaChart, Target, LineChart, CalendarDays, TrendingDown, AlertCircle, HelpCircle
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
    { id: 'p3', name: 'Shoulder Press', muscle: 'Front Shoulders', videoId: 'WvLMauqrnK8', targetSets: 3 },
    { id: 'p4', name: 'Lateral Raise', muscle: 'Side Shoulders', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'p5', name: 'Tricep Pushdown', muscle: 'Triceps', videoId: '2-LAMcpzODU', targetSets: 3 },
  ],
  Pull: [
    { id: 'pu1', name: 'Lat Pulldown', muscle: 'Back Lats', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'pu2', name: 'Rowing', muscle: 'Mid Back', videoId: 'GZbfZ033f74', targetSets: 3 },
    { id: 'pu3', name: 'Face Pull', muscle: 'Rear Shoulders', videoId: null, targetSets: 3 }, 
    { id: 'pu4', name: 'Bicep Curl', muscle: 'Biceps', videoId: 'in7PaeYIYfw', targetSets: 3 },
    { id: 'pu5', name: 'Hammer Curl', muscle: 'Bicep Brachialis', videoId: null, targetSets: 2 },
  ],
  Legs: [
    { id: 'l1', name: 'Hack Squat', muscle: 'Quads & Glutes', videoId: '0tn5K9NlCfo', targetSets: 3 },
    { id: 'l2', name: 'Leg Press', muscle: 'Quads', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'l3', name: 'Leg Extension', muscle: 'Quad Isolation', videoId: 'YyvSfVjQeL0', targetSets: 3 },
    { id: 'l4', name: 'Leg Curl', muscle: 'Hamstrings', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'l5', name: 'Calf Raise', muscle: 'Calves', videoId: '-M4-G8p8fmc', targetSets: 4 },
  ],
  Upper: [
    { id: 'u1', name: 'Chest Press', muscle: 'Chest', videoId: '0GjpPFOx1uQ', targetSets: 3 },
    { id: 'u2', name: 'Lat Pulldown', muscle: 'Back Lats', videoId: 'CAwf7n6Luuc', targetSets: 3 },
    { id: 'u3', name: 'Shoulder Press', muscle: 'Front Shoulders', videoId: 'WvLMauqrnK8', targetSets: 2 },
    { id: 'u4', name: 'Lateral Raise', muscle: 'Side Shoulders', videoId: 'WJm9OqN_gjc', targetSets: 3 },
    { id: 'u5', name: 'Bicep Curl', muscle: 'Biceps', videoId: 'in7PaeYIYfw', targetSets: 2 },
    { id: 'u6', name: 'Tricep Pushdown', muscle: 'Triceps', videoId: '2-LAMcpzODU', targetSets: 2 },
  ],
  'Legs & Core': [
    { id: 'lc1', name: 'Leg Press', muscle: 'Quads', videoId: 'IZxyjW7OSvc', targetSets: 3 },
    { id: 'lc2', name: 'Leg Curl', muscle: 'Hamstrings', videoId: 'F488k67BTNo', targetSets: 3 },
    { id: 'lc3', name: 'Calf Raise', muscle: 'Calves', videoId: '-M4-G8p8fmc', targetSets: 4 },
    { id: 'lc4', name: 'Abs / Crunch', muscle: 'Core', videoId: null, targetSets: 3 },
  ]
};

const getTodaySplit = () => {
  const day = new Date().getDay(); 
  if (day === 1) return 'Push';
  if (day === 2) return 'Pull';
  if (day === 3) return 'Legs';
  if (day === 4) return 'Rest'; 
  if (day === 5) return 'Upper';
  if (day === 6) return 'Legs & Core';
  return 'Rest'; 
};

const getHariIndonesia = () => {
  const hari = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return hari[new Date().getDay()];
};

const callGeminiAPI = async (prompt, isRaw = false) => {
  let apiKey = "";
  try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    apiKey = env.VITE_GEMINI_API_KEY || "";
  } catch (e) { apiKey = ""; }
  
  if (!apiKey) {
    console.error("API Key not found!");
    return "API Key configuration incomplete.";
  }
  
  const combinedPrompt = isRaw ? prompt : "You are a professional fitness coach. Answer in English, use professional yet encouraging tone. Keep it concise, max 3-5 sentences. Analyze data accurately.\n\n" + prompt;
  
  const modelsToTry = [
    'gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro', 
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
    'gemma-4-31b', 'gemma-4-26b', 'gemma-3-2b',
    'gemini-2-flash', 'gemini-1.5-flash'
  ];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: combinedPrompt }] }] }) });
      if (response.ok) { const result = await response.json(); return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response."; }
    } catch (error) {}
  }
  return null; 
};

// ========== MODERN PROFESSIONAL COMPONENTS ==========

const Card = ({ children, className = "" }) => (
  <div className={`
    bg-white border border-gray-200 rounded-xl p-6 shadow-sm 
    hover:shadow-md transition-shadow duration-300 ${className}
  `}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", size = "md" }) => {
  const variants = {
    default: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const sizes = {
    sm: "px-2.5 py-1 text-xs font-medium",
    md: "px-3 py-1.5 text-sm font-medium",
  };
  return (
    <span className={`inline-flex border rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// ========== MUSCLE RECOVERY CARD ==========

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
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <Activity size={16} className="mr-2 text-blue-600"/> Muscle Recovery
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {recoveryData.map((item, idx) => {
          let badgeVariant = "success";
          let label = "Ready";
          
          if (item.status === 'tired') {
             badgeVariant = "danger";
             label = "Fatigued";
          } else if (item.status === 'recovering') {
             badgeVariant = "warning";
             label = "Recovering";
          }

          return (
            <div key={idx} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
               <p className="text-xs font-semibold text-gray-700">{item.muscle}</p>
               <Badge variant={badgeVariant} size="sm" className="mt-1.5 justify-center w-full">
                 {label}
               </Badge>
            </div>
          )
        })}
      </div>
    </Card>
  );
};

// ========== EXERCISE CARD (TRACK TAB) ==========

const ExerciseCard = ({ exercise, onLog, history, onDeleteLog, onEditLog, onDeleteExercise, onEditExercise, activeTab }) => {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState('Normal'); 
  const [tempSubSets, setTempSubSets] = useState([]); 
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState('list'); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [prModal, setPrModal] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', sets: '', reps: '' });

  const [showVideo, setShowVideo] = useState(false);
  const [aiTip, setAiTip] = useState(null);
  const [isAiTipLoading, setIsAiTipLoading] = useState(false);
  const [aiAlt, setAiAlt] = useState(null);
  const [isAiAltLoading, setIsAiAltLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(null);
  const [isAiProgressLoading, setIsAiProgressLoading] = useState(false);

  const [isEditingEx, setIsEditingEx] = useState(false);
  const [exEditForm, setExEditForm] = useState({ 
    name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3,
    videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : ''
  });

  const handleGetTip = async () => {
    if (aiTip) { setAiTip(null); return; }
    setShowVideo(false); setIsAiTipLoading(true);
    const response = await callGeminiAPI(`Give one biomechanics tip for ${exercise.name} focusing on form and mind-muscle connection.`);
    setAiTip(response || "Failed to connect with AI."); setIsAiTipLoading(false);
  };

  const handleGetAlternative = async () => {
    if (aiAlt) { setAiAlt(null); return; }
    setShowVideo(false); setIsAiAltLoading(true);
    const response = await callGeminiAPI(`Suggest 1 alternative machine/dumbbell/cable exercise similar to ${exercise.name}. Explain why and briefly how to perform it.`);
    setAiAlt(response || "Failed to connect with AI."); setIsAiAltLoading(false);
  };

  const handleGetProgressAdvice = async () => {
    if (aiProgress) { setAiProgress(null); return; }
    setShowVideo(false); setIsAiProgressLoading(true);
    const chronologicalHistory = [...history].slice(0, 4).reverse();
    const recentTrend = chronologicalHistory.map((l, idx) => `Session ${idx+1}: ${l.weight}kg (${l.sets}x${l.reps}) RPE:${l.rpe||'-'}`).join(' → ');
    const targetSetContext = exercise.targetSets ? `\nProgram target for this exercise is ${exercise.targetSets} SETS.` : '';
    const prompt = `History (oldest → newest) ${exercise.name}:\n[ ${recentTrend} ]${targetSetContext}\n\nEvaluate load and RPE trend. Suggest load/rep for next session (progressive overload). Check if sets meet target ${exercise.targetSets} sets.`;
    const response = await callGeminiAPI(prompt);
    setAiProgress(response || "Failed to connect with AI."); setIsAiProgressLoading(false);
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
      isPR = true; setPrModal(true); setTimeout(() => setPrModal(false), 4000);
    }
    logData.isPR = isPR;

    onLog(logData);
    setWeight(''); setSets(''); setReps(''); setRpe(''); setTempSubSets([]);
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2500);
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (setType === 'Normal') handleSubmit();
    else if (weight && reps) handleAddSubSet();
  };

  const startEdit = (log) => { setEditingId(log.id); setEditForm({ weight: log.weight, sets: log.sets, reps: log.reps }); };
  const saveEdit = (id) => {
    if (!editForm.weight || !editForm.sets || !editForm.reps) return;
    const w = parseFloat(editForm.weight); const r = parseInt(editForm.reps);
    onEditLog(id, { weight: w, sets: parseInt(editForm.sets), reps: r, oneRepMax: parseFloat(calculate1RM(w,r).toFixed(1)) });
    setEditingId(null);
  };
  
  const handleSaveExEdit = () => {
    if (!exEditForm.name) return;
    const extractedVideoId = getYouTubeId(exEditForm.videoUrl);
    onEditExercise(activeTab, exercise.id, exEditForm.name, exEditForm.muscle, parseInt(exEditForm.targetSets), extractedVideoId);
    setIsEditingEx(false);
  };

  const ChartView = () => {
    if (history.length === 0) return <p className="text-xs text-gray-500 text-center py-8">No data for chart yet.</p>;
    const chartData = [...history].slice(0, 7).reverse();
    const max1RM = Math.max(...chartData.map(d => d.oneRepMax || 0));
    const upperBound = max1RM > 0 ? max1RM * 1.2 : 10;

    return (
      <div className="pt-4 pb-4 animate-in fade-in h-48 flex gap-3">
        <div className="flex flex-col justify-between text-[9px] font-semibold text-gray-500 pb-5 pt-4 border-r border-gray-200 pr-3">
          <span>{Math.round(upperBound)}</span>
          <span>{Math.round(upperBound / 2)}</span>
          <span>0</span>
        </div>
        <div className="flex-1 relative flex items-end justify-around h-full gap-2">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5 pt-4 z-0">
            <div className="w-full h-px border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px border-t border-dashed border-gray-200"></div>
          </div>
          {chartData.map((d, i) => {
            const heightPct = Math.max(1, ((d.oneRepMax || 0) / upperBound) * 100);
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative z-10">
                <div className="text-[10px] font-bold text-gray-900 mb-1 z-20">{d.oneRepMax}</div>
                <div className={`w-full max-w-[24px] rounded-t-md transition-all duration-700 ${d.isPR ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-blue-400'}`} style={{ height: `${heightPct}%` }}></div>
                <div className="text-[8px] font-semibold text-gray-400 mt-2 truncate w-full text-center">{d.date.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const groupedHistory = [];
  let currentGroup = null;
  history.forEach(log => {
    if (!currentGroup || currentGroup.date !== log.date) {
      currentGroup = { date: log.date, logs: [] };
      groupedHistory.push(currentGroup);
    }
    currentGroup.logs.push(log);
  });

  return (
    <Card className="border-l-4 border-l-blue-500">
      {isEditingEx ? (
        <div className="space-y-3 mb-2 animate-in fade-in">
          <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Exercise Name" />
          <div className="flex gap-2">
            <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Target Muscle" />
            <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Sets" />
          </div>
          <input type="text" value={exEditForm.videoUrl} onChange={e => setExEditForm({...exEditForm, videoUrl: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="YouTube Link (Optional)" />
          <div className="flex space-x-2 pt-2">
            <button onClick={handleSaveExEdit} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Save size={14} className="mr-1 inline"/> Save</button>
            <button onClick={() => setIsEditingEx(false)} className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{exercise.name}</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default" size="sm">{exercise.muscle}</Badge>
                {exercise.targetSets && (
                  <Badge variant="success" size="sm">Target: {exercise.targetSets}S</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => {
                  setExEditForm({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });
                  setIsEditingEx(true);
                }} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {exercise.videoId ? (
          <button 
            onClick={(e) => { e.preventDefault(); setShowVideo(!showVideo); setAiTip(null); setAiAlt(null); }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-lg transition-all border text-xs font-semibold ${showVideo ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`} 
          >
            <PlayCircle size={16} />
            VIDEO
          </button>
        ) : (
          <a 
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " gym form tutorial")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-xs font-semibold" 
          >
            <PlayCircle size={16} />
            VIDEO
          </a>
        )}
        
        <button onClick={handleGetAlternative} className="flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-xs font-semibold">
          {isAiAltLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          ALT
        </button>
        
        <button onClick={handleGetTip} className="flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold">
          {isAiTipLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
          AI TIP
        </button>
      </div>

      {showVideo && exercise.videoId && (
        <div className="rounded-lg overflow-hidden bg-black mb-4 border border-gray-200 relative aspect-video animate-in zoom-in-95">
          <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0&modestbranding=1`} title="Tutorial" allowFullScreen></iframe>
        </div>
      )}

      {aiTip && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3 animate-in slide-in-from-top-2 flex items-start gap-2">
          <Sparkles size={14} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-900 font-medium leading-relaxed">{aiTip}</p>
        </div>
      )}

      {aiAlt && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3 animate-in slide-in-from-top-2 flex items-start gap-2">
          <RefreshCw size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900 font-medium leading-relaxed">{aiAlt}</p>
        </div>
      )}

      {aiProgress && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg mb-3 animate-in slide-in-from-top-2 flex items-start gap-2">
          <TrendingUp size={14} className="text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-900 font-medium leading-relaxed">{aiProgress}</p>
        </div>
      )}

      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {['Normal', 'Drop Set', 'Superset'].map(type => (
            <button 
              key={type} type="button" onClick={() => handleSetTypeChange(type)}
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider whitespace-nowrap transition-all ${setType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {setType !== 'Normal' && tempSubSets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-2 bg-white rounded-lg border border-gray-200">
            {tempSubSets.map((s, i) => (
              <div key={i} className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center border border-blue-200">
                {s.weight}kg×{s.reps} {s.rpe && <span className="ml-1 opacity-70">RPE:{s.rpe}</span>}
                <button type="button" onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))} className="ml-2 text-blue-500 hover:text-blue-700"><X size={12}/></button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onFormSubmit} className="flex flex-col gap-3">
          <div className={`grid gap-2 ${setType === 'Normal' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none placeholder-gray-500" placeholder="KG" />
            {setType === 'Normal' && (
              <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none placeholder-gray-500" placeholder="SET" />
            )}
            <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none placeholder-gray-500" placeholder="REP" />
            <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none placeholder-gray-500" placeholder="RPE" />
          </div>
          
          {setType === 'Normal' ? (
            <button type="submit" disabled={!weight || !sets || !reps} className={`py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-emerald-600 text-white shadow-md' : 'bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700'}`}>
              {showSuccess ? <CheckCircle size={16} className="mr-1" /> : ''}LOG SET
            </button>
          ) : (
            <div className="flex gap-2">
               <button type="submit" disabled={!weight || !reps} className="flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide uppercase bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50">
                 Add
               </button>
               <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700'}`}>
                 {showSuccess ? <CheckCircle size={16} className="mr-1" /> : ''}Save
               </button>
            </div>
          )}
        </form>
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center px-1 mb-3 gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => { setShowHistory(true); setHistoryTab('list'); }} className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${showHistory && historyTab === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>LIST</button>
              <button onClick={() => { setShowHistory(true); setHistoryTab('chart'); }} className={`flex items-center px-3 py-1.5 rounded text-xs font-semibold transition-all ${showHistory && historyTab === 'chart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <BarChart2 size={12} className="mr-1"/> CHART
              </button>
            </div>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-xs font-semibold tracking-wide uppercase text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center active:scale-95 border border-blue-200">
              {isAiProgressLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Zap size={12} className="mr-1" />} 
              ANALYZE
            </button>
          </div>

          {showHistory && (
            <div className="animate-in slide-in-from-top-2 duration-300 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {historyTab === 'chart' ? (
                <ChartView />
              ) : (
                <div className="space-y-3">
                  {groupedHistory.map((group, gIndex) => (
                    <div key={gIndex} className="space-y-2">
                      <div className="flex items-center gap-3 px-1 py-1">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-[9px] font-semibold tracking-widest text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">{group.date}</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                      </div>
                      
                      {group.logs.map((log) => (
                        <div key={log.id}>
                          {editingId === log.id ? (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex gap-2 mb-2">
                                 <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="flex-1 bg-gray-50 border border-gray-300 rounded px-2 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none" />
                                 <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="flex-1 bg-gray-50 border border-gray-300 rounded px-2 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none" />
                                 <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="flex-1 bg-gray-50 border border-gray-300 rounded px-2 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none" />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                                <button onClick={() => saveEdit(log.id)} className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700">Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex justify-between items-start bg-white border rounded-lg p-3 transition-all hover:border-gray-300 ${log.isPR ? 'border-blue-300 shadow-sm shadow-blue-200' : 'border-gray-200'}`}>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-sm mb-1 flex items-center flex-wrap gap-1">
                                  {log.isPR && <Crown size={14} className="text-blue-600" />}
                                  {log.subSets ? (
                                    log.subSets.map((sub, i) => (
                                      <React.Fragment key={i}>
                                        <span className="text-sm">{sub.weight}kg×{sub.reps} {sub.rpe && <span className="text-xs text-gray-500">RPE:{sub.rpe}</span>}</span>
                                        {i < log.subSets.length - 1 && <span className="text-gray-400">→</span>}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <span className="text-sm">{log.weight}kg×{log.sets}×{log.reps}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                  <Clock size={11} className="opacity-70"/> {log.time}
                                  {log.rpe && <span>RPE:{log.rpe}</span>}
                                  {log.setType && log.setType !== 'Normal' && (
                                    <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                      {log.setType}
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-blue-600 ml-auto">
                                    1RM: {log.oneRepMax}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                {!log.subSets && (
                                  <button onClick={() => startEdit(log)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Edit2 size={12} /></button>
                                )}
                                <button onClick={() => onDeleteLog(log.id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Trash2 size={12} /></button>
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

      {prModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden border border-gray-200">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100 rounded-full opacity-40"></div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-500 relative z-10">
              <Trophy size={28} className="text-blue-600" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">NEW PR!</h4>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">Amazing! Your {exercise.name} just hit a new personal record. Keep up this momentum!</p>
          </div>
        </div>
      )}
    </Card>
  );
};

// ========== MAIN APP ==========

export default function App() {
  const todaySplit = getTodaySplit();
  const [activeTab, setActiveTab] = useState('home');
  const [activeWorkoutTab, setActiveWorkoutTab] = useState(todaySplit === 'Rest' ? 'Push' : todaySplit);
  
  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_v11'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_v11'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [healthData, setHealthData] = useState(() => { const saved = localStorage.getItem('gym_health_v2'); return saved ? JSON.parse(saved) : {}; });
  
  const [dailyNote, setDailyNote] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [restTime, setRestTime] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({ duration: '', cals: '', hr: '', sleep: '', spo2: '' });

  useEffect(() => {
    const today = new Date().toLocaleDateString('id-ID');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    setDailyNote(allNotes[today] || '');
  }, []);

  useEffect(() => { localStorage.setItem('gym_logs_v11', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('gym_exercises_v11', JSON.stringify(exerciseData)); }, [exerciseData]);
  useEffect(() => { localStorage.setItem('gym_health_v2', JSON.stringify(healthData)); }, [healthData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'sync_health') {
      const hrRaw = params.get('hr') ? parseFloat(params.get('hr').replace(',', '.')) : 0;
      const hr = isNaN(hrRaw) ? 0 : Math.round(hrRaw);
      const calsRaw = params.get('cals') ? parseFloat(params.get('cals').replace(',', '.')) : 0;
      const cals = isNaN(calsRaw) ? 0 : Math.round(calsRaw);
      const sleepRaw = params.get('sleep') ? parseFloat(params.get('sleep').replace(',', '.')) : 0;
      const sleep = isNaN(sleepRaw) ? 0 : Math.round(sleepRaw);
      const spo2Raw = params.get('spo2') ? parseFloat(params.get('spo2').replace(',', '.')) : 0;
      let spo2 = isNaN(spo2Raw) ? 0 : spo2Raw;
      if (spo2 > 0 && spo2 <= 1) spo2 = Math.round(spo2 * 100);
      else spo2 = Math.round(spo2);
      
      const today = new Date().toLocaleDateString('id-ID');
      setHealthData(prev => ({
         ...prev,
         [today]: { ...prev[today], hr, cals, sleep, spo2 }
      }));

      window.history.replaceState({}, document.title, window.location.pathname);
      
      setConfirmDialog({ 
        message: `Sync successful! (HR: ${hr} bpm, Calories: ${cals} kcal, Sleep: ${Math.floor(sleep/60)}h ${sleep%60}m, O2: ${spo2}%)`, 
        onConfirm: () => setConfirmDialog(null), 
        isAlert: true 
      });
    }
  }, []);

  const handleSaveNote = (val) => {
    setDailyNote(val);
    const today = new Date().toLocaleDateString('id-ID');
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    allNotes[today] = val;
    localStorage.setItem('gym_notes_v12', JSON.stringify(allNotes));
  };

  const handleSaveHealthMetrics = (e) => {
    e.preventDefault();
    if (!healthMetrics.cals && !healthMetrics.hr && !healthMetrics.sleep && !healthMetrics.spo2) return;
    
    const today = new Date().toLocaleDateString('id-ID');
    setHealthData({...healthData, [today]: {
       duration: parseInt(healthMetrics.duration) || 0,
       cals: parseInt(healthMetrics.cals) || 0,
       hr: parseInt(healthMetrics.hr) || 0,
       sleep: parseInt(healthMetrics.sleep) || 0,
       spo2: parseInt(healthMetrics.spo2) || 0,
    }});
    setShowEndSessionModal(false);
    setHealthMetrics({ duration: '', cals: '', hr: '', sleep: '', spo2: '' });
  };

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
      setConfirmDialog({ message: "Rest time is up! Ready for the next set?", onConfirm: () => setConfirmDialog(null), isAlert: true });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restTime]);

  const addTime = (secs) => { setRestTime(prev => prev + secs); setIsTimerRunning(true); };

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '', targetSets: '' });

  const [preWorkoutAdvice, setPreWorkoutAdvice] = useState(null);
  const [isPreWorkoutLoading, setIsPreWorkoutLoading] = useState(false);
  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);

  const handleGetPreWorkoutBriefing = async () => {
    setIsPreWorkoutLoading(true);
    
    const recentLogs = logs.slice(0, 15).map(l => {
      const exName = (exerciseData[activeWorkoutTab] || Object.values(exerciseData).flat()).find(e => e.id === l.exerciseId)?.name || l.exerciseId;
      return `${exName}: ${l.weight}kg x ${l.reps}`;
    }).join(', ');
    
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    const recentNotesStr = Object.entries(allNotes).slice(-3).map(([k,v]) => `(${k}) ${v}`).join(' | ');

    const today = new Date().toLocaleDateString('id-ID');
    const todayHealth = healthData[today] || Object.values(healthData).pop() || {};
    const sleepInfo = todayHealth.sleep ? `\nLast night I slept ${Math.floor(todayHealth.sleep/60)}h ${todayHealth.sleep%60}m.` : '';

    const prompt = `I'm starting ${activeWorkoutTab} day. Recent notes: [${recentNotesStr || 'No specific notes'}]. Recent lifts: [${recentLogs || 'No data'}]. ${sleepInfo} \n\nAs a pro coach, give a brief "Pre-Workout Briefing" (max 3 sentences). Analyze my condition/mood and sleep quality, then suggest strategy, intensity, or mental focus for ${activeWorkoutTab} today.`;

    const response = await callGeminiAPI(prompt);
    setPreWorkoutAdvice(response || "Failed to connect with AI.");
    setIsPreWorkoutLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = (exerciseData[activeWorkoutTab] || []).map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`${activeWorkoutTab} day (muscles: ${muscles}). Give 3 scientific dynamic warmup moves.`);
    setAiWarmup(response);
    setIsWarmupLoading(false);
  };

  const handleAddLog = async (log) => {
    const newLog = { 
      ...log, id: Date.now().toString(),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), 
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), timestamp: Date.now()
    };
    setLogs([newLog, ...logs]);
  };

  const onDeleteLog = (id) => { 
    setConfirmDialog({ message: "Delete this log?", onConfirm: () => { setLogs(logs.filter(l => l.id !== id)); setConfirmDialog(null); }});
  };

  const handleEditLog = async (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  
  const handleSaveCustom = async (e) => {
    e.preventDefault(); 
    if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'General', targetSets: newExercise.targetSets ? parseInt(newExercise.targetSets) : 3, videoId: null };
    setExerciseData(prev => ({ ...prev, [activeWorkoutTab]: [...(prev[activeWorkoutTab] || []), item] }));
    setIsAddingExercise(false); 
    setNewExercise({ name: '', muscle: '', targetSets: '' });
  };
  
  const handleDeleteExercise = (tab, id) => { 
    setConfirmDialog({ message: "Delete this exercise from your routine?", onConfirm: () => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).filter(ex => ex.id !== id) })); setConfirmDialog(null); }});
  };
  
  const handleEditExercise = async (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); 
  };

  // ========== TAB 1: HOME (Dashboard & AI Briefing) ==========
  const renderHome = () => (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">GymTracker</h1>
          <div className="text-sm font-semibold opacity-90">{getHariIndonesia()}</div>
        </div>
        <p className="text-blue-100 text-sm">{todaySplit === 'Rest' ? 'Rest Day - Recovery & Mobility' : `Today: ${todaySplit} Day`}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="!p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
          <div className="text-xs text-gray-600 mt-1">Total Sets</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{new Set(logs.map(l => l.date)).size}</div>
          <div className="text-xs text-gray-600 mt-1">Training Days</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(healthData).length}</div>
          <div className="text-xs text-gray-600 mt-1">Health Logs</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{Math.max(...logs.map(l => l.oneRepMax || 0), 0).toFixed(0)}</div>
          <div className="text-xs text-gray-600 mt-1">Max 1RM</div>
        </Card>
      </div>

      {/* Muscle Recovery */}
      <MuscleRecovery logs={logs} exerciseData={exerciseData} />

      {/* AI Pre-Workout Briefing */}
      {!preWorkoutAdvice && !isPreWorkoutLoading ? (
        <button onClick={handleGetPreWorkoutBriefing} className="w-full bg-blue-50 border-2 border-blue-200 hover:border-blue-400 text-blue-700 p-4 rounded-xl flex items-center justify-between transition-all active:scale-95">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} />
            <span className="font-semibold">Get Pre-Workout Briefing</span>
          </div>
          <ChevronRight size={16} />
        </button>
      ) : isPreWorkoutLoading ? (
        <Card className="!bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-center h-16">
            <Loader2 size={18} className="animate-spin text-blue-600 mr-2" />
            <span className="text-sm font-semibold text-blue-700">AI analyzing your data...</span>
          </div>
        </Card>
      ) : (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <button onClick={() => setPreWorkoutAdvice(null)} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"><X size={16}/></button>
          <div className="flex items-start gap-3 mb-2">
            <MessageSquare size={16} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Your Briefing</h4>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{preWorkoutAdvice}</p>
            </div>
          </div>
        </Card>
      )}

      {/* AI Warmup */}
      <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="w-full bg-orange-50 border-2 border-orange-200 hover:border-orange-400 text-orange-700 p-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold active:scale-95">
        {isWarmupLoading ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
        Dynamic Warmup Routine
      </button>

      {aiWarmup && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <button onClick={() => setAiWarmup(null)} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"><X size={16}/></button>
          <div className="flex items-start gap-3">
            <Flame size={16} className="text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Warmup Routine</h4>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{aiWarmup}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ========== TAB 2: TRACK (Exercise Logging) ==========
  const renderTrack = () => (
    <div className="space-y-4 pb-24">
      {/* Split Selector */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur -mx-4 sm:mx-0 px-4 sm:px-0 py-4 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Today's Split</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['Push', 'Pull', 'Legs', 'Upper', 'Legs & Core'].map((t) => (
            <button 
              key={t} onClick={() => setActiveWorkoutTab(t)} 
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${activeWorkoutTab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-4">
        {(exerciseData[activeWorkoutTab] || []).map(ex => (
          <ExerciseCard 
            key={ex.id} exercise={ex} activeTab={activeWorkoutTab} 
            onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
            onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise} 
            history={logs.filter(l => l.exerciseId === ex.id)} 
          />
        ))}
      </div>

      {/* Add Custom Exercise */}
      {isAddingExercise ? (
        <Card className="border-2 border-blue-200">
          <h3 className="font-semibold mb-4 text-gray-900 text-sm uppercase flex items-center"><PlusCircle size={16} className="mr-2 text-blue-600"/> Custom Exercise</h3>
          <form onSubmit={handleSaveCustom} className="space-y-3">
            <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Exercise Name" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" autoFocus/>
            <div className="flex gap-2">
              <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Target Muscle" className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"/>
              <input type="number" value={newExercise.targetSets} onChange={e => setNewExercise({...newExercise, targetSets: e.target.value})} placeholder="Sets" className="w-20 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAddingExercise(false)} className="flex-1 px-3 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm">Cancel</button>
              <button type="submit" disabled={!newExercise.name} className="flex-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm disabled:opacity-40">Add</button>
            </div>
          </form>
        </Card>
      ) : (
        <button 
          onClick={() => setIsAddingExercise(true)} 
          className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all font-semibold text-sm active:scale-95 group"
        >
          <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" />
          ADD CUSTOM EXERCISE
        </button>
      )}

      {/* End Session */}
      <button 
         onClick={() => setShowEndSessionModal(true)}
         className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold flex items-center justify-center active:scale-95 transition-all shadow-md"
      >
         <CheckSquare size={18} className="mr-2" /> END SESSION
      </button>

      {/* Daily Journal */}
      <Card>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center"><PenTool size={16} className="mr-2 text-blue-600"/> Session Notes</h4>
        <textarea 
          value={dailyNote}
          onChange={(e) => handleSaveNote(e.target.value)}
          placeholder="How did this workout feel? Any form issues or observations?"
          className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[80px] resize-none"
        />
      </Card>
    </div>
  );

  // ========== TAB 3: STATS (Analytics & History) ==========
  const renderStats = () => (
    <div className="space-y-6 pb-24">
      {/* Workout Timeline */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><CalendarDays size={16} className="mr-2 text-blue-600"/> Consistency (35 Days)</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No workouts logged yet</p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({length: 35}).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (34 - i));
              const dateStr = d.toLocaleDateString('id-ID');
              const hasWorkout = logs.some(l => l.date === dateStr);
              return (
                <div key={i} className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${hasWorkout ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400'}`} title={dateStr}>
                  {d.getDate()}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Latest Workouts */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><History size={16} className="mr-2 text-blue-600"/> Latest Sessions</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No workouts yet</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => {
              const ex = (exerciseData[activeWorkoutTab] || Object.values(exerciseData).flat()).find(e => e.id === log.exerciseId);
              return (
                <div key={log.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ex?.name || log.exerciseId}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{log.date} • {log.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{log.weight}kg</p>
                    <p className="text-xs text-gray-500">{log.sets}×{log.reps}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Performance Metrics */}
      {Object.keys(healthData).length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><TrendingUp size={16} className="mr-2 text-blue-600"/> Health Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const healthList = Object.values(healthData);
              const avgHr = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.hr || 0), 0) / healthList.length) : 0;
              const avgCals = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.cals || 0), 0) / healthList.length) : 0;
              const avgSpo2 = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.spo2 || 0), 0) / healthList.length) : 0;
              const avgSleepMins = healthList.length > 0 ? Math.round(healthList.reduce((acc, curr) => acc + (curr.sleep || 0), 0) / healthList.length) : 0;

              return (
                <>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <Heart size={14} className="text-rose-600 mb-1" />
                    <div className="text-lg font-bold text-gray-900">{avgHr} <span className="text-xs font-semibold text-gray-500">BPM</span></div>
                    <p className="text-xs text-gray-600 mt-0.5">Avg Heart Rate</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <Flame size={14} className="text-orange-600 mb-1" />
                    <div className="text-lg font-bold text-gray-900">{avgCals} <span className="text-xs font-semibold text-gray-500">kcal</span></div>
                    <p className="text-xs text-gray-600 mt-0.5">Avg Calories</p>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                    <Wind size={14} className="text-sky-600 mb-1" />
                    <div className="text-lg font-bold text-gray-900">{avgSpo2} <span className="text-xs font-semibold text-gray-500">%</span></div>
                    <p className="text-xs text-gray-600 mt-0.5">Blood Oxygen</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <MoonStar size={14} className="text-purple-600 mb-1" />
                    <div className="text-lg font-bold text-gray-900">{Math.floor(avgSleepMins/60)} <span className="text-xs font-semibold text-gray-500">h</span></div>
                    <p className="text-xs text-gray-600 mt-0.5">Sleep (7d avg)</p>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      )}

      {/* Most Lifted */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><Trophy size={16} className="mr-2 text-blue-600"/> Top Exercises (By 1RM)</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No data yet</p>
        ) : (
          <div className="space-y-2">
            {Array.from(
              logs.reduce((acc, log) => {
                const key = log.exerciseId;
                if (!acc.has(key) || (log.oneRepMax || 0) > (acc.get(key).oneRepMax || 0)) {
                  acc.set(key, log);
                }
                return acc;
              }, new Map())
            )
            .sort((a, b) => (b[1].oneRepMax || 0) - (a[1].oneRepMax || 0))
            .slice(0, 5)
            .map(([exId, log]) => {
              const ex = Object.values(exerciseData).flat().find(e => e.id === exId);
              return (
                <div key={exId} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-900">{ex?.name || exId}</span>
                  <span className="text-sm font-bold text-blue-600">{log.oneRepMax} kg</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'track' && renderTrack()}
        {activeTab === 'stats' && renderStats()}
      </div>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-2xl mx-auto flex">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-4 px-3 flex flex-col items-center justify-center gap-2 transition-all border-t-2 ${activeTab === 'home' ? 'border-t-blue-600 bg-blue-50' : 'border-t-transparent hover:bg-gray-50'}`}
          >
            <Home size={22} className={activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs font-semibold ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'}`}>Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-4 px-3 flex flex-col items-center justify-center gap-2 transition-all border-t-2 relative ${activeTab === 'track' ? 'border-t-blue-600 bg-blue-50' : 'border-t-transparent hover:bg-gray-50'}`}
          >
            <Target size={22} className={activeTab === 'track' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs font-semibold ${activeTab === 'track' ? 'text-blue-600' : 'text-gray-600'}`}>Track</span>
            {restTime > 0 && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {restTime > 60 ? Math.floor(restTime/60) + 'm' : restTime + 's'}
              </div>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 px-3 flex flex-col items-center justify-center gap-2 transition-all border-t-2 ${activeTab === 'stats' ? 'border-t-blue-600 bg-blue-50' : 'border-t-transparent hover:bg-gray-50'}`}
          >
            <BarChart2 size={22} className={activeTab === 'stats' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs font-semibold ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-600'}`}>Stats</span>
          </button>
        </div>
      </div>

      {/* MODALS */}

      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center"><Timer size={18} className="mr-2 text-blue-600" /> Rest Timer</h4>
              <button onClick={() => setShowTimerModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
            </div>
            <div className="text-center mb-8">
              <span className={`text-5xl font-black tabular-nums tracking-tighter ${restTime === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
               <button onClick={() => addTime(30)} className="py-2.5 bg-gray-100 hover:bg-blue-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-700 active:scale-95">+30s</button>
               <button onClick={() => addTime(60)} className="py-2.5 bg-gray-100 hover:bg-blue-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-700 active:scale-95">+60s</button>
               <button onClick={() => addTime(90)} className="py-2.5 bg-gray-100 hover:bg-blue-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-700 active:scale-95">+90s</button>
               <button onClick={() => { setRestTime(0); setIsTimerRunning(false); }} className="py-2.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 active:scale-95">Reset</button>
            </div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={restTime === 0} className={`w-full py-3.5 rounded-lg text-sm font-semibold flex justify-center items-center active:scale-95 transition-all ${isTimerRunning ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700'}`}>
              {isTimerRunning ? <><Pause size={18} className="mr-2" /> PAUSE</> : <><Play size={18} className="mr-2" /> START</>}
            </button>
          </Card>
        </div>
      )}

      {showEndSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center"><CheckSquare size={18} className="mr-2 text-emerald-600" /> End Session</h4>
              <button onClick={() => setShowEndSessionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
            </div>
            
            <p className="text-xs text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              Leave blank if using Apple Health. Fill manually otherwise.
            </p>

            <form onSubmit={handleSaveHealthMetrics} className="space-y-3">
              <input type="number" value={healthMetrics.duration} onChange={(e) => setHealthMetrics({...healthMetrics, duration: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Duration (Minutes)" />
              <input type="number" value={healthMetrics.cals} onChange={(e) => setHealthMetrics({...healthMetrics, cals: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Calories Burned" />
              <input type="number" value={healthMetrics.hr} onChange={(e) => setHealthMetrics({...healthMetrics, hr: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Avg Heart Rate (BPM)" />
              <input type="number" value={healthMetrics.sleep} onChange={(e) => setHealthMetrics({...healthMetrics, sleep: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Sleep Last Night (Minutes)" />
              <input type="number" step="0.1" value={healthMetrics.spo2} onChange={(e) => setHealthMetrics({...healthMetrics, spo2: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="Blood Oxygen %" />
              
              <button type="submit" className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold active:scale-95">
                SAVE & END SESSION
              </button>
            </form>
          </Card>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{confirmDialog.isAlert ? 'Alert' : 'Confirm'}</h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2">
              {!confirmDialog.isAlert && (
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm">Cancel</button>
              )}
              <button onClick={confirmDialog.onConfirm} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm active:scale-95 ${confirmDialog.isAlert ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-rose-600 text-white hover:bg-rose-700'}`}>
                {confirmDialog.isAlert ? 'OK' : 'DELETE'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {restTime > 0 && !showTimerModal && (
        <button onClick={() => setShowTimerModal(true)} className="fixed bottom-24 right-6 z-40 bg-blue-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 hover:bg-blue-700 transition-all font-bold">
           <Timer size={18} className="animate-pulse" />
           {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
        </button>
      )}
    </div>
  );
}