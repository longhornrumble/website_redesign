// HeroDemoScene — the widget-only portrait chat loop for the myrecruiter.ai hero.
// Ported from the design bundle's animations.jsx (timeline engine) + hero-scene.jsx
// (the scene). Trimmed to production: the rAF loop, loop-at-duration, and
// auto-scale-to-container survive; the editor chrome (scrubber, keyboard seek,
// localStorage playhead, font inlining, video-export protocol) is dropped.
// Runs as a Preact island. Backgrounds are transparent so the page glow shows
// through (any opaque frame re-creates the black-bar bug the prototype fixed).

import { createElement as h, Fragment, createContext } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';

// ── Timeline engine (trimmed) ───────────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const Easing = {
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

// Popmotion-style piecewise tween: interpolate([t0,t1],[v0,v1],ease)(t) => v
function interpolate(input, output, ease) {
  if (!ease) ease = (t) => t;
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        return output[i] + (output[i + 1] - output[i]) * ease(local);
      }
    }
    return output[output.length - 1];
  };
}

const TimelineContext = createContext({ time: 0, duration: 10 });
const useTime = () => useContext(TimelineContext).time;

// Sprite: mounts children only while the playhead is in [start, end].
function Sprite({ start = 0, end = Infinity, children }) {
  const { time } = useContext(TimelineContext);
  if (time < start || time > end) return null;
  return children;
}

// Stage: chromeless. Fixed-size canvas (width×height) auto-scaled to fill its
// container, transparent throughout. rAF advances time and loops at duration.
// staticTime freezes the playhead (used for prefers-reduced-motion).
function Stage({ width, height, duration, loop = true, staticTime = null, children }) {
  const [time, setTime] = useState(staticTime == null ? 0 : staticTime);
  const [scale, setScale] = useState(1);
  const hostRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  // Auto-scale to fit container
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const s = Math.min(el.clientWidth / width, el.clientHeight / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  // rAF loop (skipped when frozen)
  useEffect(() => {
    if (staticTime != null) return;
    const step = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) next = loop ? next % duration : duration;
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [duration, loop, staticTime]);

  return h('div', {
    ref: hostRef,
    style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  },
    h('div', {
      style: {
        width, height, position: 'relative', flexShrink: 0,
        transform: 'scale(' + scale + ')', transformOrigin: 'center',
      },
    },
      h(TimelineContext.Provider, { value: { time, duration } }, children)));
}

// ── Scene (ported verbatim from hero-scene.jsx) ─────────────────────────────
let SPEED = 1; // playback-rate multiplier (1 = original pacing)
function useT() { return useTime() * SPEED; }

const W = 720, H = 920, DUR = 25.5;

// palette
const NAVY = '#0F172A';
const GOLD = '#a08a4a', GOLD_DEEP = '#8a7439', GOLD_MUTED = '#b4a67a';
const CREAM = '#fffefb', CREAM_TINT = '#fbf8ee', HAIR = '#e8e2ce', HAIR_SOFT = '#f2eddc';
const INK = '#0f172a', BODY = '#475569', SLATE = '#64748b';
const E = '#50C878', E300 = '#6ee7b7', MINT = '#E9F7EF';

function rise(t, delay, dur, dy) {
  if (dur === undefined) dur = 0.45;
  if (dy === undefined) dy = 14;
  const p = clamp((t - delay) / dur, 0, 1);
  const e = Easing.easeOutCubic(p);
  return { opacity: e, transform: 'translateY(' + ((1 - e) * dy) + 'px)' };
}
function exitFade(t) { return clamp((DUR - 0.45 - t) / 0.45, 0, 1); }

function TypingDots() {
  const t = useT();
  return h('div', { style: { display: 'flex', gap: 5, padding: '6px 0' } },
    [0, 1, 2].map(function (i) {
      const ph = (t * 2.6 + i * 0.28) % 1;
      const up = ph < 0.35 ? Math.sin((ph / 0.35) * Math.PI) : 0;
      return h('span', {
        key: i,
        style: { width: 7, height: 7, borderRadius: '50%', background: GOLD_MUTED, transform: 'translateY(' + (-up * 5) + 'px)', opacity: 0.4 + up * 0.6 },
      });
    }));
}

function Dots({ from, to, top }) {
  const t = useT();
  if (t < from || t >= to) return null;
  return h('div', { style: { position: 'absolute', left: 28, top: top } },
    h('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: GOLD_DEEP, marginBottom: 6 } }, 'BRIGHTPATH'),
    h(TypingDots));
}

function UserBubble({ text, delay, top }) {
  const t = useT();
  if (t < delay) return null;
  return h('div', { style: Object.assign({ position: 'absolute', right: 28, top: top, maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }, rise(t, delay)) },
    h('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: GOLD_MUTED, marginBottom: 6 } }, 'YOU'),
    h('div', { style: { background: CREAM_TINT, border: '1px solid ' + HAIR, borderRadius: 12, padding: '12px 16px', fontSize: 17, lineHeight: 1.5, color: '#334155' } }, text));
}

function BotMsg({ text, delay, top, width }) {
  const t = useT();
  if (t < delay) return null;
  return h('div', { style: Object.assign({ position: 'absolute', left: 28, top: top, width: width || 480 }, rise(t, delay)) },
    h('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: GOLD_DEEP, marginBottom: 6 } }, 'BRIGHTPATH'),
    h('div', { style: { fontSize: 17.5, lineHeight: 1.55, color: BODY } }, text));
}

// pill-chip row; the chip at pickIndex highlights at pickAt
function ChipRow({ opts, delay, top, pickIndex, pickAt }) {
  const t = useT();
  if (t < delay) return null;
  return h('div', { style: Object.assign({ position: 'absolute', left: 28, top: top, display: 'flex', gap: 9 }, rise(t, delay)) },
    opts.map(function (label, i) {
      const picked = i === pickIndex && t >= pickAt;
      const dimmed = t >= pickAt && i !== pickIndex;
      return h('div', {
        key: i,
        style: {
          padding: '10px 18px', borderRadius: 18, fontSize: 15.5, fontWeight: 600,
          whiteSpace: 'nowrap', flex: 'none',
          background: picked ? GOLD : '#fff',
          color: picked ? '#fff' : INK,
          border: '1px solid ' + (picked ? GOLD : '#ede7d3'),
          opacity: dimmed ? 0.45 : 1,
          transition: 'all .3s',
        },
      }, label);
    }));
}

function Widget({ children }) {
  const t = useT();
  const enter = rise(t, 0.15, 0.6, 24);
  return h('div', {
    style: {
      position: 'absolute', left: 30, top: 74, width: 660, height: 800,
      background: CREAM, border: '1px solid ' + HAIR, borderTop: '3px solid ' + GOLD,
      borderRadius: 16, boxShadow: '0 24px 64px rgba(2,6,23,.5)',
      overflow: 'hidden', boxSizing: 'border-box',
      opacity: enter.opacity * exitFade(t), transform: enter.transform,
    },
  },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '19px 26px 13px' } },
      h('div', { style: { fontSize: 14, fontWeight: 700, letterSpacing: '.14em', color: GOLD_DEEP } }, 'BRIGHTPATH'),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: GOLD_MUTED } },
        h('span', { style: { width: 7, height: 7, borderRadius: '50%', background: E } }), 'ONLINE 24/7')),
    h('div', { style: { position: 'absolute', top: 60, left: 0, right: 0, bottom: 80 } }, children),
    h('div', { style: { position: 'absolute', left: 22, right: 22, bottom: 18, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e3dcc6', borderRadius: 999, padding: '12px 13px 12px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.05)' } },
      h('span', { style: { flex: 1, fontSize: 16.5, color: '#a99e7e' } }, 'Ask a question…'),
      h('div', { style: { width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #e3dcc6', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#c3b483', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
          h('path', { d: 'M12 19V5 M5 12l7-7 7 7' })))));
}

