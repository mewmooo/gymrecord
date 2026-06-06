import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, History, Plus, ChevronDown, ChevronUp, 
  CheckCircle, Activity, Edit2, Trash2, X, Check, Sparkles, Loader2, Bot,
  RefreshCw, TrendingUp, PlusCircle, Moon, Sun, Flame,
  PlayCircle, Save, Video, Zap, Skull, Scale, ChevronRight, Timer, Trophy, BarChart2, Crown, Play, Pause, Clock,
  Battery, BatteryCharging, BatteryFull, PenTool, BookOpen, MessageSquare, Heart, CheckSquare, MoonStar, Wind,
  Settings, Grid, Menu, Target, Zap as ZapIcon, Monitor
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
    return "API Key configuration incomplete in Vercel.";
  }
  
  const combinedPrompt = isRaw ? prompt : "You are an advanced professional fitness coach. Answer in English, use a professional yet engaging tone. Keep it concise, max 3-5 sentences. Analyze data literally.\n\n" + prompt;
  
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

// ========== CYBERPUNK CARD COMPONENTS ==========

const CyberpunkCard = ({ children, className = "", neon = "pink" }) => {
  const neonClasses = {
    pink: "border-[#FF006E]/50 shadow-[0_0_20px_rgba(255,0,110,0.3)] hover:shadow-[0_0_40px_rgba(255,0,110,0.5)]",
    cyan: "border-[#00D9FF]/50 shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_40px_rgba(0,217,255,0.5)]",
    green: "border-[#39FF14]/50 shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_40px_rgba(57,255,20,0.5)]",
    purple: "border-[#BB86FC]/50 shadow-[0_0_20px_rgba(187,134,252,0.3)] hover:shadow-[0_0_40px_rgba(187,134,252,0.5)]",
  };

  return (
    <div className={`
      bg-gradient-to-br from-[#1a0f2e]/80 to-[#16213e]/80 
      backdrop-blur-xl border ${neonClasses[neon] || neonClasses.pink}
      rounded-xl p-5 transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
};

const NeonBadge = ({ children, color = "pink", size = "sm" }) => {
  const colorMap = {
    pink: "bg-[#FF006E]/20 text-[#FF77B4] border-[#FF006E]/50",
    cyan: "bg-[#00D9FF]/20 text-[#00FFF0] border-[#00D9FF]/50",
    green: "bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/50",
    purple: "bg-[#BB86FC]/20 text-[#E0BBE4] border-[#BB86FC]/50",
  };

  const sizeClasses = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";
  
  return (
    <span className={`
      border rounded-full font-bold tracking-wider uppercase inline-block
      ${colorMap[color]} ${sizeClasses}
    `}>
      {children}
    </span>
  );
};

// ========== MUSCLE RECOVERY (REDESIGNED) ==========

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
    <CyberpunkCard neon="cyan">
      <h3 className="text-xs font-bold tracking-widest text-[#00FFF0] uppercase mb-4 flex items-center">
        <Activity size={14} className="mr-2" /> MUSCLE STATUS (72H)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {recoveryData.map((item, idx) => {
          let colorClass = "border-[#39FF14]/70 bg-[#39FF14]/10 text-[#39FF14]";
          let label = "READY";
          
          if (item.status === 'tired') {
             colorClass = "border-[#FF006E]/70 bg-[#FF006E]/10 text-[#FF77B4]";
             label = "FATIGUED";
          } else if (item.status === 'recovering') {
             colorClass = "border-[#BB86FC]/70 bg-[#BB86FC]/10 text-[#E0BBE4]";
             label = "RECOVERING";
          }

          return (
            <div key={idx} className={`border rounded-lg p-3 text-center transition-all hover:scale-105 ${colorClass}`}>
               <div className="text-xs font-bold leading-tight">{item.muscle}</div>
               <div className="text-[10px] font-bold tracking-wider mt-1">{label}</div>
            </div>
          )
        })}
      </div>
    </CyberpunkCard>
  );
};

// ========== MAIN EXERCISE CARD (COMPLETELY REDESIGNED) ==========

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
        <div className="flex flex-col justify-between text-[9px] font-bold text-[#BB86FC]/60 pb-5 pt-4 border-r border-[#BB86FC]/20 pr-3">
          <span>{Math.round(upperBound)}</span>
          <span>{Math.round(upperBound / 2)}</span>
          <span>0</span>
        </div>
        <div className="flex-1 relative flex items-end justify-around h-full gap-2">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5 pt-4 z-0">
            <div className="w-full h-px border-t border-dashed border-[#BB86FC]/20"></div>
            <div className="w-full h-px border-t border-dashed border-[#BB86FC]/20"></div>
            <div className="w-full h-px border-t border-dashed border-[#BB86FC]/20"></div>
          </div>
          {chartData.map((d, i) => {
            const heightPct = Math.max(1, ((d.oneRepMax || 0) / upperBound) * 100);
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative z-10">
                <div className="text-[10px] font-bold text-[#00FFF0] mb-1 z-20">{d.oneRepMax}</div>
                <div className={`w-full max-w-[24px] rounded-t-md transition-all duration-700 ${d.isPR ? 'bg-gradient-to-t from-[#FF006E] to-[#FF77B4] shadow-[0_0_15px_rgba(255,0,110,0.6)]' : 'bg-gradient-to-t from-[#BB86FC] to-[#E0BBE4]'}`} style={{ height: `${heightPct}%` }}></div>
                <div className="text-[8px] font-bold text-[#BB86FC]/50 mt-2 truncate w-full text-center">{d.date.split(' ')[0]}</div>
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
    <CyberpunkCard neon="pink">
      <div className="mb-6">
        {isEditingEx ? (
          <div className="space-y-3 mb-2 animate-in fade-in">
            <input type="text" value={exEditForm.name} onChange={e => setExEditForm({...exEditForm, name: e.target.value})} className="w-full bg-[#16213e]/70 border border-[#BB86FC]/30 rounded-lg px-4 py-3 text-sm font-semibold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 transition-all" placeholder="Exercise Name" />
            <div className="flex gap-2">
              <input type="text" value={exEditForm.muscle} onChange={e => setExEditForm({...exEditForm, muscle: e.target.value})} className="w-2/3 bg-[#16213e]/70 border border-[#BB86FC]/30 rounded-lg px-4 py-3 text-xs font-semibold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 transition-all" placeholder="Target Muscle" />
              <input type="number" value={exEditForm.targetSets} onChange={e => setExEditForm({...exEditForm, targetSets: e.target.value})} className="w-1/3 bg-[#16213e]/70 border border-[#BB86FC]/30 rounded-lg px-4 py-3 text-xs font-semibold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 transition-all" placeholder="Sets" />
            </div>
            <input type="text" value={exEditForm.videoUrl} onChange={e => setExEditForm({...exEditForm, videoUrl: e.target.value})} className="w-full bg-[#16213e]/70 border border-[#BB86FC]/30 rounded-lg px-4 py-3 text-xs font-semibold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 transition-all" placeholder="YouTube Link (Optional)" />
            <div className="flex space-x-2 pt-2">
              <button onClick={handleSaveExEdit} className="flex-1 px-4 py-2.5 bg-[#39FF14] text-[#1a0f2e] text-xs font-bold rounded-lg hover:bg-[#39FF14]/90 active:scale-95 transition-all"><Save size={14} className="mr-2 inline"/> SAVE</button>
              <button onClick={() => setIsEditingEx(false)} className="flex-1 px-4 py-2.5 bg-[#BB86FC]/20 border border-[#BB86FC]/50 text-[#E0BBE4] text-xs font-bold rounded-lg active:scale-95 transition-all">CANCEL</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-black text-[#00FFF0] tracking-tight mb-2">{exercise.name}</h3>
                <div className="flex gap-2 flex-wrap">
                  <NeonBadge color="cyan" size="sm">{exercise.muscle}</NeonBadge>
                  {exercise.targetSets && (
                    <NeonBadge color="purple" size="sm">TARGET: {exercise.targetSets}S</NeonBadge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => {
                    setExEditForm({ name: exercise.name, muscle: exercise.muscle, targetSets: exercise.targetSets || 3, videoUrl: exercise.videoId ? `https://youtu.be/${exercise.videoId}` : '' });
                    setIsEditingEx(true);
                  }} 
                  className="p-2 text-[#BB86FC] hover:bg-[#BB86FC]/20 rounded-lg transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDeleteExercise(activeTab, exercise.id)} className="p-2 text-[#FF77B4] hover:bg-[#FF006E]/20 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        {exercise.videoId ? (
          <button 
            onClick={(e) => { e.preventDefault(); setShowVideo(!showVideo); setAiTip(null); setAiAlt(null); }}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-lg transition-all border ${showVideo ? 'bg-[#FF006E]/30 border-[#FF006E]/70 text-[#FF77B4]' : 'bg-[#16213e]/40 border-[#FF006E]/30 text-[#FF77B4] hover:border-[#FF006E]/70'}`} 
          >
            <PlayCircle size={16} className={showVideo ? "animate-pulse" : ""} />
            <span className="text-[8px] font-bold">VIDEO</span>
          </button>
        ) : (
          <a 
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " gym form tutorial")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-lg bg-[#16213e]/40 border border-[#FF006E]/30 text-[#FF77B4] hover:border-[#FF006E]/70 transition-all" 
          >
            <PlayCircle size={16} />
            <span className="text-[8px] font-bold">SEARCH</span>
          </a>
        )}
        
        <button onClick={handleGetAlternative} className="flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-lg bg-[#16213e]/40 border border-[#BB86FC]/30 text-[#E0BBE4] hover:border-[#BB86FC]/70 transition-all">
          {isAiAltLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          <span className="text-[8px] font-bold">ALT</span>
        </button>
        
        <button onClick={handleGetTip} className="flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-lg bg-[#39FF14]/20 border border-[#39FF14]/70 text-[#39FF14] hover:bg-[#39FF14]/30 transition-all">
          {isAiTipLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
          <span className="text-[8px] font-bold">AI TIP</span>
        </button>
      </div>

      {showVideo && exercise.videoId && (
        <div className="rounded-lg overflow-hidden bg-black mb-4 border border-[#FF006E]/30 shadow-[0_0_20px_rgba(255,0,110,0.3)] relative aspect-video animate-in zoom-in-95">
          <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${exercise.videoId}?rel=0&modestbranding=1`} title="Tutorial" allowFullScreen></iframe>
        </div>
      )}

      {aiTip && (
        <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-4 rounded-lg mb-4 animate-in slide-in-from-top-2 flex items-start">
          <Sparkles size={16} className="text-[#39FF14] mr-3 shrink-0 mt-0.5" />
          <p className="text-xs text-[#39FF14] font-medium leading-relaxed">{aiTip}</p>
        </div>
      )}

      {aiAlt && (
        <div className="bg-[#BB86FC]/10 border border-[#BB86FC]/50 p-4 rounded-lg mb-4 animate-in slide-in-from-top-2 flex items-start">
          <RefreshCw size={16} className="text-[#E0BBE4] mr-3 shrink-0 mt-0.5" />
          <p className="text-xs text-[#E0BBE4] font-medium leading-relaxed">{aiAlt}</p>
        </div>
      )}

      {aiProgress && (
        <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/50 p-4 rounded-lg mb-4 animate-in slide-in-from-top-2 flex items-start">
          <TrendingUp size={16} className="text-[#00FFF0] mr-3 shrink-0 mt-0.5" />
          <p className="text-xs text-[#00FFF0] font-medium leading-relaxed">{aiProgress}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-[#16213e]/50 rounded-lg border border-[#BB86FC]/20">
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {['Normal', 'Drop Set', 'Superset'].map(type => (
            <button 
              key={type} type="button" onClick={() => handleSetTypeChange(type)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-widest whitespace-nowrap transition-all ${setType === type ? 'bg-[#FF006E] text-white shadow-[0_0_15px_rgba(255,0,110,0.5)]' : 'bg-[#16213e] border border-[#BB86FC]/30 text-[#E0BBE4] hover:border-[#BB86FC]/70'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {setType !== 'Normal' && tempSubSets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-2 bg-[#1a0f2e]/70 rounded-lg border border-dashed border-[#BB86FC]/30">
            {tempSubSets.map((s, i) => (
              <div key={i} className="text-xs font-bold bg-[#BB86FC]/20 text-[#E0BBE4] px-2 py-1 rounded flex items-center border border-[#BB86FC]/50">
                {s.weight}kg×{s.reps} {s.rpe && <span className="ml-1 opacity-60">RPE:{s.rpe}</span>}
                <button type="button" onClick={() => setTempSubSets(tempSubSets.filter((_, idx) => idx !== i))} className="ml-2 text-[#FF77B4] hover:text-[#FF006E]"><X size={12}/></button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onFormSubmit} className="flex flex-col gap-3">
          <div className={`grid gap-2 ${setType === 'Normal' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-[#1a0f2e] border border-[#39FF14]/50 rounded-lg px-3 py-2.5 text-xs font-bold text-[#39FF14] outline-none focus:ring-2 focus:ring-[#39FF14]/50 appearance-none placeholder-[#39FF14]/30" placeholder="KG" />
            {setType === 'Normal' && (
              <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="bg-[#1a0f2e] border border-[#00D9FF]/50 rounded-lg px-3 py-2.5 text-xs font-bold text-[#00FFF0] outline-none focus:ring-2 focus:ring-[#00D9FF]/50 appearance-none placeholder-[#00D9FF]/30" placeholder="SET" />
            )}
            <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-[#1a0f2e] border border-[#FF006E]/50 rounded-lg px-3 py-2.5 text-xs font-bold text-[#FF77B4] outline-none focus:ring-2 focus:ring-[#FF006E]/50 appearance-none placeholder-[#FF006E]/30" placeholder="REP" />
            <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="bg-[#1a0f2e] border border-[#BB86FC]/50 rounded-lg px-3 py-2.5 text-xs font-bold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 appearance-none placeholder-[#BB86FC]/30" placeholder="RPE" />
          </div>
          
          {setType === 'Normal' ? (
            <button type="submit" disabled={!weight || !sets || !reps} className={`py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-[#39FF14] text-[#1a0f2e] shadow-[0_0_20px_rgba(57,255,20,0.5)]' : 'bg-[#FF006E] text-white disabled:opacity-30 hover:bg-[#FF0050] shadow-[0_0_20px_rgba(255,0,110,0.3)]'}`}>
              {showSuccess ? <CheckCircle size={16} /> : 'LOG IT'}
            </button>
          ) : (
            <div className="flex gap-2">
               <button type="submit" disabled={!weight || !reps} className="flex-1 py-3 px-3 rounded-lg text-xs font-bold tracking-widest uppercase bg-[#16213e] border border-[#BB86FC]/30 text-[#E0BBE4] hover:border-[#BB86FC]/70 active:scale-95 transition-all disabled:opacity-50">
                 ADD
               </button>
               <button type="button" onClick={handleSubmit} disabled={tempSubSets.length === 0} className={`flex-1 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex justify-center items-center active:scale-95 ${showSuccess ? 'bg-[#39FF14] text-[#1a0f2e]' : 'bg-[#FF006E] text-white disabled:opacity-30 hover:bg-[#FF0050]'}`}>
                 {showSuccess ? <CheckCircle size={16} /> : 'SAVE'}
               </button>
            </div>
          )}
        </form>
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center px-1 mb-4 gap-2 flex-wrap">
            <div className="flex gap-1 bg-[#16213e]/50 p-1 rounded-lg">
              <button onClick={() => { setShowHistory(true); setHistoryTab('list'); }} className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-widest transition-all ${showHistory && historyTab === 'list' ? 'bg-[#00D9FF]/30 border border-[#00D9FF]/70 text-[#00FFF0]' : 'text-[#BB86FC]/60 hover:text-[#E0BBE4]'}`}>LIST</button>
              <button onClick={() => { setShowHistory(true); setHistoryTab('chart'); }} className={`flex items-center px-3 py-1.5 rounded text-[10px] font-bold tracking-widest transition-all ${showHistory && historyTab === 'chart' ? 'bg-[#BB86FC]/30 border border-[#BB86FC]/70 text-[#E0BBE4]' : 'text-[#BB86FC]/60 hover:text-[#E0BBE4]'}`}>
                <BarChart2 size={11} className="mr-1"/> CHART
              </button>
            </div>
            <button onClick={handleGetProgressAdvice} disabled={isAiProgressLoading} className="text-[10px] font-bold tracking-widest uppercase text-[#39FF14] hover:bg-[#39FF14]/20 px-3 py-1.5 rounded-lg flex items-center active:scale-95 border border-[#39FF14]/50">
              {isAiProgressLoading ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <ZapIcon size={12} className="mr-1.5" />} 
              ANALYZE
            </button>
          </div>

          {showHistory && (
            <div className="animate-in slide-in-from-top-2 duration-300 bg-[#16213e]/40 p-3 rounded-lg border border-[#BB86FC]/20">
              {historyTab === 'chart' ? (
                <ChartView />
              ) : (
                <div className="space-y-3">
                  {groupedHistory.map((group, gIndex) => (
                    <div key={gIndex} className="space-y-2">
                      <div className="flex items-center gap-3 px-1 py-1">
                        <div className="h-px bg-[#BB86FC]/20 flex-1"></div>
                        <span className="text-[9px] font-bold tracking-widest text-[#BB86FC] bg-[#BB86FC]/10 px-2 py-0.5 rounded-full border border-[#BB86FC]/30">{group.date}</span>
                        <div className="h-px bg-[#BB86FC]/20 flex-1"></div>
                      </div>
                      
                      {group.logs.map((log) => (
                        <div key={log.id}>
                          {editingId === log.id ? (
                            <div className="bg-[#16213e]/60 p-3 rounded-lg border border-[#BB86FC]/30">
                              <div className="flex gap-2 mb-2">
                                 <input type="number" step="0.5" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="flex-1 bg-[#1a0f2e] border border-[#39FF14]/50 rounded px-2 py-2 text-xs font-bold text-[#39FF14] outline-none focus:ring-2 focus:ring-[#39FF14]/50 appearance-none" />
                                 <input type="number" value={editForm.sets} onChange={(e) => setEditForm({...editForm, sets: e.target.value})} className="flex-1 bg-[#1a0f2e] border border-[#00D9FF]/50 rounded px-2 py-2 text-xs font-bold text-[#00FFF0] outline-none focus:ring-2 focus:ring-[#00D9FF]/50 appearance-none" />
                                 <input type="number" value={editForm.reps} onChange={(e) => setEditForm({...editForm, reps: e.target.value})} className="flex-1 bg-[#1a0f2e] border border-[#FF006E]/50 rounded px-2 py-2 text-xs font-bold text-[#FF77B4] outline-none focus:ring-2 focus:ring-[#FF006E]/50 appearance-none" />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs font-bold text-[#BB86FC] hover:bg-[#BB86FC]/20 active:scale-95 transition-all">CANCEL</button>
                                <button onClick={() => saveEdit(log.id)} className="px-3 py-1.5 rounded text-xs font-bold bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50 hover:bg-[#39FF14]/30 active:scale-95 transition-all">SAVE</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex justify-between items-start bg-[#16213e]/40 border rounded-lg p-3 transition-all hover:border-[#FF006E]/50 ${log.isPR ? 'border-[#FF006E]/70 shadow-[0_0_15px_rgba(255,0,110,0.3)]' : 'border-[#BB86FC]/20'}`}>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-[#00FFF0] text-xs mb-2 flex items-center flex-wrap gap-1">
                                  {log.isPR && <Crown size={12} className="text-[#FF006E]" />}
                                  {log.subSets ? (
                                    log.subSets.map((sub, i) => (
                                      <React.Fragment key={i}>
                                        <span>{sub.weight}kg×{sub.reps} {sub.rpe && <span className="text-[9px] text-[#BB86FC]/60">RPE:{sub.rpe}</span>}</span>
                                        {i < log.subSets.length - 1 && <span className="text-[#39FF14] text-[10px]">→</span>}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <span>{log.weight}kg×{log.sets}×{log.reps}</span>
                                  )}
                                </div>
                                <div className="text-[9px] text-[#BB86FC]/60 flex items-center gap-2 flex-wrap">
                                  <Clock size={10} className="opacity-70"/> {log.time}
                                  {log.rpe && <span>RPE:{log.rpe}</span>}
                                  {log.setType && log.setType !== 'Normal' && (
                                    <span className="text-[8px] bg-[#16213e] text-[#BB86FC] px-1.5 py-0.5 rounded border border-[#BB86FC]/30">
                                      {log.setType}
                                    </span>
                                  )}
                                  <span className="text-[8px] bg-[#BB86FC]/20 text-[#E0BBE4] px-1.5 py-0.5 rounded border border-[#BB86FC]/50 ml-auto">
                                    1RM: {log.oneRepMax}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                {!log.subSets && (
                                  <button onClick={() => startEdit(log)} className="p-2 text-[#BB86FC] hover:bg-[#BB86FC]/20 rounded transition-all"><Edit2 size={12} /></button>
                                )}
                                <button onClick={() => onDeleteLog(log.id)} className="p-2 text-[#FF77B4] hover:bg-[#FF006E]/20 rounded transition-all"><Trash2 size={12} /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-gradient-to-b from-[#FF006E] to-[#BB86FC] p-1 rounded-2xl shadow-2xl animate-in zoom-in-95 bounce">
            <div className="bg-[#1a0f2e] w-full max-w-sm rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="w-16 h-16 bg-[#FF006E]/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-[#FF006E]">
                <Crown size={28} className="text-[#FF006E]" />
              </div>
              <h4 className="text-2xl font-black text-[#FF77B4] mb-2">NEW PR!</h4>
              <p className="text-xs text-[#BB86FC] font-medium leading-relaxed">INSANE! Your {exercise.name} just broke your all-time record. KEEP IT UP!</p>
            </div>
          </div>
        </div>
      )}
    </CyberpunkCard>
  );
};

// ========== MAIN APP ==========

export default function App() {
  const todaySplit = getTodaySplit();
  const [activeTab, setActiveTab] = useState(todaySplit === 'Rest' ? 'Push' : todaySplit);
  const [isDarkMode, setIsDarkMode] = useState(true); // Cyberpunk = always dark
  
  const [logs, setLogs] = useState(() => { const saved = localStorage.getItem('gym_logs_v11'); return saved ? JSON.parse(saved) : []; });
  const [exerciseData, setExerciseData] = useState(() => { const saved = localStorage.getItem('gym_exercises_v11'); return saved ? JSON.parse(saved) : INITIAL_EXERCISE_DATA; });
  const [healthData, setHealthData] = useState(() => { const saved = localStorage.getItem('gym_health_v2'); return saved ? JSON.parse(saved) : {}; });
  
  const [dailyNote, setDailyNote] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [restTime, setRestTime] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [preWorkoutAdvice, setPreWorkoutAdvice] = useState(null);
  const [isPreWorkoutLoading, setIsPreWorkoutLoading] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({ duration: '', cals: '', hr: '', sleep: '', spo2: '' });

  useEffect(() => {
    localStorage.setItem('gym_dark_pro', isDarkMode);
    document.documentElement.classList.add('dark');
  }, [isDarkMode]);

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
    const newHealthData = { ...healthData, [today]: {
       duration: parseInt(healthMetrics.duration) || 0,
       cals: parseInt(healthMetrics.cals) || 0,
       hr: parseInt(healthMetrics.hr) || 0,
       sleep: parseInt(healthMetrics.sleep) || 0,
       spo2: parseInt(healthMetrics.spo2) || 0,
    }};
    
    setHealthData(newHealthData);
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
      setConfirmDialog({ message: "Rest time is up! Ready for the next set? 🔥", onConfirm: () => setConfirmDialog(null), isAlert: true });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restTime]);

  const addTime = (secs) => { setRestTime(prev => prev + secs); setIsTimerRunning(true); };

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle: '', targetSets: '' });

  const [aiBannerData, setAiBannerData] = useState({ text: null, type: null }); 
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isRoastLoading, setIsRoastLoading] = useState(false);
  const [aiWarmup, setAiWarmup] = useState(null);
  const [isWarmupLoading, setIsWarmupLoading] = useState(false);

  const handleGetPreWorkoutBriefing = async () => {
    setIsPreWorkoutLoading(true);
    
    const recentLogs = logs.slice(0, 15).map(l => {
      const exName = (exerciseData[activeTab] || Object.values(exerciseData).flat()).find(e => e.id === l.exerciseId)?.name || l.exerciseId;
      return `${exName}: ${l.weight}kg x ${l.reps}`;
    }).join(', ');
    
    const allNotes = JSON.parse(localStorage.getItem('gym_notes_v12') || '{}');
    const recentNotesStr = Object.entries(allNotes).slice(-3).map(([k,v]) => `(${k}) ${v}`).join(' | ');

    const today = new Date().toLocaleDateString('id-ID');
    const todayHealth = healthData[today] || Object.values(healthData).pop() || {};
    const sleepInfo = todayHealth.sleep ? `\nLast night I slept ${Math.floor(todayHealth.sleep/60)}h ${todayHealth.sleep%60}m.` : '';

    const prompt = `I'm starting ${activeTab} day workout. Recent notes: [${recentNotesStr || 'No specific notes'}]. Recent lifts: [${recentLogs || 'No data'}]. ${sleepInfo} \n\nAs a pro coach, give a brief "Pre-Workout Briefing" (max 3 sentences). Analyze my condition/mood and sleep quality, then suggest strategy, intensity, or mental focus for ${activeTab} today.`;

    const response = await callGeminiAPI(prompt);
    setPreWorkoutAdvice(response || "Failed to connect with AI. Try again.");
    setIsPreWorkoutLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (logs.length === 0) return;
    setIsSummaryLoading(true);
    
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    
    const today = new Date().toLocaleDateString('id-ID');
    const todayHealth = healthData[today] || {};
    let healthContext = '';
    if (todayHealth.cals || todayHealth.hr) {
      healthContext = `\nSmartband metrics: Burned ${todayHealth.cals || 0} kcal, avg heart rate ${todayHealth.hr || 0} BPM.`;
    }

    const prompt = `I just trained: ${workoutData}. ${healthContext} \nGive praise and analytical evaluation like a pro coach. Comment on HR/calorie metrics if available.`;
    
    const response = await callGeminiAPI(prompt);
    setAiBannerData({ text: response, type: 'summary' }); setIsSummaryLoading(false);
  };

  const handleGenerateRoast = async () => {
    if (logs.length === 0) return;
    setIsRoastLoading(true);
    const workoutData = logs.slice(0, 5).map(l => `${(exerciseData[activeTab] || [])?.find(e => e.id === l.exerciseId)?.name || l.exerciseId} (${l.weight}kg)`).join(', ');
    const prompt = `You're a hardcore coach (like David Goggins). 'Roast' this workout volume: ${workoutData}. Sarcastic, spicy, max 3 sentences!`;
    const response = await callGeminiAPI(prompt, true);
    setAiBannerData({ text: response, type: 'roast' }); setIsRoastLoading(false);
  };

  const handleGenerateWarmup = async () => {
    setIsWarmupLoading(true);
    const muscles = (exerciseData[activeTab] || []).map(e => e.muscle).join(', ');
    const response = await callGeminiAPI(`${activeTab} day (muscles: ${muscles}). Give 3 scientific dynamic warmup moves.`);
    setAiWarmup(response); setIsWarmupLoading(false);
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
    setConfirmDialog({ message: "Delete this log permanently?", onConfirm: () => { setLogs(logs.filter(l => l.id !== id)); setConfirmDialog(null); }});
  };

  const handleEditLog = async (id, updatedData) => { setLogs(logs.map(log => log.id === id ? { ...log, ...updatedData } : log)); };
  
  const handleSaveCustom = async (e) => {
    e.preventDefault(); if (!newExercise.name) return;
    const item = { id: `c-${Date.now()}`, name: newExercise.name, muscle: newExercise.muscle || 'General', targetSets: newExercise.targetSets ? parseInt(newExercise.targetSets) : 3, videoId: null };
    setExerciseData(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), item] }));
    setIsAddingExercise(false); setNewExercise({ name: '', muscle: '', targetSets: '' });
  };
  
  const handleDeleteExercise = (tab, id) => { 
    setConfirmDialog({ message: "Delete this exercise from your routine permanently?", onConfirm: () => { setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).filter(ex => ex.id !== id) })); setConfirmDialog(null); }});
  };
  
  const handleEditExercise = async (tab, id, newName, newMuscle, newTargetSets, newVideoId) => { 
    setExerciseData(prev => ({ ...prev, [tab]: (prev[tab] || []).map(ex => ex.id === id ? { ...ex, name: newName, muscle: newMuscle, targetSets: newTargetSets, videoId: newVideoId } : ex) })); 
  };

  return (
    <div className="min-h-screen dark bg-gradient-to-b from-[#0a0a0a] via-[#1a0f2e] to-[#16213e] text-white selection:bg-[#FF006E]/30 overflow-x-hidden pb-24">
      
      {/* CYBERPUNK BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 bg-[#FF006E]/40"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 bg-[#00D9FF]/30"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#BB86FC]/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none"></div>
      </div>

      <div className="relative z-10">
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-40 border-b border-[#FF006E]/20 backdrop-blur-2xl px-4 sm:px-6 pt-4 pb-6 transition-all">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF006E] to-[#BB86FC] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,0,110,0.5)]">
                    <Dumbbell size={24} className="text-white transform -rotate-45" />
                  </div>
                  <h1 className="text-3xl font-black text-[#00FFF0] tracking-tighter">GYMTK</h1>
                </div>
                <p className="text-xs font-bold tracking-widest text-[#39FF14] flex items-center">
                  {getHariIndonesia().toUpperCase()} <span className="mx-2 text-[#BB86FC]">•</span> {todaySplit.toUpperCase()} MODE
                </p>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setShowTimerModal(true)} className="p-3 rounded-lg bg-[#16213e]/50 border border-[#00D9FF]/30 text-[#00FFF0] hover:border-[#00D9FF]/70 hover:bg-[#00D9FF]/20 transition-all relative" title="Rest Timer">
                  <Clock size={18} />
                  {restTime > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF006E] rounded-full animate-pulse"></span>}
                </button>
                <button onClick={() => setShowInsightsModal(true)} className="p-3 rounded-lg bg-[#16213e]/50 border border-[#BB86FC]/30 text-[#E0BBE4] hover:border-[#BB86FC]/70 hover:bg-[#BB86FC]/20 transition-all" title="Insights">
                  <Activity size={18} />
                </button>
              </div>
            </div>

            {/* SPLIT TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Push', 'Pull', 'Legs', 'Upper', 'Legs & Core'].map((t) => (
                <button 
                  key={t} onClick={() => setActiveTab(t)} 
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all duration-300 border ${activeTab === t ? 'bg-gradient-to-r from-[#FF006E] to-[#BB86FC] text-white border-[#FF006E] shadow-[0_0_20px_rgba(255,0,110,0.5)]' : 'bg-[#16213e]/40 text-[#BB86FC] border-[#BB86FC]/30 hover:border-[#BB86FC]/70'}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

          {/* ===== AI COACH HUB ===== */}
          <div className="space-y-4">
            <h2 className="text-xs font-black tracking-widest text-[#39FF14] uppercase flex items-center">
              <Bot size={16} className="mr-2" /> AI Coach Command Center
            </h2>

            {!preWorkoutAdvice && !isPreWorkoutLoading ? (
              <button onClick={handleGetPreWorkoutBriefing} className="w-full bg-gradient-to-r from-[#16213e]/50 to-[#1a0f2e]/50 border border-[#00D9FF]/30 hover:border-[#00D9FF]/70 text-[#00FFF0] p-4 rounded-lg flex items-center justify-between transition-all active:scale-95 group">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-[#00D9FF]" />
                  <span className="text-xs font-bold tracking-widest">PRE-WORKOUT BRIEFING</span>
                </div>
                <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : isPreWorkoutLoading ? (
              <div className="w-full bg-[#16213e]/50 border border-[#00D9FF]/30 p-4 rounded-lg flex items-center justify-center h-16">
                <Loader2 size={18} className="animate-spin text-[#00D9FF] mr-3" />
                <span className="text-xs font-bold text-[#00D9FF]">AI reviewing your stats...</span>
              </div>
            ) : (
              <CyberpunkCard neon="cyan">
                <button onClick={() => setPreWorkoutAdvice(null)} className="absolute top-3 right-3 p-1 text-[#BB86FC] hover:text-white transition-colors"><X size={14}/></button>
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={16} className="text-[#00FFF0]" />
                  <h4 className="text-xs font-black tracking-widest text-[#00FFF0]">BRIEFING FOR TODAY</h4>
                </div>
                <p className="text-xs text-[#E0BBE4] font-medium leading-relaxed">{preWorkoutAdvice}</p>
              </CyberpunkCard>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleGenerateWarmup} disabled={isWarmupLoading} className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-[#FF006E]/20 to-[#BB86FC]/20 border border-[#FF006E]/50 text-[#FF77B4] hover:border-[#FF006E]/70 transition-all active:scale-95 text-xs font-bold tracking-widest">
                {isWarmupLoading ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} />}
                WARMUP
              </button>
              <button onClick={handleGenerateRoast} disabled={isRoastLoading} className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-[#39FF14]/20 to-[#00D9FF]/20 border border-[#39FF14]/50 text-[#39FF14] hover:border-[#39FF14]/70 transition-all active:scale-95 text-xs font-bold tracking-widest">
                {isRoastLoading ? <Loader2 size={14} className="animate-spin" /> : <Skull size={14} />}
                ROAST ME
              </button>
            </div>

            {aiWarmup && (
              <CyberpunkCard neon="green">
                <button onClick={() => setAiWarmup(null)} className="absolute top-3 right-3 p-1 text-[#39FF14] hover:text-white transition-colors"><X size={14}/></button>
                <h4 className="text-xs font-black tracking-widest text-[#39FF14] mb-3 flex items-center">
                  <Flame size={14} className="mr-2"/> DYNAMIC WARMUP
                </h4>
                <p className="text-xs text-[#E0BBE4] font-medium whitespace-pre-wrap leading-relaxed">{aiWarmup}</p>
              </CyberpunkCard>
            )}
          </div>

          {/* ===== MUSCLE STATUS ===== */}
          <MuscleRecovery logs={logs} exerciseData={exerciseData} />

          {/* ===== WORKOUT SESSION BANNER ===== */}
          {logs.length > 0 && (
            <div className="bg-gradient-to-r from-[#1a0f2e]/60 via-[#16213e]/60 to-[#1a0f2e]/60 border border-[#BB86FC]/30 rounded-lg p-6 backdrop-blur-xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-black tracking-widest text-[#E0BBE4] flex items-center">
                  <Sparkles size={16} className="mr-2 text-[#BB86FC]" /> SESSION ANALYSIS
                </h3>
                <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="px-3 py-1.5 rounded text-xs font-bold tracking-widest bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50 hover:bg-[#39FF14]/30 active:scale-95 transition-all flex items-center">
                  {isSummaryLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                  EVALUATE
                </button>
              </div>
              
              {aiBannerData.text ? (
                <div className="bg-[#16213e]/50 p-4 rounded-lg border border-[#BB86FC]/20">
                  <p className="text-xs leading-relaxed font-medium text-[#E0BBE4] animate-in slide-in-from-bottom-2">{aiBannerData.text}</p>
                </div>
              ) : (
                <p className="text-xs text-[#BB86FC]/60 font-medium">Log all your sets, then request AI evaluation.</p>
              )}
            </div>
          )}

          {/* ===== EXERCISE CARDS ===== */}
          <div>
            <h2 className="text-xs font-black tracking-widest text-[#39FF14] uppercase mb-4 flex items-center">
              <Target size={16} className="mr-2" /> Exercises
            </h2>
            <div className="space-y-4">
              {(exerciseData[activeTab] || []).map(ex => (
                <ExerciseCard 
                  key={ex.id} exercise={ex} activeTab={activeTab} 
                  onLog={handleAddLog} onDeleteLog={onDeleteLog} onEditLog={handleEditLog}
                  onDeleteExercise={handleDeleteExercise} onEditExercise={handleEditExercise} 
                  history={logs.filter(l => l.exerciseId === ex.id)} 
                />
              ))}
            </div>
          </div>

          {/* ===== ADD CUSTOM EXERCISE ===== */}
          {isAddingExercise ? (
            <CyberpunkCard neon="purple">
              <h3 className="font-black mb-4 text-sm text-[#E0BBE4] tracking-tight flex items-center"><PlusCircle size={18} className="mr-2 text-[#BB86FC]"/> CUSTOM EXERCISE</h3>
              <form onSubmit={handleSaveCustom} className="space-y-3">
                <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Exercise Name" className="w-full bg-[#1a0f2e] border border-[#BB86FC]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 placeholder-[#BB86FC]/30" autoFocus/>
                <div className="flex gap-2">
                  <input type="text" value={newExercise.muscle} onChange={e => setNewExercise({...newExercise, muscle: e.target.value})} placeholder="Target Muscle" className="flex-1 bg-[#1a0f2e] border border-[#BB86FC]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 placeholder-[#BB86FC]/30"/>
                  <input type="number" value={newExercise.targetSets} onChange={e => setNewExercise({...newExercise, targetSets: e.target.value})} placeholder="Sets" className="w-20 bg-[#1a0f2e] border border-[#BB86FC]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 placeholder-[#BB86FC]/30"/>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsAddingExercise(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-[#16213e] border border-[#BB86FC]/30 text-[#E0BBE4] text-xs font-bold tracking-widest hover:border-[#BB86FC]/70 active:scale-95">CANCEL</button>
                  <button type="submit" disabled={!newExercise.name} className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#39FF14] to-[#00D9FF] text-[#1a0f2e] text-xs font-bold tracking-widest disabled:opacity-30 active:scale-95 transition-all">ADD</button>
                </div>
              </form>
            </CyberpunkCard>
          ) : (
            <button 
              onClick={() => setIsAddingExercise(true)} 
              className="w-full py-4 border-2 border-dashed border-[#BB86FC]/50 text-[#BB86FC] rounded-lg flex items-center justify-center hover:border-[#BB86FC]/70 hover:bg-[#BB86FC]/10 transition-all text-xs font-bold tracking-widest active:scale-95 group"
            >
              <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
              ADD CUSTOM EXERCISE
            </button>
          )}

          {/* ===== END SESSION ===== */}
          <button 
             onClick={() => setShowEndSessionModal(true)}
             className="w-full py-4 bg-gradient-to-r from-[#39FF14] to-[#00D9FF] text-[#1a0f2e] rounded-lg font-black text-xs tracking-widest shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:shadow-[0_0_50px_rgba(57,255,20,0.6)] active:scale-95 transition-all flex items-center justify-center"
          >
             <CheckSquare size={18} className="mr-2" /> END WORKOUT SESSION
          </button>

          {/* ===== DAILY JOURNAL ===== */}
          <CyberpunkCard neon="purple">
            <h4 className="text-xs font-black tracking-widest text-[#E0BBE4] mb-3 flex items-center"><PenTool size={14} className="mr-2 text-[#BB86FC]"/> DAILY JOURNAL</h4>
            <textarea 
              value={dailyNote}
              onChange={(e) => handleSaveNote(e.target.value)}
              placeholder="Note your condition, energy level, form issues..."
              className="w-full bg-[#1a0f2e] border border-[#BB86FC]/30 rounded-lg p-3 text-xs text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 min-h-[80px] resize-none placeholder-[#BB86FC]/30 leading-relaxed font-medium"
            />
          </CyberpunkCard>

        </main>
      </div>

      {/* ===== MODALS ===== */}

      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <CyberpunkCard neon="cyan" className="w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-[#00FFF0] tracking-widest flex items-center"><Timer size={18} className="mr-2" /> REST TIMER</h4>
              <button onClick={() => setShowTimerModal(false)} className="p-2 hover:bg-[#BB86FC]/20 rounded-lg transition-all"><X size={16}/></button>
            </div>
            <div className="text-center mb-8">
              <span className={`text-5xl font-black tabular-nums tracking-tighter ${restTime === 0 ? 'text-[#BB86FC]/50' : 'text-[#39FF14]'}`}>
                {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
               <button onClick={() => addTime(30)} className="py-2.5 bg-[#16213e] border border-[#39FF14]/50 rounded-lg text-[10px] font-bold text-[#39FF14] hover:border-[#39FF14]/70 hover:bg-[#39FF14]/10 active:scale-95 transition-all">+30s</button>
               <button onClick={() => addTime(60)} className="py-2.5 bg-[#16213e] border border-[#39FF14]/50 rounded-lg text-[10px] font-bold text-[#39FF14] hover:border-[#39FF14]/70 hover:bg-[#39FF14]/10 active:scale-95 transition-all">+60s</button>
               <button onClick={() => addTime(90)} className="py-2.5 bg-[#16213e] border border-[#39FF14]/50 rounded-lg text-[10px] font-bold text-[#39FF14] hover:border-[#39FF14]/70 hover:bg-[#39FF14]/10 active:scale-95 transition-all">+90s</button>
               <button onClick={() => { setRestTime(0); setIsTimerRunning(false); }} className="py-2.5 bg-[#FF006E]/20 border border-[#FF006E]/50 rounded-lg text-[10px] font-bold text-[#FF77B4] hover:border-[#FF006E]/70 active:scale-95 transition-all">RESET</button>
            </div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} disabled={restTime === 0} className={`w-full py-3.5 rounded-lg text-sm font-bold tracking-widest flex justify-center items-center active:scale-95 transition-all ${isTimerRunning ? 'bg-gradient-to-r from-[#FF006E] to-[#BB86FC] text-white shadow-[0_0_20px_rgba(255,0,110,0.5)]' : 'bg-[#39FF14] text-[#1a0f2e] disabled:opacity-40 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]'}`}>
              {isTimerRunning ? <><Pause size={18} className="mr-2" /> PAUSE</> : <><Play size={18} className="mr-2" /> START</>}
            </button>
          </CyberpunkCard>
        </div>
      )}

      {showEndSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <CyberpunkCard neon="green" className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-[#39FF14] tracking-widest flex items-center"><CheckSquare size={18} className="mr-2" /> END WORKOUT</h4>
              <button onClick={() => setShowEndSessionModal(false)} className="p-2 hover:bg-[#BB86FC]/20 rounded-lg transition-all"><X size={16}/></button>
            </div>
            
            <p className="text-[11px] text-[#BB86FC] mb-4 font-medium bg-[#16213e]/50 p-3 rounded-lg border border-[#BB86FC]/20">
              Leave blank if using Apple Health shortcuts. Fill manually if on Android.
            </p>

            <form onSubmit={handleSaveHealthMetrics} className="space-y-3">
              <input type="number" value={healthMetrics.duration} onChange={(e) => setHealthMetrics({...healthMetrics, duration: e.target.value})} className="w-full bg-[#1a0f2e] border border-[#39FF14]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#39FF14] outline-none focus:ring-2 focus:ring-[#39FF14]/50 placeholder-[#39FF14]/30" placeholder="Duration (Minutes)" />
              <input type="number" value={healthMetrics.cals} onChange={(e) => setHealthMetrics({...healthMetrics, cals: e.target.value})} className="w-full bg-[#1a0f2e] border border-[#FF006E]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#FF77B4] outline-none focus:ring-2 focus:ring-[#FF006E]/50 placeholder-[#FF006E]/30" placeholder="Calories Burned (Kcal)" />
              <input type="number" value={healthMetrics.hr} onChange={(e) => setHealthMetrics({...healthMetrics, hr: e.target.value})} className="w-full bg-[#1a0f2e] border border-[#FF006E]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#FF77B4] outline-none focus:ring-2 focus:ring-[#FF006E]/50 placeholder-[#FF006E]/30" placeholder="Avg Heart Rate (BPM)" />
              <input type="number" value={healthMetrics.sleep} onChange={(e) => setHealthMetrics({...healthMetrics, sleep: e.target.value})} className="w-full bg-[#1a0f2e] border border-[#00D9FF]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#00FFF0] outline-none focus:ring-2 focus:ring-[#00D9FF]/50 placeholder-[#00D9FF]/30" placeholder="Sleep Last Night (Minutes)" />
              <input type="number" step="0.1" value={healthMetrics.spo2} onChange={(e) => setHealthMetrics({...healthMetrics, spo2: e.target.value})} className="w-full bg-[#1a0f2e] border border-[#BB86FC]/50 rounded-lg px-4 py-2.5 text-xs font-bold text-[#E0BBE4] outline-none focus:ring-2 focus:ring-[#BB86FC]/50 placeholder-[#BB86FC]/30" placeholder="SpO2 Blood Oxygen (%)" />
              
              <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-[#39FF14] to-[#00D9FF] text-[#1a0f2e] rounded-lg font-black text-xs tracking-widest active:scale-95 transition-all">
                SAVE METRICS
              </button>
            </form>
          </CyberpunkCard>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <CyberpunkCard neon="pink" className="w-full max-w-sm">
            <h4 className="text-sm font-black text-[#FF77B4] mb-3 tracking-tight">{confirmDialog.isAlert ? 'ALERT' : 'CONFIRM'}</h4>
            <p className="text-xs text-[#E0BBE4] mb-6 font-medium leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2">
              {!confirmDialog.isAlert && (
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-2.5 bg-[#16213e] border border-[#BB86FC]/30 text-[#E0BBE4] rounded-lg font-bold text-xs tracking-widest hover:border-[#BB86FC]/70 active:scale-95 transition-all">CANCEL</button>
              )}
              <button onClick={confirmDialog.onConfirm} className={`flex-1 py-2.5 rounded-lg font-bold text-xs tracking-widest active:scale-95 transition-all ${confirmDialog.isAlert ? 'bg-[#39FF14] text-[#1a0f2e]' : 'bg-[#FF006E] text-white hover:bg-[#FF0050]'}`}>
                {confirmDialog.isAlert ? 'OK' : 'DELETE'}
              </button>
            </div>
          </CyberpunkCard>
        </div>
      )}

      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <CyberpunkCard neon="cyan" className="w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-[#00FFF0] tracking-widest"><Activity size={16} className="inline mr-2"/> INSIGHTS</h4>
              <button onClick={() => setShowInsightsModal(false)} className="p-2 hover:bg-[#00D9FF]/20 rounded-lg"><X size={16}/></button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-[#39FF14] tracking-widest mb-3">CONSISTENCY HEATMAP</h3>
                {logs.length === 0 ? (
                  <p className="text-xs text-[#BB86FC]/60 italic">No workouts logged yet.</p>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({length: 35}).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (34 - i));
                      const dateStr = d.toLocaleDateString('id-ID');
                      const isActive = logs.some(l => l.date === dateStr);
                      return (
                        <div key={i} className={`aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${isActive ? 'bg-[#39FF14] text-[#1a0f2e] shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-[#16213e] text-[#BB86FC]/60'}`}>
                          {d.getDate()}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-black text-[#FF77B4] tracking-widest mb-3">WEEKLY VOLUME</h3>
                <p className="text-[10px] text-[#BB86FC]/60 mb-2">Target: 10-20 Sets Per Muscle</p>
                {/* Simplified volume display */}
                <div className="text-[11px] text-[#E0BBE4]">
                  {logs.length > 0 ? `${logs.length} sets logged this week` : 'No data yet'}
                </div>
              </div>
            </div>
          </CyberpunkCard>
        </div>
      )}

      {restTime > 0 && !showTimerModal && (
        <button onClick={() => setShowTimerModal(true)} className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#FF006E] to-[#BB86FC] text-white px-5 py-3.5 rounded-full shadow-[0_0_30px_rgba(255,0,110,0.5)] flex items-center gap-3 animate-in slide-in-from-bottom-5 hover:scale-105 transition-transform font-black text-sm tracking-widest border border-[#FF006E]">
           <Timer size={18} className="animate-pulse" />
           {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2, '0')}
        </button>
      )}

    </div>
  );
}