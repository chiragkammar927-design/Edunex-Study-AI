import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Zap,
  RotateCcw,
  Sparkles,
  Trophy,
  Sliders,
  CheckCircle2,
  Activity,
  Gauge,
  Info,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface VirtualLabProps {
  onAddXP: (xp: number) => void;
}

export const VirtualLab: React.FC<VirtualLabProps> = ({ onAddXP }) => {
  const [activeLab, setActiveLab] = useState<'circuits' | 'projectile'>('circuits');

  // --- Simulation 1: Circuits & Ohm's Law ---
  const [voltage, setVoltage] = useState<number>(12); // Volts
  const [resistance, setResistance] = useState<number>(24); // Ohms
  const current = Number((voltage / resistance).toFixed(3)); // Amps (I = V/R)
  const power = Number((voltage * current).toFixed(2)); // Watts (P = V * I)

  // Challenge: Achieve target current between 0.45A and 0.55A
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  useEffect(() => {
    if (!challengeCompleted && current >= 0.48 && current <= 0.52) {
      setChallengeCompleted(true);
      triggerCelebration();
      onAddXP(50);
    }
  }, [current, challengeCompleted, onAddXP]);

  // --- Simulation 2: Projectile Motion Canvas ---
  const [angle, setAngle] = useState<number>(45); // degrees
  const [velocity, setVelocity] = useState<number>(30); // m/s
  const [gravity, setGravity] = useState<number>(9.8); // m/s^2 (Earth default)

  const rad = (angle * Math.PI) / 180;
  const timeOfFlight = Number(((2 * velocity * Math.sin(rad)) / gravity).toFixed(2));
  const maxHeight = Number(((Math.pow(velocity * Math.sin(rad), 2)) / (2 * gravity)).toFixed(2));
  const range = Number(((Math.pow(velocity, 2) * Math.sin(2 * rad)) / gravity).toFixed(2));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw projectile arc
  useEffect(() => {
    if (activeLab !== 'projectile') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
    }
    for (let y = 20; y < height - 25; y += 30) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ground line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height - 25);
    ctx.lineTo(width, height - 25);
    ctx.stroke();

    // Scale factors
    const maxViewRange = Math.max(120, range * 1.2);
    const maxViewHeight = Math.max(50, maxHeight * 1.4);
    const scaleX = (width - 60) / maxViewRange;
    const scaleY = (height - 50) / maxViewHeight;

    const startX = 40;
    const startY = height - 25;

    // Draw Parabolic Trajectory
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);

    for (let t = 0; t <= timeOfFlight; t += 0.05) {
      const x = velocity * Math.cos(rad) * t;
      const y = velocity * Math.sin(rad) * t - 0.5 * gravity * t * t;
      const canvasX = startX + x * scaleX;
      const canvasY = startY - y * scaleY;

      if (t === 0) {
        ctx.moveTo(canvasX, canvasY);
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Peak marker
    const peakX = startX + (range / 2) * scaleX;
    const peakY = startY - maxHeight * scaleY;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Landing marker
    const landX = startX + range * scaleX;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(landX, startY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cannon / Launcher
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + 25 * Math.cos(rad), startY - 25 * Math.sin(rad));
    ctx.stroke();
  }, [activeLab, angle, velocity, gravity, range, maxHeight, timeOfFlight, rad]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-cyan-100">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />
              <span>Interactive STEM Simulations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Virtual Science Lab 🧪
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed">
              Interact with real physical constants, tweak voltages, calculate trajectories, and build conceptual intuition by doing.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/20">
            <button
              onClick={() => {
                setActiveLab('circuits');
                soundFX.playPop();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeLab === 'circuits'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Ohm's Law & Circuit</span>
            </button>
            <button
              onClick={() => {
                setActiveLab('projectile');
                soundFX.playPop();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeLab === 'projectile'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
              <span>Projectile Kinematics</span>
            </button>
          </div>
        </div>
      </div>

      {/* LAB 1: OHM'S LAW */}
      {activeLab === 'circuits' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5: Interactive Sliders & Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Circuit Parameters
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                  V = I × R
                </span>
              </div>

              {/* Voltage Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Battery Potential (Voltage, V)</span>
                  </label>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                    {voltage} V
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.5"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 V (Weak Cell)</span>
                  <span>12 V (Car Battery)</span>
                  <span>24 V (High Power)</span>
                </div>
              </div>

              {/* Resistance Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Filament Resistance (R)</span>
                  </label>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                    {resistance} Ω
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  step="1"
                  value={resistance}
                  onChange={(e) => setResistance(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>2 Ω (Near Short)</span>
                  <span>50 Ω (Medium)</span>
                  <span>100 Ω (High Resistor)</span>
                </div>
              </div>

              {/* Quick Reset */}
              <button
                onClick={() => {
                  setVoltage(12);
                  setResistance(24);
                  soundFX.playPop();
                }}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Standard 12V / 24Ω</span>
              </button>
            </div>

            {/* In-Lab Challenge Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                challengeCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wide">
                  {challengeCompleted ? 'Challenge Cleared! (+50 XP)' : 'Lab Challenge'}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {challengeCompleted
                  ? 'Great job! You balanced Voltage and Resistance to achieve exactly ~0.50A current.'
                  : 'Adjust Voltage & Resistance so the circuit current reads between 0.48A and 0.52A.'}
              </p>
            </div>
          </div>

          {/* Right 7: Visual Circuit Schematic & Live Telemetry */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-white space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Real-Time Circuit Visualizer</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Speed: {(current * 10).toFixed(1)}x electron velocity
                </span>
              </div>

              {/* Animated Schematic SVG */}
              <div className="relative h-64 w-full flex items-center justify-center bg-slate-950 rounded-2xl p-4 border border-slate-800">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Circuit Wire Loop */}
                  <rect
                    x="50"
                    y="30"
                    width="300"
                    height="140"
                    rx="12"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="4"
                  />

                  {/* Battery (Left side) */}
                  <g transform="translate(50, 100)">
                    <rect x="-16" y="-24" width="32" height="48" rx="6" fill="#1e293b" stroke="#e11d48" strokeWidth="2" />
                    <text x="0" y="-4" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">+</text>
                    <text x="0" y="16" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">-</text>
                    <text x="-24" y="5" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="end">{voltage}V</text>
                  </g>

                  {/* Lightbulb (Right side) */}
                  <g transform="translate(350, 100)">
                    {/* Glow aura scales with power */}
                    <circle
                      cx="0"
                      cy="0"
                      r={Math.min(45, 12 + power * 1.5)}
                      fill="#fef08a"
                      opacity={Math.min(0.85, 0.15 + (power / 30))}
                      className="transition-all duration-300"
                    />
                    <circle cx="0" cy="0" r="18" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                    {/* Filament */}
                    <path d="M-6 6 L-2 -6 L2 6 L6 -6" fill="none" stroke="#78350f" strokeWidth="2" />
                    <text x="26" y="5" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="start">{resistance}Ω</text>
                  </g>

                  {/* Animated Electron dots */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <circle
                      key={i}
                      r="4"
                      fill="#38bdf8"
                      className="animate-pulse"
                      cx={
                        i < 3
                          ? 50 + ((i + 1) * 75)
                          : i === 3
                          ? 350
                          : i < 7
                          ? 350 - ((i - 3) * 75)
                          : 50
                      }
                      cy={
                        i < 3
                          ? 30
                          : i === 3
                          ? 60
                          : i < 7
                          ? 170
                          : 130
                      }
                    />
                  ))}
                </svg>
              </div>

              {/* Digital Multimeter Readout Gauges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Calculated Current (I)</p>
                  <p className="text-xl font-black text-cyan-400 font-mono mt-0.5">
                    {current} <span className="text-xs">A</span>
                  </p>
                  <p className="text-[10px] text-slate-400">I = V / R</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Electric Power (P)</p>
                  <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    {power} <span className="text-xs">W</span>
                  </p>
                  <p className="text-[10px] text-slate-400">P = V × I</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Bulb Luminosity</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {Math.min(100, Math.round((power / 24) * 100))}%
                  </p>
                  <p className="text-[10px] text-slate-400">Relative Lumens</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAB 2: PROJECTILE KINEMATICS */}
      {activeLab === 'projectile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5: Angle, Velocity, Planet Gravity Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Launch Physics Settings
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300">
                  2D Kinematics
                </span>
              </div>

              {/* Angle Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Launch Angle (θ)
                  </label>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                    {angle}°
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="85"
                  step="1"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>10° (Flat)</span>
                  <span>45° (Maximum Range on Flat)</span>
                  <span>85° (Vertical Lob)</span>
                </div>
              </div>

              {/* Velocity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial Velocity (v₀)
                  </label>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                    {velocity} m/s
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="1"
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Gravity / Celestial Environment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Gravitational Field (g)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Earth', g: 9.8, icon: '🌍' },
                    { name: 'Moon', g: 1.6, icon: '🌕' },
                    { name: 'Mars', g: 3.7, icon: '🔴' },
                  ].map((planet) => (
                    <button
                      key={planet.name}
                      onClick={() => {
                        setGravity(planet.g);
                        soundFX.playPop();
                      }}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        gravity === planet.g
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-black'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-base">{planet.icon}</span>
                      <span className="text-xs">{planet.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{planet.g} m/s²</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right 7: Canvas trajectory & Real-time formulas */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Parabolic Trajectory Plotter
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  g = {gravity} m/s²
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={240}
                  className="w-full h-56 block"
                />
              </div>

              {/* Kinematic Telemetry */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Horizontal Range (R)</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {range} <span className="text-xs">m</span>
                  </p>
                  <p className="text-[10px] text-slate-400">R = v₀²sin(2θ)/g</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Max Height (H)</p>
                  <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    {maxHeight} <span className="text-xs">m</span>
                  </p>
                  <p className="text-[10px] text-slate-400">H = v₀²sin²θ/2g</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Flight Time (t)</p>
                  <p className="text-xl font-black text-cyan-400 font-mono mt-0.5">
                    {timeOfFlight} <span className="text-xs">s</span>
                  </p>
                  <p className="text-[10px] text-slate-400">t = 2v₀sinθ/g</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