function TimeChip() {
  const t = useT();
  return h('div', {
    style: {
      position: 'absolute', left: 30, top: 22, display: 'inline-flex', alignItems: 'center', gap: 9,
      padding: '9px 18px', borderRadius: 999, background: 'rgba(255,255,255,.08)',
      border: '1px solid rgba(255,255,255,.16)', backdropFilter: 'blur(8px)',
      fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,.85)',
      opacity: rise(t, 0.5, 0.5).opacity * exitFade(t),
    },
  },
    h('span', { style: { width: 8, height: 8, borderRadius: '50%', background: '#FBBF24' } }),
    '9:12 PM · your team is offline');
}

// Scene A (0-7.6): two questions answered
function SceneQuestions() {
  return h(Fragment, null,
    h(UserBubble, { text: 'What volunteer opportunities do you have?', delay: 0.9, top: 20 }),
    h(Dots, { from: 1.6, to: 2.4, top: 130 }),
    h(BotMsg, { delay: 2.4, top: 130, width: 500, text: 'Three ways to get involved: Care Kits family support, Pathways youth mentoring, and event volunteering.' }),
    h(UserBubble, { text: 'Do I need any experience?', delay: 4.4, top: 268 }),
    h(Dots, { from: 5.0, to: 5.8, top: 378 }),
    h(BotMsg, { delay: 5.8, top: 378, width: 500, text: "Not at all — we provide full training and ongoing support. Want me to start your application right here?" }),
    h(UserBubble, { text: 'Yes, let’s do it!', delay: 7.0, top: 512 }));
}

