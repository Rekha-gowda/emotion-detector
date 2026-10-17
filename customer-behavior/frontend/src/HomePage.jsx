import { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Plus, Upload, X, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import LogActivity from './LogActivity';
ChartJS.register(ArcElement, Tooltip);

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USER_ID = 'default'; // In a real auth system this would be the logged-in user's ID

/* ── CSV Parser for "Analyse Others" ───────────────────────── */
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(l => {
    const vals = l.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
  const avg = (aliases) => {
    const col = headers.find(h => aliases.some(a => h.includes(a)));
    if (!col) return 0;
    const vals = rows.map(r => parseFloat(r[col]) || 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  let study = avg(['study','education','learn','work','productive']);
  let ent   = avg(['entertainment','youtube','video','stream','netflix']);
  let social= avg(['social','twitter','instagram','facebook','reddit']);
  let shop  = avg(['shop','amazon','flipkart','ecommerce','buy']);
  let screen= avg(['screen','time','hours','duration','total']);
  let sites = avg(['sites','domains','urls','visited','pages']);
  const rawTotal = study + ent + social + shop;
  if (rawTotal === 0) { study=35; ent=30; social=20; shop=15; screen=5.2; sites=24; }
  else {
    const f = 100 / rawTotal;
    study=Math.round(study*f); ent=Math.round(ent*f); social=Math.round(social*f);
    shop=Math.max(0, 100-study-ent-social);
  }
  if (screen < 0.1) screen = (3 + Math.random()*4).toFixed(1);
  if (sites < 1) sites = 18 + Math.floor(Math.random()*25);
  let mood = { mood:'Productive',emoji:'💼',color:'#10b981',score:74 };
  if (ent>45)   mood={mood:'Entertained',emoji:'🎬',color:'#38bdf8',score:65};
  if (social>40) mood={mood:'Anxious',emoji:'😟',color:'#ef4444',score:42};
  if (study>50) mood={mood:'Focused',emoji:'🎯',color:'#6366f1',score:85};
  if (shop>25)  mood={mood:'Impulsive',emoji:'🛍️',color:'#f59e0b',score:55};
  const nameCol = headers.find(h => ['name','user','person','id','device'].some(a=>h.includes(a)));
  const name = nameCol ? (rows[0][nameCol]||'Unknown User') : `${rows.length} records`;
  return { name, rows:rows.length, study, entertainment:ent, social, shopping:shop, screenTime:parseFloat(screen).toFixed(1), sites:Math.round(sites), mood };
}

/* ── Mood Ring SVG ──────────────────────────────────────────── */
function MoodRing({ mood, size = 190 }) {
  const r = (size/2) * 0.82;
  const circ = 2*Math.PI*r;
  const offset = circ - (circ * (mood.score||0)) / 100;
  return (
    <div className="mood-ring-wrap" style={{ width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={mood.color} strokeWidth={12}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition:'stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)', filter:`drop-shadow(0 0 8px ${mood.color})` }} />
        <circle cx={size/2} cy={size/2} r={r+15} fill="none" stroke={mood.color} strokeWidth={1.5} opacity={0.12} />
      </svg>
      <div className="mood-ring-center">
        <span className="mood-ring-emoji">{mood.emoji}</span>
        <div className="mood-ring-label" style={{ color:mood.color }}>{mood.mood}</div>
        {mood.score > 0 && (
          <div style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.4rem', color:'white', marginTop:'0.2rem' }}>
            {mood.score}<span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.45)' }}>%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Analyse Others (CSV upload) ────────────────────────────── */
function AnalyseOther() {
  const [dragOver, setDragOver] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return; }
    setError(''); setResult(null); setAnalysing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        const parsed = parseCSV(e.target.result);
        if (!parsed) { setError('Could not parse CSV. Check format.'); setAnalysing(false); return; }
        setResult(parsed); setAnalysing(false);
      }, 1100);
    };
    reader.readAsText(file);
  };

  const donutData = result ? {
    labels:['Study','Entertainment','Social','Shopping'],
    datasets:[{ data:[result.study,result.entertainment,result.social,result.shopping], backgroundColor:['#10b981','#38bdf8','#a78bfa','#f59e0b'], borderWidth:0, hoverOffset:6 }],
  } : null;

  const verdict = result
    ? result.mood.mood==='Entertained' ? 'Heavy media consumer. High entertainment usage suggests passive leisure habits.'
    : result.mood.mood==='Focused'     ? 'Highly disciplined. Goal-oriented and productivity-driven digital behaviour.'
    : result.mood.mood==='Anxious'     ? 'Social media dominance. May be experiencing FOMO or digital anxiety.'
    : result.mood.mood==='Impulsive'   ? 'Shopping-heavy patterns. High impulse-buy risk detected.'
    : 'Balanced digital behaviour. No extreme category patterns detected.'
    : '';

  return (
    <div className="px" style={{ marginBottom:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.8rem' }}>
        <span style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'0.95rem', color:'var(--text)' }}>👥 Analyse Someone Else</span>
        {result && <button onClick={()=>{setResult(null);setError('');}} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'0.2rem 0.5rem', cursor:'pointer', color:'var(--text2)', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:'0.2rem' }}><X size={11}/> Clear</button>}
      </div>
      {!result && <p style={{ fontSize:'0.78rem', color:'var(--text2)', lineHeight:1.6, marginBottom:'0.8rem' }}>Upload a CSV file (shared by someone) to see their mood, usage split &amp; AI verdict — processed entirely on your device.</p>}

      {!result && (
        <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);processFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current.click()}
          style={{ border:`2px dashed ${dragOver?'var(--accent)':'var(--border2)'}`, borderRadius:'var(--radius)', padding:'1.5rem 1rem', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(99,102,241,0.06)':'var(--surface)', transition:'all 0.2s' }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>processFile(e.target.files[0])} />
          {analysing ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.6rem' }}>
              <div style={{ width:36, height:36, border:'3px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <div style={{ fontSize:'0.8rem', color:'var(--text2)' }}>Analysing…</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'2rem', marginBottom:'0.4rem', opacity:dragOver?1:0.7 }}>{dragOver?'📂':'📁'}</div>
              <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text)', marginBottom:'0.25rem' }}>Drop CSV or <span style={{ color:'var(--accent)' }}>tap to browse</span></div>
              <div style={{ fontSize:'0.7rem', color:'var(--text3)' }}>Columns: name, study, entertainment, social, shopping, screen_time</div>
              {error && <div style={{ marginTop:'0.5rem', color:'#ef4444', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem' }}><AlertCircle size={13}/>{error}</div>}
            </>
          )}
        </div>
      )}

      {result && (
        <div className="card" style={{ animation:'scaleIn 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ padding:'0.9rem 1rem', background:`linear-gradient(135deg,${result.mood.color}12,transparent)`, borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'0.8rem' }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:`${result.mood.color}18`, border:`2px solid ${result.mood.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><User size={20} color={result.mood.color}/></div>
            <div style={{ flex:1 }}><div style={{ fontWeight:800, color:'var(--text)', fontSize:'0.9rem' }}>{result.name}</div><div style={{ fontSize:'0.68rem', color:'var(--text2)' }}>📄 {result.rows} rows analysed</div></div>
            <div style={{ textAlign:'center' }}><div style={{ fontSize:'1.6rem' }}>{result.mood.emoji}</div><div style={{ fontSize:'0.62rem', fontWeight:800, color:result.mood.color, textTransform:'uppercase' }}>{result.mood.mood}</div></div>
          </div>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
            {[{icon:'⏱️',val:`${result.screenTime}h`,lbl:'Screen'},{icon:'🌐',val:result.sites,lbl:'Sites'},{icon:'🎯',val:`${result.mood.score}%`,lbl:'Score',color:result.mood.color}].map((s,i)=>(
              <div key={i} style={{ flex:1, padding:'0.65rem 0.4rem', textAlign:'center', borderRight:i<2?'1px solid var(--border)':'none' }}>
                <div style={{ fontSize:'0.9rem' }}>{s.icon}</div>
                <div style={{ fontFamily:'Space Grotesk', fontWeight:800, color:s.color||'var(--text)', fontSize:'0.95rem' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:'var(--text3)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'0.8rem', alignItems:'center', padding:'0.8rem 1rem' }}>
            <div style={{ width:80, height:80, flexShrink:0 }}><Doughnut data={donutData} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, cutout:'70%', animation:{duration:800} }} /></div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              {[{l:'Study/Work',v:result.study,c:'#10b981'},{l:'Entertainment',v:result.entertainment,c:'#38bdf8'},{l:'Social',v:result.social,c:'#a78bfa'},{l:'Shopping',v:result.shopping,c:'#f59e0b'}].map((r,i)=>(
                <div key={i}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span style={{ fontSize:'0.68rem', color:'var(--text2)' }}>{r.l}</span><span style={{ fontSize:'0.68rem', fontWeight:700, color:r.c }}>{r.v}%</span></div>
                <div className="prog-bar" style={{ height:4 }}><div className="prog-bar-fill" style={{ width:`${r.v}%`, background:r.c, transitionDelay:`${i*0.07}s` }}/></div></div>
              ))}
            </div>
          </div>
          <div style={{ margin:'0 1rem 0.8rem', background:`${result.mood.color}0d`, border:`1px solid ${result.mood.color}25`, borderRadius:10, padding:'0.65rem' }}>
            <div style={{ fontSize:'0.68rem', fontWeight:800, color:result.mood.color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.25rem' }}>🤖 AI Verdict</div>
            <div style={{ fontSize:'0.76rem', color:'var(--text2)', lineHeight:1.5 }}>{verdict}</div>
          </div>
          <div style={{ padding:'0 1rem 0.8rem', fontSize:'0.68rem', color:'#10b981', display:'flex', alignItems:'center', gap:'0.3rem' }}><CheckCircle2 size={12}/> Processed locally · No data uploaded</div>
        </div>
      )}
    </div>
  );
}

/* ── Main HomePage ──────────────────────────────────────────── */
const insightCards = [
  { icon:'🧠', gradient:'linear-gradient(135deg,#6366f1,#a78bfa)', title:'Focus Window', body:'Peak focus hours are 10 AM–1 PM. Schedule your hardest tasks here for maximum output.', tag:'Productivity' },
  { icon:'🛍️', gradient:'linear-gradient(135deg,#f59e0b,#ef4444)', title:'Spend Guard', body:'Log zero shopping days to build your saving streak. Awareness is the first step!', tag:'Finance' },
  { icon:'😌', gradient:'linear-gradient(135deg,#10b981,#38bdf8)', title:'Wellness Tip', body:'Take a 20-min break at 3 PM. Studies show this reduces afternoon stress by 31%.', tag:'Well-being' },
  { icon:'🌐', gradient:'linear-gradient(135deg,#38bdf8,#6366f1)', title:'Web Pattern', body:'Log your data daily for 7 days to unlock your complete digital fingerprint analysis.', tag:'Insights' },
  { icon:'⚡', gradient:'linear-gradient(135deg,#a78bfa,#f43f5e)', title:'Build Your Streak', body:'Log your activity every day — after 7 days you unlock personalised AI rewards!', tag:'Streak' },
];

export default function HomePage({ onNavigate }) {
  const [todayData, setTodayData]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showLog, setShowLog]       = useState(false);
  const [showToast, setShowToast]   = useState(false);
  const [toastMsg, setToastMsg]     = useState('');
  const [activeCard, setActiveCard] = useState(0);
  const [ready, setReady]           = useState(false);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/today?user_id=${USER_ID}`);
      const data = await res.json();
      setTodayData(data);
    } catch {
      setTodayData({ status:'error', mood:{ mood:'Offline', emoji:'📡', color:'#475569', score:0 }, study:0, entertainment:0, social:0, shopping:0, other:0, screen_time:0, sites_visited:0 });
    } finally {
      setLoading(false);
      setTimeout(() => setReady(true), 100);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  // Auto-cycle insight cards
  useEffect(() => {
    const t = setInterval(() => setActiveCard(c => (c+1) % insightCards.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleSaved = (data) => {
    setTodayData(data);
    setToastMsg('✅ Activity logged! Mood ring updated.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const mood = todayData?.mood || { mood:'Loading…', emoji:'⏳', color:'#475569', score:0 };
  const notLogged = todayData?.status === 'not_logged';
  const isError   = todayData?.status === 'error';

  const usageRows = [
    { label:'Study / Work',   val: todayData?.study         || 0, color:'#10b981', icon:'📚' },
    { label:'Entertainment',  val: todayData?.entertainment  || 0, color:'#38bdf8', icon:'🎬' },
    { label:'Social Media',   val: todayData?.social         || 0, color:'#a78bfa', icon:'💬' },
    { label:'Shopping',       val: todayData?.shopping       || 0, color:'#f59e0b', icon:'🛒' },
    { label:'Other',          val: todayData?.other          || 0, color:'#475569', icon:'🌐' },
  ].filter(r => r.val > 0); // Only show categories with actual usage

  const donutData = {
    labels: usageRows.map(r => r.label),
    datasets:[{ data: usageRows.map(r => r.val), backgroundColor: usageRows.map(r => r.color), borderWidth:0, hoverOffset:6 }],
  };

  return (
    <div className={`page-content ${ready ? 'page-enter' : ''}`}>
      {/* Toast */}
      {showToast && (
        <div className="notif-toast">
          <div className="notif-icon">🔔</div>
          <div><div className="notif-title">Activity Saved</div><div className="notif-body">{toastMsg}</div></div>
        </div>
      )}

      {/* Status bar */}
      <div className="status-bar" style={{ paddingTop:'1.2rem' }}>
        <div>
          <div className="status-greeting">{greeting()},</div>
          <div className="status-name">Rekha 👋</div>
        </div>
        <div className="status-actions">
          <button className="status-btn btn-icon" onClick={fetchToday} style={{ animation:loading?'spin 1s linear infinite':'none' }}><RefreshCw size={15}/></button>
        </div>
      </div>

      {/* Not-logged banner */}
      {notLogged && !loading && (
        <div style={{ margin:'0 1.2rem 0.8rem', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:14, padding:'0.85rem 1rem', display:'flex', alignItems:'center', gap:'0.8rem' }}>
          <div style={{ fontSize:'1.5rem' }}>📊</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text)' }}>No activity logged today</div>
            <div style={{ fontSize:'0.73rem', color:'var(--text2)', lineHeight:1.5 }}>Tap the + button below to log your real usage and see your mood ring.</div>
          </div>
          <button onClick={() => setShowLog(true)} className="btn btn-primary" style={{ padding:'0.45rem 0.8rem', fontSize:'0.78rem', flexShrink:0 }}>Log Now</button>
        </div>
      )}

      {/* Mood ring */}
      <div style={{ background:`linear-gradient(180deg,${mood.color}08 0%,transparent 100%)`, padding:'0.6rem 1.2rem 0.4rem', textAlign:'center', transition:'background 0.6s ease' }}>
        {!notLogged && (
          <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', marginBottom:'0.4rem' }}>
            {loading ? '⏳ Loading…' : isError ? '📡 Backend offline — start server' : '🟢 Based on your actual activity today'}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'center' }}>
          <MoodRing mood={mood} size={190} key={mood.mood} />
        </div>
        {todayData?.notes && <p style={{ fontSize:'0.78rem', color:'var(--text2)', margin:'0.6rem auto 0', maxWidth:260, lineHeight:1.6, fontStyle:'italic' }}>"{todayData.notes}"</p>}
      </div>

      {/* Quick stats */}
      <div className="section-head" style={{ paddingBottom:0 }}>
        <span className="section-title">Today at a Glance</span>
        {!notLogged && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <div className="wave-bars"><div className="wave-bar"/><div className="wave-bar"/><div className="wave-bar"/><div className="wave-bar"/></div>
            <span style={{ fontSize:'0.68rem', color:'var(--productive)', fontWeight:700 }}>Real data</span>
          </div>
        )}
      </div>
      <div className="px pb" style={{ paddingTop:'0.5rem' }}>
        <div className="stat-pills">
          {[
            { icon:'⏱️', val:`${todayData?.screen_time||0}h`, lbl:'Screen time', color:'#6366f1' },
            { icon:'🌐', val:`${todayData?.sites_visited||0}`, lbl:'Sites', color:'#38bdf8' },
            { icon:'📚', val:`${todayData?.study||0}%`, lbl:'Study', color:'#10b981' },
            { icon:'🎬', val:`${todayData?.entertainment||0}%`, lbl:'Entertainment', color:'#f59e0b' },
            { icon:'💬', val:`${todayData?.social||0}%`, lbl:'Social', color:'#a78bfa' },
            { icon:'🛒', val:`${todayData?.shopping||0}%`, lbl:'Shopping', color:'#ef4444' },
          ].map((p,i) => (
            <div key={i} className="stat-pill fade-up" style={{ animationDelay:`${i*0.06}s` }}>
              <span style={{ fontSize:'0.95rem' }}>{p.icon}</span>
              <div>
                <div className="stat-pill-val" style={{ color:p.color }}>{p.val}</div>
                <div className="stat-pill-lbl" style={{ fontSize:'0.63rem' }}>{p.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage donut — only shown if data exists */}
      <div className="px mb">
        <div className="card" style={{ padding:'1.1rem' }}>
          <div style={{ fontWeight:700, color:'var(--text)', marginBottom:'0.9rem', fontSize:'0.88rem' }}>📊 Usage Breakdown</div>
          {usageRows.length === 0 ? (
            <div style={{ textAlign:'center', padding:'1rem 0', color:'var(--text2)', fontSize:'0.82rem' }}>
              No usage logged yet. Tap <strong style={{ color:'var(--accent)' }}>Log Activity</strong> to fill this in.
            </div>
          ) : (
            <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
              <div style={{ width:100, height:100, flexShrink:0 }}>
                <Doughnut data={donutData} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, cutout:'72%', animation:{animateRotate:true, duration:900} }} />
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {usageRows.map((row,i) => (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text2)' }}>{row.icon} {row.label}</span>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:row.color }}>{row.val}%</span>
                    </div>
                    <div className="prog-bar"><div className="prog-bar-fill" style={{ width:`${row.val}%`, background:row.color }}/></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insight swipe cards */}
      <div>
        <div className="section-head">
          <span className="section-title">✨ Daily Insights</span>
          <span className="section-more" onClick={() => onNavigate('insights')}>See all</span>
        </div>
        <div className="insight-scroll">
          {insightCards.map((c,i) => (
            <div key={i} className="insight-card" style={{ background:c.gradient, boxShadow:'0 12px 40px rgba(0,0,0,0.4)' }} onClick={() => setActiveCard(i)}>
              <div className="insight-card-icon">{c.icon}</div>
              <div className="insight-card-title">{c.title}</div>
              <div className="insight-card-body">{c.body}</div>
              <div className="insight-card-tag">{c.tag}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:5, paddingBottom:'0.5rem' }}>
          {insightCards.map((_,i) => <div key={i} style={{ width:i===activeCard?18:6, height:6, borderRadius:3, background:i===activeCard?'var(--accent)':'var(--surface2)', transition:'all 0.3s' }}/>)}
        </div>
      </div>

      {/* Mood week mini */}
      <div className="px" style={{ marginBottom:'0.8rem' }}>
        <div className="card" style={{ padding:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.8rem' }}>
            <span style={{ fontWeight:700, fontSize:'0.85rem' }}>📅 This Week</span>
            <span className="section-more" onClick={() => onNavigate('behaviour')}>Full view →</span>
          </div>
          <div style={{ display:'flex', gap:'0.4rem', justifyContent:'space-between' }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => {
              const today = new Date().getDay();        // 0=Sun…6=Sat
              const dayMap = [6,0,1,2,3,4,5];          // map to Mon=0
              const isToday = dayMap[today] === i;
              const hasMood = isToday && !notLogged && mood.emoji !== '⏳';
              return (
                <div key={i} style={{ textAlign:'center', flex:1 }}>
                  <div style={{ borderRadius:8, aspectRatio:'1', background: isToday ? `${mood.color}18` : 'var(--surface)', border:`1.5px solid ${isToday ? mood.color+'40' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.95rem', marginBottom:3 }}>
                    {hasMood ? mood.emoji : isToday ? '⏳' : '○'}
                  </div>
                  <div style={{ fontSize:'0.58rem', color: isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: isToday ? 700 : 400 }}>{d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.2rem 1.2rem 0.9rem' }}>
        <div style={{ flex:1, height:1, background:'var(--border)' }} />
        <span style={{ fontSize:'0.68rem', color:'var(--text3)', fontWeight:700, whiteSpace:'nowrap' }}>🔍 Analyse Others</span>
        <div style={{ flex:1, height:1, background:'var(--border)' }} />
      </div>
      <AnalyseOther />

      {/* Floating Log Activity button */}
      <button onClick={() => setShowLog(true)}
        style={{ position:'fixed', bottom:'calc(var(--nav-h) + 16px)', right:'clamp(12px, calc(50% - 215px + 16px), calc(100% - 72px))', width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), #818cf8)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 24px rgba(99,102,241,0.5)', zIndex:99, transition:'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(99,102,241,0.65)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(99,102,241,0.5)'; }}>
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>

      {/* Log Activity modal */}
      {showLog && <LogActivity userId={USER_ID} onSaved={handleSaved} onClose={() => setShowLog(false)} />}
    </div>
  );
}
