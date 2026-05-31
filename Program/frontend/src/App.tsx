import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import { Activity, Zap, AlertTriangle, Wind, Droplets, Thermometer, ShieldCheck, Power, Settings, Flame } from 'lucide-react';
import GaugeComponent from 'react-gauge-component';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import PltuModel from './components/PltuModel';

// Inisiasi koneksi ke Backend Python (Port 5000)
const socket = io('http://localhost:5000');

/* ─────────────────────────────────────────────
   DATA DUMMY AWAL (Akan digantikan data real-time)
   ───────────────────────────────────────────── */
const initialMwData = Array(15).fill({ val: 0 });
const coolingData = [
  { flow: 34000 }, { flow: 34500 }, { flow: 35000 }, { flow: 35200 },
  { flow: 35000 }, { flow: 34800 }, { flow: 35000 }
];

/* ─────────────────────────────────────────────
   KOMPONEN KNOB INTERAKTIF
   ───────────────────────────────────────────── */
function Knob({ label, value, onChange, color = '#00f0ff', size = 72 }: { label: string, value: number, onChange: (val: number) => void, color?: string, size?: number }) {
  const angle = -135 + (value / 100) * 270;
  return (
    <div className="flex flex-col items-center gap-1 relative">
      <div
        className="relative flex items-center justify-center transition-transform hover:scale-105 rounded-md"
        style={{
          width: size, height: size,
          background: 'radial-gradient(circle at 40% 30%, #1e293b, #020617)',
          border: `2px solid #334155`,
          boxShadow: `0 0 10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1)`,
          borderRadius: '50%' // Knob tetap butuh bulat untuk UX putar
        }}
      >
        <svg viewBox="0 0 72 72" className="absolute inset-0 w-full h-full pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (-135 + i * 27) * (Math.PI / 180);
            const active = i <= Math.round(value / 10);
            return (
              <line
                key={i}
                x1={36 + 32 * Math.cos(a)} y1={36 + 32 * Math.sin(a)}
                x2={36 + 28 * Math.cos(a)} y2={36 + 28 * Math.sin(a)}
                stroke={active ? color : '#334155'}
                strokeWidth={active ? 2 : 1.5}
                style={{ filter: active ? `drop-shadow(0 0 3px ${color})` : 'none' }}
              />
            );
          })}
        </svg>
        <div
          className="absolute w-1 origin-bottom pointer-events-none rounded-md"
          style={{
            height: '36%', bottom: '50%', left: 'calc(50% - 2px)',
            background: color, boxShadow: `0 0 8px ${color}`,
            transform: `rotate(${angle}deg)`, transition: 'transform 0.1s ease-out',
          }}
        />
        <div className="w-3 h-3 bg-slate-700 border border-slate-500 z-10 pointer-events-none rounded-md" />
      </div>
      
      {/* Invisible Slider untuk interaksi drag mouse */}
      <input 
        type="range" min="0" max="100" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute top-0 left-0 w-full cursor-pointer opacity-0"
        style={{ height: size }}
      />

      <span className="font-mono text-sm font-bold" style={{ color, textShadow: `0 0 8px ${color}` }}>{value}%</span>
      <span className="text-[10px] text-gray-400 font-bold tracking-widest">{label}</span>
    </div>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-[#00f0ff] font-mono text-xl font-bold bg-slate-950/80 backdrop-blur-md px-6 py-3 rounded-md border border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
        SYSTEM BOOTING... {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

export default function App() {
  // --- STATE KONTROL ---
  const [isAuto, setIsAuto] = useState(false);
  const [fuelFeed, setFuelFeed] = useState(190);
  const [steamValve, setSteamValve] = useState(76);
  const [waterInlet, setWaterInlet] = useState(80);
  const [airFlow, setAirFlow] = useState(86);
  const [targetMw, setTargetMw] = useState(300);

  // --- STATE DATA SENSOR (DARI BACKEND) ---
  const [simData, setSimData] = useState({
    mw_out: 0.0,
    steam_press: 0.0,
    boiler_temp: 30.0,
    steam_flow: 0.0,
    water_level: 0.0,
    health: 100.0,
    is_tripped: false,
    alarms: [] as string[]
  });

  const [mwHistory, setMwHistory] = useState(initialMwData);

  // --- EFEK 1: MENDENGARKAN DATA DARI PYTHON ---
  useEffect(() => {
    socket.on('sim_update', (data) => {
      setSimData(data);
      
      // Update grafik area MW (maksimal 15 titik data terakhir)
      setMwHistory(prev => {
        const newHistory = [...prev, { val: data.mw_out }];
        if (newHistory.length > 15) newHistory.shift(); 
        return newHistory;
      });

      // Jika mode AUTO aktif, sinkronkan nilai UI agar slider bergerak sendiri
      if (isAuto && data.current_fuel !== undefined) {
        setFuelFeed(data.current_fuel);
        setSteamValve(data.current_valve);
      }
    });

    return () => {
      socket.off('sim_update');
    };
  }, [isAuto]);

  // --- EFEK 2: MENGIRIM DATA KONTROL KE PYTHON ---
  useEffect(() => {
    socket.emit('control_update', {
      fuel_feed: fuelFeed,
      steam_valve: steamValve,
      water_inlet: waterInlet,
      air_flow: airFlow,
      is_auto: isAuto,
      target_mw: targetMw
    });
  }, [fuelFeed, steamValve, waterInlet, airFlow, isAuto, targetMw]);

  const handleSystemCommand = (command: string) => {
    socket.emit('system_command', command);
  };

  const panelStyle = {
    background: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
  };

  const sectionStyle = {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none bg-[url('/bg.png')] bg-cover bg-center">
      
      <div className="absolute inset-0 bg-slate-950/60 z-0 pointer-events-none" />

      {/* ── NAVIGASI ATAS ────────────────────────────── */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center justify-between w-[500px] bg-slate-900/40 backdrop-blur-md border border-slate-600/40 rounded-md p-1 shadow-2xl">
        <button className="flex-1 py-2 text-gray-400 font-bold tracking-widest text-xs hover:text-white transition rounded-md">DATA</button>
        <button className="flex-1 py-3 bg-blue-900/60 border border-[#00f0ff]/50 text-[#00f0ff] font-bold tracking-widest text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-md">SIMULATION</button>
        <button className="flex-1 py-2 text-gray-400 font-bold tracking-widest text-xs hover:text-white transition rounded-md">ANALYTIC</button>
      </div>

      {/* ══════════════════════════════════════════
          PANEL KIRI — SYSTEM MONITORING
      ══════════════════════════════════════════ */}
      <div className="absolute top-8 left-6 bottom-[100px] w-[420px] rounded-md p-5 flex flex-col gap-4 z-10 pointer-events-auto text-white overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={panelStyle}>
        
        <h2 className="text-center font-bold tracking-[0.2em] text-sm text-gray-200 border-b border-slate-600/50 pb-3">SYSTEM MONITORING</h2>

        <div className="rounded-md p-4 flex flex-col" style={sectionStyle}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold tracking-widest text-gray-400">TOTAL OUTPUT (MW)</span>
            <span className="font-mono font-black text-3xl" style={{ color: '#00f0ff', textShadow: '0 0 15px rgba(0,240,255,0.6)' }}>
              {simData.mw_out.toFixed(1)}
            </span>
          </div>
          <div className="w-full h-[50px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mwHistory}>
                <defs>
                  <linearGradient id="colorMw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorMw)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md p-3 pb-0 flex flex-col items-center overflow-hidden" style={{ ...sectionStyle, filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.1))' }}>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">STEAM PRESS</span>
              <GaugeComponent
                type="semicircle"
                arc={{ colorArray: ['#00f0ff', '#ff003c'], padding: 0.02, width: 0.15 }}
                pointer={{ type: "needle", color: '#ffffff', animationDelay: 0, length: 0.8 }}
                labels={{ valueLabel: { matchColorWithArc: true, formatTextValue: () => '' }, tickLabels: { hideMinMax: true } }}
                value={Math.min(100, (simData.steam_press / 200) * 100)} 
                style={{ width: '100%', marginBottom: '-25px' }}
              />
            </div>

            <div className="rounded-md p-3 pb-0 flex flex-col items-center overflow-hidden" style={{ ...sectionStyle, filter: 'drop-shadow(0 0 10px rgba(255,0,60,0.1))' }}>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">BOILER TEMP</span>
              <GaugeComponent
                type="semicircle"
                arc={{ colorArray: ['#00f0ff', '#ff003c'], padding: 0.02, width: 0.15 }}
                pointer={{ type: "needle", color: '#ffffff', animationDelay: 0, length: 0.8 }}
                labels={{ valueLabel: { matchColorWithArc: true, formatTextValue: () => '' }, tickLabels: { hideMinMax: true } }}
                value={Math.min(100, (simData.boiler_temp / 600) * 100)} 
                style={{ width: '100%', marginBottom: '-25px' }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md p-2 flex justify-center items-end gap-1" style={sectionStyle}>
              <span className="font-mono text-2xl font-bold text-[#00f0ff] drop-shadow-[0_0_8px_#00f0ff]">
                {simData.steam_press.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] font-bold text-[#00f0ff] pb-1">Bar</span>
            </div>
            <div className="rounded-md p-2 flex justify-center items-end gap-1" style={sectionStyle}>
              <span className="font-mono text-2xl font-bold text-[#ff003c] drop-shadow-[0_0_8px_#ff003c]">
                {simData.boiler_temp.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] font-bold text-[#ff003c] pb-1">°C</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 h-full min-h-[140px]">
          <div className="flex-[3] rounded-md p-3 flex flex-col" style={sectionStyle}>
            <span className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">COOLING FLOW</span>
            <div className="flex-1 w-full min-h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coolingData}>
                   <defs>
                    <linearGradient id="colorCooling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="flow" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCooling)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center text-[11px] font-mono mt-1 font-bold">
              <span className="text-blue-400 drop-shadow-md">
                {(waterInlet * 440).toLocaleString()} m³/h
              </span>
            </div>
          </div>

          <div className="flex-[3] rounded-md p-3 flex flex-col" style={sectionStyle}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold tracking-widest text-gray-400">DRUM WATER LEVEL (%)</span>
              <span className={`text-xs font-mono font-bold ${simData.water_level > 80 || simData.water_level < 45 ? 'text-red-400 animate-pulse' : 'text-[#00f0ff]'}`}>
                {simData.water_level.toFixed(1)}%
              </span>
            </div>

            {/* Animasi Tangki Air Visual */}
            <div className="flex-1 w-full relative border border-slate-600 bg-slate-900 rounded-md overflow-hidden shadow-inner">
              {/* Garis Batas Fatal High (90%) */}
              <div className="absolute w-full border-t border-red-500/50 border-dashed z-10" style={{ bottom: '90%' }} />
              {/* Garis Target Optimal (72%) */}
              <div className="absolute w-full border-t border-green-400/80 border-dashed z-10" style={{ bottom: '72%' }} />
              {/* Garis Batas Fatal Low (15%) */}
              <div className="absolute w-full border-t border-red-500/50 border-dashed z-10" style={{ bottom: '15%' }} />
              
              {/* Air di dalam drum */}
              <div 
                className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${
                  simData.water_level > 80 ? 'bg-red-500/80' : 
                  simData.water_level < 45 ? 'bg-yellow-500/80' : 
                  'bg-blue-500/80'
                }`}
                style={{ height: `${Math.min(100, Math.max(0, simData.water_level))}%`, boxShadow: '0 -4px 10px rgba(0,0,0,0.5)' }}
              />
            </div>
            
            <div className="flex justify-between text-[9px] font-mono mt-1 text-gray-500">
              <span>TRIP: 15%</span>
              <span className="text-green-400">TARGET: 72%</span>
              <span>TRIP: 90%</span>
            </div>
          </div>

          <div className="flex-[2] rounded-md p-3 flex flex-col" style={sectionStyle}>
            <span className="text-[10px] font-bold tracking-widest text-gray-400 mb-2 text-center">STATUS</span>
            <div className="grid grid-cols-3 gap-2 justify-items-center mt-1">
              <Activity className={`w-5 h-5 ${simData.is_tripped ? 'text-red-500' : 'text-[#00f0ff] drop-shadow-[0_0_5px_#00f0ff]'}`} />
              <ShieldCheck className={`w-5 h-5 ${simData.health < 50 ? 'text-yellow-500' : 'text-[#00f0ff] drop-shadow-[0_0_5px_#00f0ff]'}`} />
              <Wind className={`w-5 h-5 ${simData.steam_flow > 10 ? 'text-[#00f0ff] animate-spin-slow drop-shadow-[0_0_5px_#00f0ff]' : 'text-slate-600'}`} />
              <Droplets className="w-5 h-5 text-[#00f0ff]" />
              <Power className={`w-5 h-5 ${simData.mw_out > 0 ? 'text-[#00f0ff]' : 'text-slate-600'}`} />
              <Thermometer className={`w-5 h-5 ${simData.boiler_temp > 550 ? 'text-red-500 animate-pulse' : 'text-yellow-400 drop-shadow-[0_0_5px_#facc15]'}`} />
              <AlertTriangle className={`w-5 h-5 ${simData.alarms.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
              <Settings className="w-5 h-5 text-slate-500" />
              <Flame className={`w-5 h-5 ${fuelFeed > 0 ? 'text-[#ff003c] drop-shadow-[0_0_5px_#ff003c] animate-pulse' : 'text-slate-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL KANAN — CONTROL PANEL
      ══════════════════════════════════════════ */}
      <div className="absolute top-8 right-6 bottom-[100px] w-[380px] rounded-md p-5 flex flex-col gap-5 z-10 pointer-events-auto text-white overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={panelStyle}>
        
        <h2 className="text-center font-bold tracking-[0.2em] text-sm text-gray-200 border-b border-slate-600/50 pb-3">CONTROL PANEL</h2>

        <div className="flex items-center p-1 rounded-md" style={sectionStyle}>
          <button onClick={() => setIsAuto(false)} className={`flex-1 rounded-md py-2.5 font-bold tracking-widest text-[10px] transition-all duration-300 ${!isAuto ? 'bg-blue-600/80 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/50' : 'text-gray-400 hover:text-white'}`}>MANUAL</button>
          <button onClick={() => setIsAuto(true)} className={`flex-1 rounded-md py-2.5 font-bold tracking-widest text-[10px] transition-all duration-300 ${isAuto ? 'bg-purple-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400/50' : 'text-gray-400 hover:text-white'}`}>AUTO (AI)</button>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-md p-3" style={sectionStyle}>
          <button onClick={() => handleSystemCommand('START')} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-md bg-green-500/10 border border-green-500/50 hover:bg-green-500/30 transition active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
            <Power className="w-5 h-5 text-green-400 drop-shadow-[0_0_5px_#4ade80]" />
            <span className="text-[9px] font-bold tracking-wider text-green-400">START</span>
          </button>
          <button onClick={() => handleSystemCommand('STOP')} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-md bg-yellow-500/10 border border-yellow-500/50 hover:bg-yellow-500/30 transition active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
            <AlertTriangle className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_5px_#facc15]" />
            <span className="text-[9px] font-bold tracking-wider text-yellow-400">STOP</span>
          </button>
          <button onClick={() => handleSystemCommand('ESTOP')} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-md bg-red-600/20 border border-red-500/60 hover:bg-red-600/40 transition active:scale-95 shadow-[0_0_15px_rgba(255,0,60,0.4)]">
            <Activity className="w-5 h-5 text-[#ff003c] drop-shadow-[0_0_8px_#ff003c]" />
            <span className="text-[9px] font-bold tracking-wider text-red-100">E-STOP</span>
          </button>
        </div>

        {isAuto ? (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-3 rounded-md p-5" style={{ ...sectionStyle, border: '1px solid rgba(147,51,234,0.3)', background: 'rgba(30,41,59,0.7)' }}>
              <span className="text-[10px] font-bold tracking-widest text-purple-300 text-center">AI TARGET LOAD (MW)</span>
              
              <div className="flex gap-2 w-full">
                <input 
                  type="number" 
                  value={targetMw} 
                  onChange={(e) => setTargetMw(Number(e.target.value))}
                  className="w-3/4 bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-[#00f0ff] font-mono font-bold text-2xl text-center outline-none focus:border-purple-500 transition-colors" 
                />
                <button className="w-1/4 bg-purple-600/80 hover:bg-purple-500 border border-purple-400 text-white font-bold text-[10px] tracking-widest rounded-md transition-all shadow-[0_0_15px_rgba(147,51,234,0.5)] active:scale-95">
                  DEPLOY
                </button>
              </div>

              <div className="border-t border-slate-600/50 mt-2 pt-4">
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-500 text-gray-300 font-bold text-[10px] tracking-widest rounded-md transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  IDLE (MAINTAIN CONSTANT)
                </button>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                AI Agent Active • Overriding Manual Controls
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 rounded-md p-4" style={sectionStyle}>
              <Knob label="WATER INLET" value={waterInlet} onChange={setWaterInlet} color="#00f0ff" size={80} />
              <Knob label="AIR FLOW" value={airFlow} onChange={setAirFlow} color="#a855f7" size={80} />
            </div>

            <div className="rounded-md px-4 py-4 flex flex-col gap-2" style={sectionStyle}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-widest text-gray-400">STEAM VALVE</span>
                <span className="font-mono text-sm font-bold text-[#00f0ff] drop-shadow-[0_0_5px_#00f0ff]">{steamValve.toFixed(1)}%</span>
              </div>
              <div className="relative mt-1">
                <input 
                  type="range" min="0" max="100" value={steamValve} 
                  onChange={e => setSteamValve(Number(e.target.value))} 
                  className="w-full cursor-pointer h-1.5 bg-slate-700 rounded-md appearance-none" 
                  style={{ accentColor: '#00f0ff' }}
                />
              </div>
            </div>

            <div className="rounded-md p-4 flex flex-col gap-3" style={sectionStyle}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-widest text-gray-400">FUEL FEED</span>
                <div className="flex items-center gap-2 bg-slate-900 rounded-md p-1 border border-slate-700 shadow-inner">
                   <button onClick={() => setFuelFeed(f => Math.max(0, f - 5))} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-gray-300 font-bold active:scale-95 transition">-</button>
                   <span className="text-sm font-mono font-bold text-[#ff003c] drop-shadow-[0_0_5px_#ff003c] w-14 text-center">{fuelFeed.toFixed(1)} t/h</span>
                   <button onClick={() => setFuelFeed(f => Math.min(220, f + 5))} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-gray-300 font-bold active:scale-95 transition">+</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          PANEL BAWAH (SYSTEM STATUS BAR)
      ══════════════════════════════════════════ */}
      <div className="absolute bottom-6 left-[460px] right-[420px] min-w-[300px] h-[72px] rounded-md p-4 flex items-center gap-6 z-10 pointer-events-auto text-white" style={panelStyle}>
        <div className="flex-1 border-r border-slate-600/50 flex flex-col justify-center pl-2">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-[11px] tracking-widest text-gray-400">SYSTEM STATUS:</h3>
            <span className={`${simData.is_tripped ? 'text-red-500' : simData.is_running ? 'text-green-400' : 'text-gray-400'} text-xs font-bold tracking-widest flex items-center gap-2`}>
              <span className={`w-2.5 h-2.5 rounded-md ${simData.is_tripped ? 'bg-red-500' : simData.is_running ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`}></span>
              {simData.is_tripped ? 'TRIPPED' : simData.is_running ? 'OPERATIONAL' : 'STANDBY'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono tracking-wide mt-1">
            Health {simData.health}% &nbsp;|&nbsp; {simData.mw_out > 0 ? 'Grid Synced' : 'Disconnected'}
          </p>
        </div>
        
        <div className="flex-[1.5] flex flex-col justify-center">
          <h3 className="text-[10px] font-bold tracking-widest text-gray-500 mb-1">NOTIFICATIONS:</h3>
          {simData.alarms.length > 0 ? (
            simData.alarms.map((alarm, idx) => (
              <p key={idx} className="text-[10px] font-mono text-red-400 mb-0.5">[{new Date().toLocaleTimeString()}] {alarm}</p>
            ))
          ) : (
            <>
              <p className="text-[10px] font-mono text-gray-300 mb-0.5">[{new Date().toLocaleTimeString()}] Steam valve adjusted. Target load stable.</p>
              <p className="text-[10px] font-mono text-gray-400">[{new Date().toLocaleTimeString()}] System running smoothly.</p>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          LAYER 0: 3D CANVAS R3F
      ══════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [90, 60, 90], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[20, 30, 20]} intensity={2.5} color="#ffffff" />
          <pointLight position={[-20, 20, -20]} intensity={1.5} color="#00f0ff" />
          
          <Environment preset="city" />
          
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            autoRotate={true} 
            autoRotateSpeed={3} 
            maxPolarAngle={Math.PI / 2 - 0.02}
            minDistance={30}
            maxDistance={400}
          />
          
          <Suspense fallback={<Loader />}>
            <PltuModel />
          </Suspense>
        </Canvas>
      </div>

    </div>
  );
}