// Scene B (7.6-14.2): application filled conversationally
function SceneForm() {
  const t = useT();
  const rows = [
    { q: "What's your first name?", a: 'Maya', at: 8.4 },
    { q: 'Best email for you?', a: 'maya.t@gmail.com', at: 9.7 },
    { q: 'Are you 22 or older?', a: 'Yes, I am', at: 11.0, gate: true },
  ];
  const prog = interpolate([8.2, 12.6], [0, 100], Easing.easeInOutQuad)(t);
  return h(Fragment, null,
    h('div', { style: Object.assign({ position: 'absolute', left: 28, right: 28, top: 16, border: '1px solid ' + HAIR_SOFT, borderRadius: 12, padding: '15px 19px', background: '#fff' }, rise(t, 7.9)) },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } },
        h('span', { style: { fontSize: 16, fontWeight: 700, color: INK } }, 'Volunteer application'),
        h('span', { style: { fontSize: 13, fontWeight: 600, color: GOLD_DEEP } }, 'in the chat — no forms')),
      h('div', { style: { height: 4, borderRadius: 2, background: HAIR_SOFT, marginTop: 11, overflow: 'hidden' } },
        h('div', { style: { height: '100%', width: prog + '%', background: GOLD, borderRadius: 2 } }))),
    rows.map(function (r, i) {
      const top = 106 + i * 142;
      if (t < r.at) return null;
      return h(Fragment, { key: i },
        h('div', { style: Object.assign({ position: 'absolute', left: 28, top: top, width: 330 }, rise(t, r.at)) },
          h('div', { style: { fontSize: 17.5, lineHeight: 1.5, color: BODY } }, r.q)),
        t >= r.at + 0.55 ? h('div', { style: Object.assign({ position: 'absolute', right: 28, top: top + 38 }, rise(t, r.at + 0.55)) },
          h('div', { style: { background: CREAM_TINT, border: '1px solid ' + HAIR, borderRadius: 10, padding: '10px 17px', fontSize: 17, color: '#334155' } }, r.a)) : null,
        r.gate && t >= r.at + 1.0 ? h('div', { style: Object.assign({ position: 'absolute', left: 28, top: top + 88, display: 'flex', alignItems: 'center', gap: 8 }, rise(t, r.at + 1.0)) },
          h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: GOLD, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M20 6 9 17l-5-5' })),
          h('span', { style: { fontSize: 13.5, fontWeight: 600, color: GOLD_DEEP } }, 'Eligibility confirmed')) : null);
    }),
    h(BotMsg, { delay: 13.0, top: 540, width: 520, text: "That's everything, Maya — application complete!" }));
}

// Scene C (14.2-19.2): times offered, one picked
function SceneSchedule() {
  const t = useT();
  return h(Fragment, null,
    h(BotMsg, { delay: 14.4, top: 20, width: 520, text: "Last step — let's book your discovery session. Which day works?" }),
    h(ChipRow, { opts: ['Tue, Jul 14', 'Thu, Jul 16', 'Sat, Jul 18'], delay: 15.2, top: 132, pickIndex: 2, pickAt: 16.2 }),
    h(BotMsg, { delay: 16.7, top: 208, width: 520, text: 'Saturday it is. Here’s what’s open:' }),
    h(ChipRow, { opts: ['10:00 AM', '12:30 PM', '5:30 PM'], delay: 17.2, top: 316, pickIndex: 0, pickAt: 18.2 }),
    t >= 18.6 ? h('div', { style: Object.assign({ position: 'absolute', left: 28, top: 392, display: 'flex', alignItems: 'center', gap: 8 }, rise(t, 18.6)) },
      h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: GOLD, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M20 6 9 17l-5-5' })),
      h('span', { style: { fontSize: 13.5, fontWeight: 600, color: GOLD_DEEP } }, 'Sat, Jul 18 · 10:00 AM selected')) : null);
}

