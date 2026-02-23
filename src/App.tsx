import { useState, useEffect, useRef, useCallback } from 'react';
import './styles.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
}

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  pulsePhase: number;
  driftX: number;
  driftY: number;
}

function App() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const particleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize floating orbs
  useEffect(() => {
    const initialOrbs: Orb[] = Array.from({ length: 7 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 80 + Math.random() * 120,
      hue: 180 + Math.random() * 60,
      pulsePhase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.02,
      driftY: (Math.random() - 0.5) * 0.02,
    }));
    setOrbs(initialOrbs);
  }, []);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 0.02) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animate orbs
  useEffect(() => {
    const interval = setInterval(() => {
      setOrbs(prev => prev.map(orb => ({
        ...orb,
        x: ((orb.x + orb.driftX + 100) % 100),
        y: ((orb.y + orb.driftY + 100) % 100),
        pulsePhase: (orb.pulsePhase + 0.03) % (Math.PI * 2),
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Particle physics
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1,
          vx: p.vx * 0.99,
          life: p.life - 1,
        }))
        .filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const createParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = Array.from({ length: 3 }, () => {
      particleIdRef.current += 1;
      return {
        id: particleIdRef.current,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        size: 4 + Math.random() * 12,
        hue: 160 + Math.random() * 80,
        life: 60 + Math.random() * 40,
        maxLife: 100,
      };
    });
    setParticles(prev => [...prev.slice(-100), ...newParticles]);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setMousePos({ x, y });
    if (isInteracting) {
      createParticles(x, y);
    }
  }, [isInteracting, createParticles]);

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleStart = () => setIsInteracting(true);
  const handleEnd = () => setIsInteracting(false);

  return (
    <div
      ref={containerRef}
      className="app-container"
      onMouseMove={handleMouseMove}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
    >
      {/* Gradient mesh background */}
      <div className="gradient-mesh" />

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Floating orbs */}
      {orbs.map(orb => {
        const scale = 1 + Math.sin(orb.pulsePhase) * 0.15;
        const opacity = 0.3 + Math.sin(orb.pulsePhase) * 0.15;
        return (
          <div
            key={orb.id}
            className="floating-orb"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: orb.size * scale,
              height: orb.size * scale,
              background: `radial-gradient(circle, hsla(${orb.hue}, 80%, 60%, ${opacity}) 0%, transparent 70%)`,
            }}
          />
        );
      })}

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size * (p.life / p.maxLife),
            height: p.size * (p.life / p.maxLife),
            background: `radial-gradient(circle, hsla(${p.hue}, 90%, 70%, ${p.life / p.maxLife}) 0%, transparent 70%)`,
            boxShadow: `0 0 ${p.size}px hsla(${p.hue}, 90%, 60%, ${p.life / p.maxLife * 0.5})`,
          }}
        />
      ))}

      {/* Cursor glow */}
      <div
        className="cursor-glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          transform: `translate(-50%, -50%) scale(${isInteracting ? 1.5 : 1})`,
          opacity: isInteracting ? 0.8 : 0.4,
        }}
      />

      {/* Central content */}
      <div className="content-wrapper">
        <div
          className="main-content"
          style={{
            transform: `scale(${1 + Math.sin(breathPhase) * 0.02})`,
          }}
        >
          <div className="geometric-frame">
            <div className="frame-corner top-left" />
            <div className="frame-corner top-right" />
            <div className="frame-corner bottom-left" />
            <div className="frame-corner bottom-right" />
          </div>

          <span className="label-tag">INTERACTIVE EXPERIENCE</span>

          <h1 className="main-title">
            <span className="title-line">Digital</span>
            <span className="title-line accent">Dreamscape</span>
          </h1>

          <p className="subtitle">
            Touch or click anywhere to create
            <br className="hidden sm:block" />
            <span className="hidden sm:inline"> </span>bioluminescent particles
          </p>

          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-number">{particles.length}</span>
              <span className="stat-label">Active Particles</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{orbs.length}</span>
              <span className="stat-label">Floating Orbs</span>
            </div>
          </div>

          <div className="interaction-hint">
            <div className={`pulse-ring ${isInteracting ? 'active' : ''}`} />
            <span>{isInteracting ? 'Creating...' : 'Hold to create'}</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="deco-line left" />
      <div className="deco-line right" />

      {/* Scan lines effect */}
      <div className="scan-lines" />

      {/* Footer */}
      <footer className="app-footer">
        <span>Requested by @andreisilver89 · Built by @clonkbot</span>
      </footer>
    </div>
  );
}

export default App;
