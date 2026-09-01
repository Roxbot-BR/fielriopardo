"use client";
import React, { useEffect, useState } from "react";

interface GoalCelebrationProps {
  show: boolean;
  palpite?: string;
  onDone?: () => void;
}

// Deterministic confetti (no Math.random on render = no hydration issues)
const CONFETTI = Array.from({ length: 45 }, (_, i) => ({
  x: 1 + (i * 2.2) % 98,
  delay: (i * 0.07) % 1.4,
  size: 7 + (i * 5) % 9,
  color: ["#C8A951","#ffffff","#111111","#C8A951","#e0e0e0","#8B6914"][i % 6],
  rotation: (i * 53) % 360,
  dur: 1.4 + (i * 0.09) % 0.8,
  shape: i % 3 === 0 ? "circle" : "rect",
}));

export function GoalCelebration({ show, palpite, onDone }: GoalCelebrationProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!show) return;
    setPhase(1);
    const t1 = setTimeout(() => setPhase(2), 500);   // kick
    const t2 = setTimeout(() => setPhase(3), 1100);  // net hit
    const t3 = setTimeout(() => setPhase(4), 1600);  // GOL! + confetti
    const t4 = setTimeout(() => setPhase(5), 3600);  // fade out
    const t5 = setTimeout(() => { setPhase(0); onDone?.(); }, 4100);
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, [show, onDone]);

  if (phase === 0) return null;

  return (
    <>
      <style>{`
        @keyframes celebOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes celebFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes playerSlideIn {
          0%   { transform: translateX(-180px); opacity: 0; }
          60%  { transform: translateX(10px);   opacity: 1; }
          100% { transform: translateX(0);       opacity: 1; }
        }
        @keyframes torsoKick {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(-18deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes legSwing {
          0%   { transform: rotate(20deg); }
          45%  { transform: rotate(-68deg); }
          65%  { transform: rotate(-52deg); }
          85%  { transform: rotate(-48deg); }
          100% { transform: rotate(-48deg); }
        }
        @keyframes armSwing {
          0%   { transform: rotate(0deg); }
          45%  { transform: rotate(-50deg); }
          100% { transform: rotate(-50deg); }
        }
        @keyframes ballArc {
          0%   { transform: translate(0px, 0px)   rotate(0deg);   opacity: 1; }
          30%  { transform: translate(100px,-70px) rotate(200deg); opacity: 1; }
          65%  { transform: translate(240px,-40px) rotate(460deg); opacity: 1; }
          100% { transform: translate(305px, 10px) rotate(630deg); opacity: 1; }
        }
        @keyframes netBulge {
          0%   { transform: scaleX(1)    scaleY(1);    }
          15%  { transform: scaleX(1.18) scaleY(0.88); }
          30%  { transform: scaleX(0.92) scaleY(1.12); }
          50%  { transform: scaleX(1.09) scaleY(0.94); }
          70%  { transform: scaleX(0.97) scaleY(1.04); }
          100% { transform: scaleX(1)    scaleY(1);    }
        }
        @keyframes netFlash {
          0%, 100% { fill: rgba(255,255,255,0.04); }
          25%       { fill: rgba(200,169,81,0.25);  }
          50%       { fill: rgba(255,255,255,0.08); }
        }
        @keyframes golPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          55%  { transform: scale(1.35) rotate(6deg); opacity: 1; }
          75%  { transform: scale(0.92) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes subTextUp {
          0%   { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes starsExplode {
          0%   { transform: scale(0) translateY(0);    opacity: 1; }
          100% { transform: scale(2) translateY(-60px); opacity: 0; }
        }
        @keyframes confettiFall {
          0%   { opacity: 1; transform: translateY(-10px) rotate(0deg)   scale(1); }
          100% { opacity: 0; transform: translateY(560px) rotate(720deg) scale(0.6); }
        }
        @keyframes tapHint {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
      `}</style>

      {/* OVERLAY */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
        style={{ animation: phase === 5 ? "celebFadeOut 0.5s ease forwards" : "celebOverlay 0.35s ease forwards" }}
        onClick={() => { setPhase(5); setTimeout(() => { setPhase(0); onDone?.(); }, 450); }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/88" />
        {/* Pitch glow */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 55% at 50% 65%, rgba(0,90,10,0.45) 0%, transparent 68%)"
        }} />
        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />

        {/* CONFETTI */}
        {phase >= 4 && CONFETTI.map((c, i) => (
          <div key={i} className="absolute top-0 pointer-events-none" style={{
            left: `${c.x}%`,
            width: c.shape === "circle" ? c.size : c.size,
            height: c.shape === "circle" ? c.size : c.size * 0.5,
            borderRadius: c.shape === "circle" ? "50%" : "2px",
            backgroundColor: c.color,
            transform: `rotate(${c.rotation}deg)`,
            animation: `confettiFall ${c.dur}s ${c.delay}s ease-in both`,
          }} />
        ))}

        {/* SCENE */}
        <div className="relative z-10 flex items-end justify-center" style={{ width: 440, height: 210, maxWidth: "95vw", overflow: "visible" }}>

          {/* ── PLAYER SVG ── */}
          <div style={{
            position: "absolute", left: 0, bottom: 0,
            overflow: "visible",
            animation: phase >= 1 ? "playerSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
            opacity: 0,
          }}>
            <svg width="110" height="210" viewBox="0 0 110 210" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
              {/* ── Shadow ── */}
              <ellipse cx="52" cy="204" rx="38" ry="7" fill="rgba(0,0,0,0.35)"/>

              {/* ── WHOLE BODY (torso pivot for kick) ── */}
              <g style={{ transformOrigin:"52px 90px", animation: phase >= 2 ? "torsoKick 0.45s ease forwards" : "none" }}>

                {/* === STANDING LEG (left) === */}
                {/* Upper leg */}
                <line x1="44" y1="118" x2="40" y2="158" stroke="#111" strokeWidth="12" strokeLinecap="round"/>
                {/* Lower leg */}
                <line x1="40" y1="158" x2="36" y2="196" stroke="#111" strokeWidth="10" strokeLinecap="round"/>
                {/* Shin guard */}
                <rect x="31" y="163" width="10" height="18" rx="3" fill="#C8A951" opacity="0.8"/>
                {/* Boot */}
                <ellipse cx="34" cy="200" rx="15" ry="7" fill="#1a1a1a"/>
                <ellipse cx="34" cy="198" rx="13" ry="5" fill="#333"/>

                {/* === KICKING LEG (right) — swings forward === */}
                <g style={{ transformOrigin:"60px 118px", animation: phase >= 2 ? "legSwing 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards" : "none" }}>
                  {/* Upper leg */}
                  <line x1="60" y1="118" x2="72" y2="152" stroke="#111" strokeWidth="13" strokeLinecap="round"/>
                  {/* Lower leg */}
                  <line x1="72" y1="152" x2="82" y2="188" stroke="#111" strokeWidth="11" strokeLinecap="round"/>
                  {/* Shin guard */}
                  <rect x="74" y="157" width="11" height="18" rx="3" fill="#C8A951" opacity="0.8"/>
                  {/* Boot (kicking) */}
                  <ellipse cx="84" cy="192" rx="16" ry="7" fill="white" stroke="#111" strokeWidth="1.5"/>
                  <ellipse cx="85" cy="190" rx="14" ry="5" fill="#eee"/>
                  {/* Boot laces */}
                  <line x1="76" y1="190" x2="95" y2="190" stroke="#aaa" strokeWidth="1"/>
                </g>

                {/* === SHORTS === */}
                <path d="M34 116 Q44 128 52 120 Q60 128 70 116 L68 100 Q52 110 36 100Z" fill="#111"/>
                <line x1="52" y1="100" x2="52" y2="120" stroke="#333" strokeWidth="1"/>

                {/* === SHIRT (Corinthians white) === */}
                <path d="M26 58 Q34 52 52 50 Q70 52 78 58 L74 110 Q52 118 30 110Z" fill="white" stroke="#ddd" strokeWidth="1.5"/>
                {/* Shirt stripes / shadow */}
                <path d="M30 60 L34 108" stroke="#eee" strokeWidth="2"/>
                <path d="M74 60 L70 108" stroke="#eee" strokeWidth="2"/>
                {/* Collar */}
                <path d="M40 52 Q52 44 64 52 L62 62 Q52 56 42 62Z" fill="#111"/>
                {/* Corinthians crest */}
                <circle cx="46" cy="72" r="9" fill="#111"/>
                <text x="46" y="76" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="serif">SC</text>
                {/* Number */}
                <text x="58" y="92" textAnchor="middle" fill="#111" fontSize="11" fontWeight="black" fontFamily="monospace">10</text>

                {/* === LEFT ARM (raised/balance) === */}
                <g style={{ transformOrigin:"30px 72px", animation: phase >= 2 ? "armSwing 0.45s ease forwards" : "none" }}>
                  <line x1="30" y1="72" x2="10" y2="88" stroke="#FDBCB4" strokeWidth="10" strokeLinecap="round"/>
                  <line x1="10" y1="88" x2="4"  y2="110" stroke="#FDBCB4" strokeWidth="8" strokeLinecap="round"/>
                </g>
                {/* === RIGHT ARM (forward swing) === */}
                <line x1="74" y1="72" x2="90" y2="82" stroke="#FDBCB4" strokeWidth="10" strokeLinecap="round"/>
                <line x1="90" y1="82" x2="96" y2="100" stroke="#FDBCB4" strokeWidth="8" strokeLinecap="round"/>

                {/* === HEAD === */}
                <circle cx="52" cy="28" r="22" fill="#FDBCB4" stroke="#111" strokeWidth="1.5"/>
                {/* Hair */}
                <path d="M30 24 Q38 6 52 8 Q66 6 74 24 Q68 12 52 14 Q36 12 30 24Z" fill="#2c1810"/>
                {/* Face */}
                <circle cx="44" cy="28" r="2.5" fill="#111"/>
                <circle cx="60" cy="28" r="2.5" fill="#111"/>
                <path d="M44 36 Q52 42 60 36" stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                {/* Eyebrows */}
                <path d="M40 23 Q44 20 48 23" stroke="#2c1810" strokeWidth="2" fill="none"/>
                <path d="M56 23 Q60 20 64 23" stroke="#2c1810" strokeWidth="2" fill="none"/>
                {/* Sweatband optional */}
                {/* Ear */}
                <ellipse cx="30" cy="30" rx="5" ry="7" fill="#FDBCB4" stroke="#daa090" strokeWidth="1"/>
                <ellipse cx="74" cy="30" rx="5" ry="7" fill="#FDBCB4" stroke="#daa090" strokeWidth="1"/>
              </g>
            </svg>
          </div>

          {/* ── BALL ── */}
          {phase >= 2 && (
            <div style={{
              position: "absolute", left: 68, bottom: 14,
              animation: "ballArc 0.7s cubic-bezier(0.33,1,0.68,1) forwards",
            }}>
              <svg width="38" height="38" viewBox="0 0 38 38">
                <circle cx="19" cy="19" r="18" fill="white" stroke="#222" strokeWidth="1.5"/>
                {/* Pentagon patches */}
                <polygon points="19,3 25,9 23,17 15,17 13,9" fill="#111"/>
                <polygon points="29,11 35,16 33,24 27,26 23,17 29,11" fill="#111"/>
                <polygon points="9,11 15,9 19,17 13,24 7,22 5,15" fill="#111"/>
                <polygon points="7,26 13,24 15,32 10,36 4,30" fill="#111"/>
                <polygon points="27,26 33,26 35,32 29,36 23,32" fill="#111"/>
                <polygon points="15,32 23,32 25,38 19,38 13,38" fill="#111"/>
              </svg>
            </div>
          )}

          {/* ── GOAL NET ── */}
          <div style={{ position: "absolute", right: 0, bottom: 0 }}>
            <svg width="140" height="210" viewBox="0 0 140 210" fill="none">
              {/* Ground */}
              <line x1="0" y1="205" x2="140" y2="205" stroke="#1d7a1d" strokeWidth="4"/>
              {/* Post left */}
              <rect x="2" y="70" width="9" height="130" rx="3" fill="#e8e8e8" stroke="#bbb" strokeWidth="1"/>
              {/* Post right */}
              <rect x="129" y="70" width="9" height="130" rx="3" fill="#e8e8e8" stroke="#bbb" strokeWidth="1"/>
              {/* Crossbar */}
              <rect x="2" y="68" width="136" height="9" rx="3" fill="#e8e8e8" stroke="#bbb" strokeWidth="1"/>
              {/* Back post (depth) */}
              <rect x="14" y="70" width="6" height="100" rx="2" fill="#cccccc" stroke="#aaa" strokeWidth="1"/>

              {/* Net — animated bulge on hit */}
              <g style={{
                transformOrigin: "70px 135px",
                animation: phase >= 3 ? "netBulge 0.5s ease" : "none",
              }}>
                {/* Net background fill */}
                <rect x="11" y="77" width="118" height="128" rx="2"
                  style={{ animation: phase >= 3 ? "netFlash 0.5s ease" : "none" }}
                  fill="rgba(255,255,255,0.04)"
                />
                {/* Horizontal net lines */}
                {[77,90,103,116,129,142,155,168,181,194,205].map(y => (
                  <line key={y} x1="11" y1={y} x2="129" y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                ))}
                {/* Vertical net lines */}
                {[11,22,33,44,55,66,77,88,99,110,120,129].map(x => (
                  <line key={x} x1={x} y1="77" x2={x} y2="205" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                ))}
                {/* Net outline */}
                <rect x="11" y="77" width="118" height="128" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              </g>
            </svg>
          </div>

          {/* Turf line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-800/60 to-transparent rounded-full" />
        </div>

        {/* ── GOL! TEXT ── */}
        {phase >= 4 && (
          <div className="relative z-10 text-center mt-2" style={{ animation: "golPop 0.55s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
            <div className="font-black text-[#C8A951] leading-none" style={{
              fontSize: "clamp(60px,16vw,90px)",
              textShadow: "0 0 50px rgba(200,169,81,0.9), 4px 4px 0 #000, -1px -1px 0 #000",
              letterSpacing: "0.05em",
            }}>
              GOL! ⚽
            </div>
          </div>
        )}

        {/* ── SUBTITLE ── */}
        {phase >= 4 && (
          <div className="relative z-10 text-center mt-3 px-6" style={{ animation: "subTextUp 0.4s 0.2s ease both" }}>
            <p className="text-white font-bold text-xl">Palpite salvo com sucesso!</p>
            {palpite && (
              <p className="text-[#C8A951] font-black text-2xl mt-1 tracking-wider">{palpite}</p>
            )}
            <p className="text-gray-500 text-xs mt-4" style={{ animation: "tapHint 1.5s 1s infinite" }}>
              Toque para fechar
            </p>
          </div>
        )}

        {/* ── STARS on impact ── */}
        {phase === 3 && (
          <div className="absolute" style={{ right: "calc(50% - 200px)", top: "35%" }}>
            {["⭐","✨","💥"].map((s, i) => (
              <span key={i} className="absolute text-2xl" style={{
                left: i * 30 - 20,
                top: i * 10 - 10,
                animation: `starsExplode 0.6s ${i * 0.1}s ease forwards`,
              }}>{s}</span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