// Scene D (19.2-24): booked + calendar payoff
function SceneBooked() {
  const t = useT();
  const pop = clamp((t - 19.5) / 0.5, 0, 1);
  const pe = Easing.easeOutCubic(pop);
  const checks = ['Confirmation & reminders scheduled', 'Reschedules handled automatically', 'Zero staff involved'];
  return h(Fragment, null,
    h(BotMsg, { delay: 19.3, top: 20, width: 520, text: "You're all set, Maya! See you Saturday." }),
    h('div', { style: { position: 'absolute', left: 28, right: 28, top: 84, border: '1px solid ' + HAIR_SOFT, borderRadius: 12, padding: '17px 21px', background: '#fff', opacity: pop, transform: 'scale(' + (0.94 + pe * 0.06) + ')', transformOrigin: 'center top' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
        h('div', { style: { width: 46, height: 46, borderRadius: 12, background: CREAM_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' } },
          h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: GOLD, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            h('path', { d: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' }))),
        h('div', null,
          h('div', { style: { fontSize: 18.5, fontWeight: 700, color: INK } }, 'Discovery session — booked'),
          h('div', { style: { fontSize: 15, color: SLATE, marginTop: 3 } }, 'Sat, Jul 18 · 10:00 AM · confirmation sent')))),
    h('div', { style: { position: 'absolute', left: 32, right: 28, top: 250, display: 'flex', flexDirection: 'column', gap: 10 } },
      checks.map(function (s, i) {
        if (t < 20.5 + i * 0.4) return null;
        return h('div', { key: i, style: Object.assign({ display: 'flex', alignItems: 'center', gap: 10 }, rise(t, 20.5 + i * 0.4, 0.35, 8)) },
          h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: GOLD, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M20 6 9 17l-5-5' })),
          h('span', { style: { fontSize: 16, fontWeight: 600, color: BODY } }, s));
      })),
    h(CalendarCard));
}

// Jess's calendar card — full detail, matching the Experience Center demo
function CalendarCard() {
  const t = useT();
  if (t < 21.4) return null;
  const p = Easing.easeOutCubic(clamp((t - 21.4) / 0.55, 0, 1));
  const pop = Easing.easeOutCubic(clamp((t - 22.1) / 0.45, 0, 1));
  const rows = [
    { time: '9:00 AM', label: 'Team standup', isNew: false },
    { time: '10:00 AM', label: 'Discovery session — Maya T.', tag: '· auto-booked', isNew: true },
    { time: '12:30 PM', label: 'Staff sync', isNew: false },
  ];
  return h('div', {
    style: {
      position: 'absolute', left: 28, right: 28, top: 372,
      borderRadius: 14, overflow: 'hidden', background: '#fff',
      border: '1px solid #E2E8F0', boxShadow: '0 24px 56px rgba(2,6,23,.5)',
      opacity: p * exitFade(t), transform: 'translateY(' + ((1 - p) * 26) + 'px)',
    },
  },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', background: NAVY } },
      h('div', null,
        h('div', { style: { fontSize: 15.5, fontWeight: 700, color: '#fff' } }, "Jess's calendar"),
        h('div', { style: { fontSize: 12, color: '#94A3B8', marginTop: 2 } }, 'Volunteer Coordinator · Sat, Jul 18')),
      h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: E300 } },
        h('span', { style: { width: 7, height: 7, borderRadius: '50%', background: E } }), 'LIVE SYNC')),
    h('div', { style: { padding: '8px 0 10px' } },
      rows.map(function (r, i) {
        const isNew = r.isNew;
        const showNew = isNew && pop > 0;
        return h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '5px 18px' } },
          h('div', { style: { width: 66, flex: 'none', fontSize: 12.5, color: SLATE, textAlign: 'right' } }, r.time),
          h('div', { style: { flex: 1, borderLeft: '1px solid #F1F5F9', paddingLeft: 12 } },
            isNew
              ? h('div', {
                  style: {
                    padding: '9px 13px', borderRadius: 10, background: MINT, border: '1.5px solid ' + E,
                    fontSize: 13.5, fontWeight: 700, color: '#065f46',
                    boxShadow: '0 6px 18px rgba(80,200,120,.3)',
                    opacity: showNew ? 1 : 0, transform: 'scale(' + (0.94 + pop * 0.06) + ')', transformOrigin: 'left center',
                  },
                }, r.label + ' ', h('span', { style: { fontWeight: 600, color: '#1C7A45' } }, r.tag))
              : h('div', { style: { padding: '9px 13px', borderRadius: 10, background: '#F1F5F9', fontSize: 13.5, fontWeight: 600, color: BODY } }, r.label)));
      })));
}

// prefers-reduced-motion: freeze on the booked-confirmation payoff frame.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export default function HeroDemoScene(props) {
  SPEED = (props && props.speed) || 1;
  const showChip = !props || props.showTimeChip !== false;
  const reduced = usePrefersReducedMotion();
  // Scene-time 24.8 → booked card + all checks + calendar, before the exit fade.
  const staticTime = reduced ? 24.8 / SPEED : null;

  return h(Stage, { width: W, height: H, duration: DUR / SPEED, loop: true, staticTime: staticTime },
    showChip ? h(TimeChip) : null,
    h(Widget, null,
      h(Sprite, { start: 0, end: 7.6 / SPEED }, h(SceneQuestions)),
      h(Sprite, { start: 7.6 / SPEED, end: 14.2 / SPEED }, h(SceneForm)),
      h(Sprite, { start: 14.2 / SPEED, end: 19.2 / SPEED }, h(SceneSchedule)),
      h(Sprite, { start: 19.2 / SPEED, end: DUR / SPEED }, h(SceneBooked))));
}
