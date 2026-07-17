// Experience Center — the standalone self-guided demo, ported from the design
// bundle's "Experience Center v2.dc.html". One Preact class component (maps 1:1
// to the prototype's DCLogic class: same `state`, methods, and `renderVals()`),
// mounted as a single island at /experience. All copy/data is verbatim from the
// prototype; the DC template (<sc-if>/<sc-for>/{{holes}}) is translated into the
// render() tree below. Inline style strings are kept as-is (Preact sets them via
// cssText); var(--x,#fallback) resolves through its fallback; keyframes and the
// .ec-* hover helpers live in the /experience page's global <style>.

import { Component, createElement as h, Fragment, createRef } from 'preact';

// Local stand-in for the design-system Button used by the prototype.
function Btn({ variant, size, onDark, onClick, href, full, children }) {
  const base = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s,box-shadow .15s,border-color .15s;box-sizing:border-box;line-height:1;';
  const sz = size === 'lg' ? 'padding:14px 24px;font-size:15px;' : size === 'sm' ? 'padding:9px 16px;font-size:13px;' : 'padding:12px 22px;font-size:14px;';
  let vs, cls;
  if (variant === 'outline') {
    if (onDark) { vs = 'background:transparent;border:1px solid rgba(255,255,255,.25);color:#fff;'; cls = 'ec-btn-outline-dark'; }
    else { vs = 'background:#fff;border:1px solid #E2E8F0;color:#0F172A;'; cls = 'ec-btn-outline'; }
  } else {
    vs = 'background:#50C878;border:1px solid transparent;color:#fff;box-shadow:0 8px 20px rgba(80,200,120,.25);'; cls = 'ec-btn-primary';
  }
  const style = base + sz + vs + (full ? 'width:100%;' : '');
  // A real anchor when given href (opens/middle-clicks correctly); button otherwise.
  if (href) return h('a', { class: cls, href, style }, children);
  return h('button', { class: cls, onClick, style }, children);
}

export default class ExperienceCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'landing', overviewOpen: false, welcomeOpen: true, sector: 'nonprofit',
      stage: 0, maxStage: 0, perspective: 'vol', channel: 'website',
      thread: [], typing: false,
      qOverlayOpen: false, asked: [],
      formStep: 0, formPlaying: false, formDone: false,
      slotDay: -1, slotTime: -1, confirmed: false, calShown: false,
      tlShown: 0, rescheduled: false,
      attended: false, attendLog: 0,
      dashTab: 'exec', dashRange: '30',
    };
    this._t = [];
    this.threadRef = createRef();
  }
  after(ms, fn) { this._t.push(setTimeout(fn, ms)); }
  clearTimers() { this._t.forEach(clearTimeout); this._t = []; }
  componentDidMount() { if ((this.props.startOnHome ?? false) && this.state.view === 'landing') this.setState({ view: 'home' }); }
  componentWillUnmount() { this.clearTimers(); }
  sp() { return this.props.chatSpeed ?? 1; }
  org() { return this.props.orgName ?? 'BrightPath'; }
  isExp(v) { return ['volunteer', 'donor', 'program', 'event'].includes(v); }
  curExp() { return this.isExp(this.state.view) ? this.state.view : 'volunteer'; }
  cfg() { return this.experiences()[this.curExp()]; }
  curKey() { const st = this.cfg().stages; return (st[this.state.stage] || st[0]).key; }

  scrollThread() { this.after(80, () => { const el = this.threadRef.current; if (el) el.scrollTop = el.scrollHeight; }); }
  pushT(item) { this.setState(s => ({ thread: s.thread.concat([item]), typing: false })); this.scrollThread(); }
  botTyping() { this.setState({ typing: true }); this.scrollThread(); }
  hideItem(id) { this.setState(s => ({ thread: s.thread.map(m => m.id === id ? { ...m, done: true } : m) })); }

  runEngage() {
    this.clearTimers();
    this.setState({ thread: [], typing: false });
    const c = this.cfg().engage; const sp = this.sp(); let t = 400;
    c.forEach((step, i) => {
      if (step.bot) {
        const at = t; this.after(at / sp, () => this.botTyping());
        t += Math.min(2100, 700 + step.bot.length * 8);
        const at2 = t; this.after(at2 / sp, () => this.pushT({ t: 'bot', text: step.bot })); t += 650;
      } else if (step.user) {
        const at = t; this.after(at / sp, () => this.pushT({ t: 'user', text: step.user })); t += 800;
      } else if (step.menu) {
        const id = step.id || ('m' + i); const at = t;
        this.after(at / sp, () => this.pushT({ t: 'menu', id, rows: step.menu.map(l => ({ label: l })) })); t += 900;
      } else if (step.showcase) {
        const at = t; this.after(at / sp, () => this.pushT({ t: 'showcase' })); t += 950;
      }
    });
  }
  rowSend(label, hideId) {
    this.clearTimers();
    if (hideId) this.hideItem(hideId);
    this.pushT({ t: 'user', text: label });
    this.botTyping();
    this.after(1200 / this.sp(), () => this.pushT({ t: 'bot', text: "Happy to help with that! In the live product I'd answer from " + this.org() + "'s real knowledge base — every program, policy, and detail your team has taught me." }));
  }
  fb(idx, val) { this.setState(s => ({ thread: s.thread.map((m, i) => i === idx ? { ...m, fb: m.fb === val ? 0 : val } : m) })); }
  copyMsg(idx) {
    this.setState(s => ({ thread: s.thread.map((m, i) => i === idx ? { ...m, copied: true } : m) }));
    this.after(2000, () => this.setState(s => ({ thread: s.thread.map((m, i) => i === idx ? { ...m, copied: false } : m) })));
  }

  startAnswer() {
    this.clearTimers();
    this.setState({ thread: [{ t: 'bot', text: this.cfg().answerIntro, quiet: true }], typing: false, qOverlayOpen: true, asked: [] });
  }
  askQ(f) {
    if (this.state.typing) return;
    this.setState(s => ({ qOverlayOpen: false, asked: s.asked.includes(f.q) ? s.asked : s.asked.concat([f.q]) }));
    this.pushT({ t: 'user', text: f.q });
    this.botTyping();
    const sp = this.sp();
    this.after(1400 / sp, () => this.pushT({ t: 'bot', text: f.a }));
    this.after(2000 / sp, () => this.pushT({ t: 'menu', id: 'reopen' + Date.now(), rows: [{ label: 'Browse common questions', reopen: true }] }));
  }

  playForm() {
    this.clearTimers();
    const form = this.cfg().form;
    this.setState({ thread: [], typing: false, formStep: 0, formPlaying: true, formDone: false });
    const sp = this.sp(); let t = 300;
    this.after(t / sp, () => this.pushT({ t: 'formhead' })); t += 600;
    form.steps.forEach((f, i) => {
      this.after(t / sp, () => this.botTyping()); t += 900;
      this.after(t / sp, () => this.pushT({ t: 'bot', text: f.q, quiet: true })); t += 650;
      if (f.sel) {
        const id = 'opt' + i;
        this.after(t / sp, () => this.pushT({ t: 'options', id, opts: f.sel })); t += 1500;
        this.after(t / sp, () => { this.hideItem(id); this.pushT({ t: 'user', text: f.sel[f.pick] }); this.setState({ formStep: i + 1 }); }); t += 450;
        if (f.gate) { this.after(t / sp, () => this.pushT({ t: 'gate', text: f.gate })); t += 550; }
      } else {
        this.after(t / sp, () => { this.pushT({ t: 'user', text: f.a }); this.setState({ formStep: i + 1 }); }); t += 850;
      }
    });
    this.after(t / sp, () => this.botTyping()); t += 900;
    this.after(t / sp, () => { this.pushT({ t: 'completion' }); this.setState({ formDone: true, formPlaying: false }); });
  }

  startSchedule() {
    this.clearTimers();
    const sc = this.cfg().schedule;
    this.setState({ thread: [], typing: false, slotDay: -1, slotTime: -1, confirmed: false, calShown: false });
    const sp = this.sp();
    this.after(400 / sp, () => this.botTyping());
    this.after(1300 / sp, () => this.pushT({ t: 'bot', text: sc.prompt, quiet: true }));
    this.after(1800 / sp, () => this.pushT({ t: 'daypick', id: 'days' }));
  }
  pickDay(i) {
    if (this.state.slotDay >= 0) return;
    const sc = this.cfg().schedule;
    this.setState({ slotDay: i }); this.hideItem('days');
    this.pushT({ t: 'picked', text: sc.days[i] + ' selected' });
    this.botTyping();
    const sp = this.sp();
    this.after(1100 / sp, () => this.pushT({ t: 'bot', text: "Here's what's open on " + sc.days[i] + ':', quiet: true }));
    this.after(1500 / sp, () => this.pushT({ t: 'options', id: 'slots', kind: 'slots', opts: sc.times }));
  }
  pickSlot(i) {
    if (this.state.slotTime >= 0) return;
    const sc = this.cfg().schedule;
    this.setState({ slotTime: i }); this.hideItem('slots');
    this.pushT({ t: 'user', text: sc.times[i] });
    this.after(600 / this.sp(), () => this.pushT({ t: 'confirm', id: 'confirm' }));
  }
  confirmBookingFn() {
    if (this.state.confirmed) return;
    this.hideItem('confirm');
    this.setState({ confirmed: true });
    const sp = this.sp();
    this.after(300 / sp, () => this.botTyping());
    this.after(1300 / sp, () => this.pushT({ t: 'bot', text: "You're all set! Your confirmation is on its way — with everything you need. See you soon!" }));
    this.after(900 / sp, () => this.setState({ calShown: true }));
  }

  // Every screen and stage change starts new content at the top of the page; without this you
  // stay scrolled where the previous screen's controls were (worst on a phone, where Next sits
  // far below the fold).
  scrollTop() {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  setStage(i) {
    this.clearTimers();
    this.scrollTop();
    const st = this.cfg().stages;
    const key = (st[i] || st[0]).key;
    this.setState({ stage: i, maxStage: Math.max(this.state.maxStage, i), qOverlayOpen: false, typing: false });
    if (key === 'engage') this.runEngage();
    else if (key === 'answer') this.startAnswer();
    else if (key === 'form') this.setState({ thread: [{ t: 'bot', text: this.cfg().formIntro, quiet: true }], formStep: 0, formPlaying: false, formDone: false });
    else if (key === 'schedule') this.startSchedule();
    else if (key === 'remind') { this.setState({ tlShown: 0 }); [1, 2, 3].forEach(n => this.after(300 + n * 550, () => this.setState({ tlShown: n }))); }
  }
  goExp(id) { this.clearTimers(); this.scrollTop(); this.setState({ view: id, overviewOpen: false, stage: 0, maxStage: 0, thread: [], typing: false, formStep: 0, formPlaying: false, formDone: false, slotDay: -1, slotTime: -1, confirmed: false, calShown: false, tlShown: 0, rescheduled: false, attended: false, attendLog: 0, qOverlayOpen: false, asked: [] }); }

  lens() {
    return {
      vol: {
        discover: { h: "One tap and {name} is talking", b: "No download, no account, no waiting for office hours — whichever door {name} walks through, a warm conversation starts instantly.", p: ["Works at 9pm on a Tuesday", "No app, no account, no hold music", "Identical journey on every channel"] },
        engage: { h: "It feels like texting a helpful person", b: "Answers are instant, specific, and never scripted-sounding. {name} forgets it's software.", p: ["Replies in seconds, 24/7", "Knows every program by name", "Never says 'please call our office'"] },
        answer: { h: "Every question, answered on the spot", b: "The little uncertainties that stop people are resolved in one sitting.", p: ["No waiting days for a reply", "Ask as many questions as needed", "Zero pressure, all reassurance"] },
        form: { h: "{name} never sees a form", b: "Everything is gathered in a minute of natural back-and-forth, with tappable answers. Nothing to abandon halfway.", p: ["Feels like conversation, not paperwork", "One question at a time", "Done in under a minute"] },
        schedule: { h: "Booked in three taps", b: "{name} picks a time that fits and gets an instant confirmation.", p: ["Real availability, live", "Instant confirmation", "No 'someone will call you back'"] },
        remind: { h: "Gentle nudges, total control", b: "{name} gets timely reminders and can reschedule with one tap.", p: ["Reminded at 48h and 24h", "One-tap reschedule", "Never feels like spam"] },
        attend: { h: "{name} shows up ready", b: "{name} arrives knowing where to park and what to expect — every question already answered.", p: ["Prepared and confident", "Welcomed by name", "The first hour of real impact"] },
        handoff: { h: "Continue with confidence", b: "{name} reaches the secure donation page already sure of her choice — and the conversation stays open if anything comes up.", p: ["No second-guessing at checkout", "Chat stays one tap away", "Gives on your trusted page"] },
        steward: { h: "Kept close, effortlessly", b: "{name} gets a warm thank-you, a receipt, and updates showing exactly what the gift did.", p: ["Immediate receipt", "Impact updates, not asks", "Feels seen, not processed"] },
        measure: { h: "{name}'s part is done", b: "From curiosity to commitment in one sitting — an experience good enough to tell a friend.", p: ["Minutes of their time", "Zero friction end to end", "Already confirmed and reminded"] },
      },
      coord: {
        discover: { h: "Every door, zero new inboxes", b: "Website, QR, Facebook, Instagram — all route into one trained AI. Nothing new to monitor.", p: ["One knowledge base behind every channel", "Print a QR code and it just works", "Live in 48 hours — we set it up"] },
        engage: { h: "You didn't type a word", b: "That whole conversation happened while you were in the field. The AI speaks in your voice.", p: ["Trained on your real programs", "Escalates to you only when needed", "Full transcript logged automatically"] },
        answer: { h: "Your FAQ, on autopilot", b: "Questions that used to be emails are answered before you've seen them.", p: ["~90% of inquiries self-served", "Answers stay consistent and current", "Update once, it's everywhere"] },
        form: { h: "A clean record, no data entry", b: "A complete, structured, gate-checked record lands in your system the moment they finish.", p: ["Synced to your CRM instantly", "Eligibility gates enforced automatically", "No half-finished paper forms"] },
        schedule: { h: "It's already on your calendar", b: "No phone tag. The appointment appeared with the full record attached.", p: ["Books against your real availability", "Record attached to the event", "Group limits respected"] },
        remind: { h: "Reminders you never send", b: "Confirmations, nudges, and reschedules all happen without you.", p: ["Reschedules handle themselves", "No-shows cut roughly in half", "Zero reminder spreadsheets"] },
        attend: { h: "Attendance takes zero clicks", b: "They check in, status flips to Active, and your pipeline updates itself.", p: ["Status updated automatically", "Pipeline always current", "No-shows flagged for follow-up"] },
        handoff: { h: "Donors arrive prepared", b: "By the time someone reaches your donation page their questions are answered — so far fewer abandon before giving.", p: ["Fewer abandoned gifts", "Questions handled before checkout", "Your donation page, unchanged"] },
        steward: { h: "Stewardship on autopilot", b: "Receipts, thank-yous, and impact updates all send themselves — donors stay warm with no work from you.", p: ["Receipts sent instantly", "Impact notes automated", "Retention without the admin"] },
        measure: { h: "Your week, given back", b: "Everything you just watched used to be your inbox. Customers report ~90% less admin time.", p: ["90% less admin time", "Every inquiry gets a great experience", "You focus on people, not paperwork"] },
      },
      exec: {
        discover: { h: "No missed first touches", b: "49.4% of engagement happens after hours. Every one is now captured instead of lost.", p: ["49.4% of engagement is after-hours", "Every channel becomes measurable", "No inquiry ever hits voicemail"] },
        engage: { h: "Every conversation is data", b: "Each exchange is logged, categorized, and tied to an outcome.", p: ["Conversations tracked end to end", "Intent surfaced automatically", "65.6% of conversations turn into action"] },
        answer: { h: "Answers become insight", b: "The questions people ask reveal what your website isn't saying.", p: ["Top questions surfaced monthly", "Content gaps identified", "Staff time redirected to mission"] },
        form: { h: "Complete data, every time", b: "No more pipelines full of half-records. Every record arrives complete and structured.", p: ["100% field completion", "Clean data in, clean reports out", "Compliance-ready records"] },
        schedule: { h: "Days become minutes", b: "Time from interest to scheduled action drops from days of email tag to minutes.", p: ["Interest-to-booked in minutes", "8x more applications", "Capacity without headcount"] },
        remind: { h: "No-shows, engineered down", b: "Systematic reminders and easy rescheduling protect every recruit.", p: ["Attendance rate: 87%", "Reschedules recovered, not lost", "Every touch measured"] },
        attend: { h: "Outcomes, not anecdotes", b: "You know who showed up — and what it took to get them there.", p: ["True cost-per-outcome visible", "Program-level data", "Board-ready numbers"] },
        handoff: { h: "Every referral, measured", b: "The handoff to your donation page is tracked, so you finally see how many conversations become real giving intent.", p: ["Referrals to giving page tracked", "Less pre-gift abandonment", "Works with your existing platform"] },
        steward: { h: "Lifetime value, protected", b: "First gifts become recurring revenue you can forecast.", p: ["Recurring-gift conversion tracked", "Donor retention up", "Predictable revenue"] },
        measure: { h: "The full funnel, finally", b: "From anonymous visitor to committed supporter — one continuous, measurable pipeline.", p: ["65.6% conversation-to-action rate", "8x application growth", "767% volunteer growth at Austin Angels"] },
      },
    };
  }

  experiences() {
    const org = this.org();
    const slug = org.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.org';
    return {
      volunteer: {
        title: 'Volunteer Recruitment', screenLabel: 'Volunteer Recruitment Demo',
        sub: 'Follow one volunteer’s journey from curiosity to scheduled orientation; wherever they are, whenever they reach out.',
        persona: 'Maya', personaRole: 'Volunteer',
        stages: [{ key: 'discover', label: 'Discover' }, { key: 'engage', label: 'Engage' }, { key: 'form', label: 'Collect Info' }, { key: 'schedule', label: 'Schedule' }, { key: 'remind', label: 'Remind' }, { key: 'measure', label: 'Measure Results' }],
        discover: { intro: 'Volunteer journeys don’t start at the same places. Whether Maya discovers ' + org + ' on a website, scans a QR code at an event, or sends an Instagram message, the conversation—and the journey—remain the same.', qrTag: 'VOLUNTEER WITH US', url: slug + '/volunteer', fbUser: 'Hi! I saw your post about mentors — how do I sign up?', fbBot: 'So glad you reached out! I can walk you through everything right here — no forms, no waiting.', igUser: 'Your reel about the Care Kit program — can anyone help with that?', igBot: "Absolutely — Care Kit teams support a local foster family each month. Want me to check what's open near you?" },
        engage: [
          { bot: 'Welcome to ' + org + '! I can help guide you and answer your questions. How can I help?' },
          { menu: ['Learn about mentoring', 'Sponsor a family', 'Make a donation', 'Common questions'], id: 'welcome' },
          { user: 'Tell me about your mentoring program.' },
          { bot: 'Our Pathways program pairs a caring mentor one-on-one with a young person preparing to age out of foster care. Mentors meet about two hours every other week — setting goals, building life skills, and creating real hope. What draws you to mentoring — becoming a mentor yourself, or support for a young person?' },
          { user: "I'd like to become a mentor." },
          { bot: "Wonderful! Ask me anything — requirements, training, time commitment — and when you're ready I'll start your application right here." },
          { menu: ['Attend a volunteering discovery session', 'Learn about the volunteer process'], id: 'sugg' },
        ],
        answerIntro: 'Happy to answer anything. Here are the questions we hear most:',
        faqs: [
          { q: 'Who do you help?', a: 'We walk alongside children, youth, and families in the foster care community across the Atlanta area — through Care Kit family support and Pathways youth mentoring.' },
          { q: 'What training do you provide?', a: 'Every volunteer starts with an orientation, and mentors get a 2-hour training plus ongoing coaching from our team.' },
          { q: 'How long is the commitment?', a: 'We ask for a minimum one-year commitment. Care Kit is 2-3 hours a month; Pathways mentors meet about 2 hours every other week.' },
          { q: 'Do you require background checks?', a: "Yes — all volunteers complete a background check. It's free, online, and takes about 10 minutes." },
          { q: 'How old do I need to be?', a: 'Volunteers must be at least 22 years old for our programs.' },
          { q: 'What areas do you serve?', a: 'We serve the greater Atlanta area, with Care Kit teams in most metro counties.' },
          { q: 'How can I contact you?', a: 'You can reach our team any time at hello@brightpath.org — or ask me anything right here, day or night.' },
          { q: 'Does it cost anything?', a: "There's no fee to volunteer. Care Kit teams typically share the cost of a monthly care box for their family." },
        ],
        formIntro: 'Ready to start your mentor application? It takes about a minute — right here in the chat.',
        formHeadTitle: 'Volunteer application',
        form: { total: 7, steps: [
          { q: 'Which program interests you most?', sel: ['Care Kit (Family Support)', 'Pathways (Youth Mentoring)', 'Tell me more about both', "I'm not sure yet"], pick: 1 },
          { q: "Great choice! What's your first name?", a: 'Maya' },
          { q: 'And your last name?', a: 'Thompson' },
          { q: "What's your email address?", a: 'maya.t@gmail.com' },
          { q: "What's the best phone number to reach you?", a: '(404) 555-0164' },
          { q: 'Are you at least 22 years old?', sel: ['Yes, I am 22 or older', 'No, I am under 22'], pick: 0, gate: 'Eligibility confirmed — age requirement met' },
          { q: 'Can you commit to one year with your volunteer family?', sel: ['Yes, I can commit to one year', 'No, I cannot commit to one year'], pick: 0, gate: 'Eligibility confirmed — one-year commitment' },
        ]},
        completion: { head: 'Form submitted', msg: 'Thank you, Maya! Your Pathways mentor application is in.', summaryLabel: 'Your information', fields: [['Program', 'Pathways'], ['Name', 'Maya Thompson'], ['Email', 'maya.t@gmail.com'], ['Phone', '(404) 555-0164']], next: ['We review your application', 'You schedule a discovery session', 'Check your email for confirmation'], cta: 'Schedule your discovery session' },
        profile: { title: 'Pipeline record', caption: 'Created in your CRM — zero data entry', fields: [['Program interest', 'Pathways'], ['First name', 'Maya'], ['Last name', 'Thompson'], ['Email', 'maya.t@gmail.com'], ['Phone', '(404) 555-0164'], ['Age 22+ (gate)', 'Yes — confirmed'], ['1-year commitment (gate)', 'Yes — confirmed']] },
        stageText: {
          engage: { title: 'A conversation, not a contact form', blurb: "It's 9:12 PM on a Tuesday. Maya opens the chat — the real widget, themed to " + org + ". Watch it answer naturally, or tap the menu rows yourself." },
          answer: { title: 'The little questions that stop people', blurb: 'Tap any question in the Common questions overlay. Each one used to be an email your team wrote by hand.' },
          form: { title: 'An application that feels like a chat', blurb: 'The real conversational form: one question at a time, tappable answers, and eligibility checked as she goes — no form to abandon.' },
          schedule: { title: 'Booked in three taps', blurb: "Your turn — pick a day, pick a time, confirm. Then watch the right side: it lands on the coordinator's calendar." },
        },
        schedule: { prompt: "Let's find your discovery session. Which day works best for you?", title: 'Discovery session', where: 'in person or virtual', coordTitle: "Jess's calendar", coordRole: 'Volunteer Coordinator', calEvent: 'Discovery session — Maya T.', calPlaceholder: "Jess's calendar will appear here the moment Maya confirms — no email, no phone tag.", confirmCta: 'Confirm this time', days: ['Tue, Jul 14', 'Wed, Jul 15', 'Thu, Jul 16', 'Fri, Jul 17', 'Sat, Jul 18'], times: ['10:00 AM', '12:30 PM', '5:30 PM'] },
        remind: { blurb: 'Between booking and showing up, the AI keeps Maya on track — and handles changes by itself.', items: [{ when: 'Immediately', title: 'Confirmation sent', body: 'Email + text with the date, location, and parking details — before Maya closes the chat.' }, { when: '48 hours before', title: 'First reminder', body: 'A friendly nudge with a one-tap reschedule link, just in case.' }, { when: '24 hours before', title: 'Final reminder', body: 'What to bring, where to park, and who to ask for at the door.' }], reschedCopy: "Maya's plans change. Normally that's a phone call, voicemail, and an empty seat.", reschedCta: 'Maya taps the reschedule link' },
        measure: { title: 'The whole journey, measured', blurb: "Maya's journey wasn't just smooth — every step of it became data your team can act on.", stats: [['11 min', 'first question → booked session'], ['0 min', 'of staff time involved'], ['100%', 'of steps tracked automatically']], funnelTitle: 'And Maya is one of hundreds — your funnel, last 30 days', funnel: [{ label: 'Visited a channel', n: '4,812', w: '100%', fill: '#CBD5E1' }, { label: 'Started a conversation', n: '1,347', w: '62%', fill: '#94A3B8' }, { label: 'Completed application', n: '214', w: '38%', fill: '#6ee7b7' }, { label: 'Booked a session', n: '168', w: '31%', fill: '#5FD089' }, { label: 'Attended', n: '146', w: '27%', fill: '#50C878' }] },
      },

      donor: {
        title: 'Donor Engagement', screenLabel: 'Donor Engagement Demo',
        sub: 'Follow one donor from curiosity to a confident decision to give — wherever they are, whenever they’re ready.',
        persona: 'Maya', personaRole: 'Donor',
        stages: [{ key: 'discover', label: 'Discover' }, { key: 'engage', label: 'Engage' }, { key: 'form', label: 'Build Giving Intent' }, { key: 'handoff', label: 'Continue Securely' }, { key: 'measure', label: 'Mission Intelligence' }],
        discover: { intro: 'Every gift starts with a reason. People discover causes in many different places — whether Maya finds ' + org + ' on a website, a QR code, Facebook, or Instagram, MyRecruiter meets her wherever she begins. The conversation, and the journey, stay the same.', qrTag: 'SUPPORT OUR MISSION', url: slug + '/give', fbUser: 'I saw your post — I’d like to give, but where does my gift actually go?', fbBot: 'Such a good question. Most gifts support mentoring, family strengthening, and volunteer programs — and you can designate yours. Want to talk it through?', igUser: 'Do you take donations through here?', igBot: 'I can answer anything about giving and, when you’re ready, take you to our secure donation page. Where would you like to start?' },
        engage: [
          { bot: 'Welcome to ' + org + '! Whether you’re just curious about our work or thinking about a gift, I’m here to help. What can I answer for you?' },
          { menu: ['Where does my gift go?', 'Can I give monthly?', 'Is my gift tax-deductible?'], id: 'welcome' },
          { user: 'I’d like to donate, but I’d like to understand where my gift goes.' },
          { bot: 'Absolutely. Most donations support mentoring, family strengthening, and volunteer programs — and you can designate your gift toward a specific initiative if you’d like.' },
          { user: 'Can I make this a monthly donation?' },
          { bot: 'Yes — you can choose a one-time or recurring gift when you’re ready. No pressure either way.' },
          { menu: ['Help me decide how to give', 'I’m ready to give'], id: 'sugg' },
        ],
        answerIntro: 'Happy to answer anything about giving. Here are the questions we hear most:',
        faqs: [
          { q: 'Where does my gift go?', a: 'Most gifts support mentoring, family strengthening, and volunteer programs — and our full financials are public and audited annually.' },
          { q: 'Can I give monthly?', a: 'Yes! Monthly gifts are our most impactful — you can start, change, or cancel anytime.' },
          { q: 'Is my gift tax-deductible?', a: 'Yes — we’re a registered 501(c)(3), and the donation page emails your receipt automatically.' },
          { q: 'Can I choose what my gift supports?', a: 'Absolutely — designate Care Kit, Pathways, or ‘where needed most.’' },
          { q: 'Is giving secure?', a: 'Completely — when you’re ready I’ll hand you to our secure, encrypted donation page. Your payment details never touch this chat.' },
          { q: 'Does my employer match gifts?', a: 'Many do! Tell me where you work and I can check whether your gift can be matched.' },
        ],
        formIntro: 'Let’s make sure you feel good about your gift before you give — a couple of quick questions, right here in the chat.\n\nTo continue the demo, click “Watch it fill in” on the right.',
        formHeadTitle: 'Your giving choices',
        form: { total: 2, steps: [
          { q: 'Would you like to make a one-time gift, or support our work monthly?', sel: ['One-time gift', 'Monthly gift'], pick: 1 },
          { q: 'Would you like your gift directed toward a specific program, or where it’s needed most?', sel: ['Where it’s needed most', 'Care Kit program', 'Pathways'], pick: 0, gate: 'Giving choices confirmed — ready for a confident gift' },
        ]},
        completion: { head: 'Ready to give', msg: 'You’re set up to give with confidence, Maya. Whenever you’re ready, I’ll take you to our secure donation page.', summaryLabel: 'Your giving choices', fields: [['Gift', 'Monthly'], ['Designation', 'Where needed most']], next: ['Monthly gift', 'Where needed most', 'Questions answered'], cta: 'Continue to Secure Donation' },
        profile: { title: 'Conversation summary', caption: 'Ready to hand off — the gift completes on your page', fields: [['Interest', 'Monthly giving'], ['Designation', 'Where needed most'], ['Questions asked', 'Impact · recurring · tax'], ['Confidence', 'High — ready to give'], ['Next step', 'Secure donation page']] },
        stageText: {
          engage: { title: 'Confidence begins with conversation', blurb: 'Every answer removes another reason not to give. Watch the AI answer honestly, or tap a menu row yourself.' },
          answer: { title: 'Answer the questions that build confidence', blurb: 'Tap any donor question — impact, designation, tax receipts. Transparency is what turns interest into a gift.' },
          form: { title: 'Giving should feel personal', blurb: 'A short, natural conversation helps Maya feel confident — how she’d like to give, and where — before she ever reaches the donation page.' },
        },
        remind: null, steward: null,
        handoff: { title: 'A trusted handoff', blurb: 'When donors are ready, MyRecruiter guides them to your existing, secure donation page — and stays available in the corner in case another question comes up. The gift itself completes on your trusted platform.', url: slug + '/donate', giftItems: [['Gift', 'Monthly'], ['Designation', 'Where needed most']] },
        measure: { title: 'The invisible journey becomes visible', blurb: 'Mission Intelligence reveals everything that happens before someone reaches your donation page — the part your team never used to see.', stats: [['982', 'donor conversations'], ['138', 'referred to your giving page'], ['49%', 'happened after hours']], funnelTitle: 'The donor journey before the donation page — last 30 days', callout: 'Mission Intelligence reveals the conversations that happen before someone reaches your donation page; the part of the donor journey your team has never been able to see.', funnel: [{ label: 'Discovered a channel', n: '3,204', w: '100%', fill: '#CBD5E1' }, { label: 'Started a conversation', n: '982', w: '61%', fill: '#94A3B8' }, { label: 'Asked about giving', n: '410', w: '34%', fill: '#6ee7b7' }, { label: 'Referred to donation page', n: '138', w: '17%', fill: '#50C878' }] },
      },

      program: {
        title: 'Program Enrollment', screenLabel: 'Program Enrollment Demo',
        sub: 'Follow the Rivera family from first question to an enrolled welcome call — no staff involved.',
        persona: 'the Rivera family', personaRole: 'Family',
        stages: [{ key: 'discover', label: 'Discover' }, { key: 'engage', label: 'Engage' }, { key: 'form', label: 'Intake' }, { key: 'schedule', label: 'Welcome Call' }, { key: 'remind', label: 'Remind' }, { key: 'measure', label: 'Measure Results' }],
        discover: { intro: 'The Rivera family needs support. Switch the channel — the same AI helps them find the right program and complete intake, wherever they reach out.', qrTag: 'FIND SUPPORT', url: slug + '/programs', fbUser: "We're a foster family — is there help available for us?", fbBot: 'Yes! Our Care Kit program surrounds foster families with a dedicated volunteer team. Can I check your area?', igUser: 'How do we sign up for family support?', igBot: 'I can complete your intake right here and book a welcome call. Want to get started?' },
        engage: [
          { bot: 'Welcome to ' + org + "! I can help you find the right support for your family. What's going on?" },
          { menu: ['We need family support', 'Youth aging out of care', 'What programs do you offer?', 'Common questions'], id: 'welcome' },
          { user: "We're a foster family — is there support available for us?" },
          { bot: 'Yes, absolutely. Our Care Kit program surrounds foster families with a dedicated volunteer team — monthly visits, meals, and consistent, wraparound support. I can check availability in your area and complete your intake right here.' },
          { user: 'That would be amazing.' },
          { bot: "Wonderful — I'm so glad you reached out. Ask me anything about how it works, and when you're ready I'll get your intake started." },
          { menu: ['Start our family intake', 'How does Care Kit work?'], id: 'sugg' },
        ],
        answerIntro: 'Happy to help. Here are the questions families ask most:',
        faqs: [
          { q: 'Who qualifies for support?', a: 'Foster and kinship families in the Atlanta metro, plus youth aging out of care.' },
          { q: 'What does Care Kit provide?', a: 'A dedicated volunteer team offering monthly visits, meals, and consistent wraparound support.' },
          { q: 'Is there a cost to us?', a: 'No — all family support programs are completely free.' },
          { q: "How long until we're matched?", a: 'Most families are matched within a few weeks of their welcome call.' },
          { q: 'What areas do you serve?', a: 'The greater Atlanta metro, with teams in most surrounding counties.' },
          { q: 'Do we need to apply?', a: 'Just a quick intake — I can complete it with you right here.' },
          { q: 'Who will we work with?', a: 'A trained, background-checked volunteer team, coordinated by our staff.' },
          { q: "What's the welcome call?", a: 'A 20-minute conversation so we match your family with the right team.' },
        ],
        formIntro: "Ready to complete your family's intake? Just a few quick questions.",
        formHeadTitle: 'Family intake',
        form: { total: 6, steps: [
          { q: 'Who are we supporting?', sel: ['A child in our care', 'Our whole family', 'A youth aging out'], pick: 1 },
          { q: 'Thank you. What is your family last name?', a: 'Rivera' },
          { q: 'What email should we use?', a: 'rivera.family@gmail.com' },
          { q: "And the best phone number?", a: '(404) 555-0177' },
          { q: 'Which program fits best?', sel: ['Care Kit (family support)', 'Pathways (youth mentoring)', 'Not sure yet'], pick: 0 },
          { q: 'Are you in the Atlanta metro area?', sel: ['Yes', 'No'], pick: 0, gate: 'Service area confirmed — Atlanta metro' },
        ]},
        completion: { head: 'Intake complete', msg: 'Thank you! Your family intake is complete.', summaryLabel: 'Your intake', fields: [['Support for', 'Whole family'], ['Family', 'Rivera'], ['Program', 'Care Kit'], ['Area', 'Atlanta metro']], next: ['We match your family with a team', 'You pick a welcome-call time', 'Check your email for confirmation'], cta: 'Book your welcome call' },
        profile: { title: 'Family intake', caption: 'Created in your case system — no data entry', fields: [['Support for', 'Our whole family'], ['Family name', 'Rivera'], ['Email', 'rivera.family@gmail.com'], ['Phone', '(404) 555-0177'], ['Program', 'Care Kit'], ['Service area (gate)', 'Atlanta — confirmed']] },
        stageText: {
          engage: { title: 'Meeting a family where they are', blurb: 'The Rivera family reaches out after hours. Watch the AI find the right program, or tap a menu row yourself.' },
          answer: { title: 'Answer every eligibility question', blurb: 'Tap any question — who qualifies, what areas you serve, what support actually looks like.' },
          form: { title: 'Intake without the paperwork', blurb: "The family's intake is gathered conversationally, with service-area checks — nothing to fill out and mail." },
          schedule: { title: 'Book the welcome call', blurb: "Pick a day and time — it lands on the coordinator's calendar with the family's intake attached." },
        },
        schedule: { prompt: "Let's book your 20-minute welcome call. Which day works best?", title: 'Welcome call', where: 'virtual · 20 min', coordTitle: "Sam's calendar", coordRole: 'Family Coordinator', calEvent: 'Welcome call — Rivera family', calPlaceholder: "Sam's calendar updates the instant the family confirms — no phone tag.", confirmCta: 'Confirm this time', days: ['Mon, Jul 13', 'Tue, Jul 14', 'Wed, Jul 15', 'Thu, Jul 16', 'Fri, Jul 17'], times: ['11:00 AM', '2:00 PM', '4:30 PM'] },
        remind: { blurb: 'Between booking and the welcome call, the AI keeps the family on track — and handles changes by itself.', items: [{ when: 'Immediately', title: 'Confirmation sent', body: "Email + text with the call link and what to expect — before they close the chat." }, { when: '48 hours before', title: 'First reminder', body: 'A friendly nudge with a one-tap reschedule link, just in case.' }, { when: '24 hours before', title: 'Final reminder', body: 'The call link and a short list of what to have handy.' }], reschedCopy: "Plans change with kids in the house. Normally that's phone tag and a missed call.", reschedCta: 'The family taps reschedule' },
        measure: { title: 'The whole journey, measured', blurb: "The Rivera family's enrollment wasn't just smooth — every step became data your team can act on.", stats: [['1 call', 'from inquiry to enrolled'], ['0', 'forms to chase down'], ['100%', 'intakes complete & structured']], funnelTitle: 'And the Riveras are one of many — enrollment funnel, last 30 days', funnel: [{ label: 'Visited a channel', n: '2,108', w: '100%', fill: '#CBD5E1' }, { label: 'Started a conversation', n: '724', w: '58%', fill: '#94A3B8' }, { label: 'Intake complete', n: '261', w: '34%', fill: '#6ee7b7' }, { label: 'Welcome call booked', n: '190', w: '26%', fill: '#5FD089' }, { label: 'Enrolled', n: '171', w: '23%', fill: '#50C878' }] },
      },

      event: {
        title: 'Event Registration', screenLabel: 'Event Registration Demo',
        sub: 'Follow Chris from a quick question to a paid family registration — no staff involved.',
        persona: 'Chris', personaRole: 'Attendee',
        showcase: { highlights: ['Chip-timed 5K', 'Kids 1K fun run', 'Race shirt included', 'Strollers welcome'] },
        stages: [{ key: 'discover', label: 'Discover' }, { key: 'engage', label: 'Engage' }, { key: 'form', label: 'Register' }, { key: 'remind', label: 'Remind' }, { key: 'measure', label: 'Measure Results' }],
        discover: { intro: 'Chris has questions about the fall 5K. Switch the channel — the same AI answers, registers, and takes payment, wherever he happens to be browsing.', qrTag: 'JOIN US AT THE 5K', url: slug + '/hoperun', fbUser: 'Is the Hope Run 5K family-friendly? Can I bring a stroller?', fbBot: 'Absolutely — strollers welcome, and kids run free. Want me to register your family?', igUser: 'How do I sign up for the run?', igBot: 'I can register you right here and take payment — takes about a minute. Ready?' },
        engage: [
          { bot: 'Welcome to ' + org + "! Here to help with the Hope Run 5K. What can I answer for you?" },
          { menu: ['Is it family-friendly?', 'How much does it cost?', 'Register now', 'Common questions'], id: 'welcome' },
          { user: 'Is the Hope Run 5K family-friendly? Can I bring a stroller?' },
          { bot: "Very — strollers and wagons are welcome, and there's a 1K fun run just for kids. Adults are $30 and kids run free. Want me to register your family right now?" },
          { user: 'Yes, let me sign up my family.' },
          { bot: "Love it! I'll get everyone registered right here. Ask me anything first, or let's dive in." },
          { menu: ['Register my family', "What's included?"], id: 'sugg' },
        ],
        answerIntro: 'Happy to help. Here are the questions we hear most:',
        faqs: [
          { q: 'Is it family-friendly?', a: "Very — strollers and wagons welcome, and there's a 1K fun run for kids." },
          { q: 'How much does it cost?', a: 'Adults are $30, kids run free. Registration includes a race shirt.' },
          { q: 'Where do I park?', a: "Free parking at the venue lot; I'll send exact directions with your confirmation." },
          { q: 'What time does it start?', a: 'Check-in opens at 7:30 AM, the 5K starts at 8:00, and the fun run follows.' },
          { q: 'Can I register my whole family?', a: 'Yes — I can register everyone in one go, right here.' },
          { q: 'Is it timed?', a: 'Yes, chip-timed, with results posted the same afternoon.' },
          { q: 'What if it rains?', a: "The run happens rain or shine — we'll email any weather updates race week." },
          { q: "When's bib pickup?", a: 'Race morning at check-in, or the Friday before at our office.' },
        ],
        formIntro: 'Ready to register? It takes under a minute — right here in the chat.',
        formHeadTitle: 'Event registration',
        form: { total: 5, steps: [
          { q: "Let's get you signed up! What's your first name?", a: 'Chris' },
          { q: 'And your last name?', a: 'Okafor' },
          { q: 'What email should we send your confirmation to?', a: 'chris.o@gmail.com' },
          { q: 'How many attendees?', sel: ['Just me', '2 (me + 1)', 'Family (2 adults, 2 kids)'], pick: 2 },
          { q: 'Great — that is $60 for 2 adults, kids free. How would you like to pay?', sel: ['Pay $60 now', "I'll pay at the door"], pick: 0, gate: 'Payment received — $60.00' },
        ]},
        completion: { head: 'You are registered!', msg: "You're all set for the Hope Run 5K, Chris!", summaryLabel: 'Your registration', fields: [['Event', 'Hope Run 5K'], ['Attendees', 'Family (2+2)'], ['Paid', '$60.00'], ['Email', 'chris.o@gmail.com']], next: ['Confirmation & receipt sent', 'Race-week reminders scheduled', 'Bib pickup details to follow'], cta: 'See your reminders' },
        profile: { title: 'Registration', caption: 'Synced to your event roster instantly', fields: [['First name', 'Chris'], ['Last name', 'Okafor'], ['Email', 'chris.o@gmail.com'], ['Attendees', 'Family (2+2)'], ['Payment (gate)', '$60 — paid']] },
        stageText: {
          engage: { title: 'Answer, then register', blurb: 'Maya has a quick question before signing up. Watch the AI answer, or tap a menu row yourself.' },
          answer: { title: 'Every event question, instantly', blurb: 'Tap any question — cost, parking, family-friendliness, what to bring.' },
          form: { title: 'Register for events in the chat', blurb: 'Registrations are handled conversationally. No separate form is required.' },
        },
        remind: { blurb: 'From registration to race day, the AI handles every reminder — and rebooks changes by itself.', items: [{ when: 'Immediately', title: 'Confirmation & receipt', body: "Chris gets his confirmation and receipt before he closes the chat." }, { when: '1 week before', title: 'Race-week details', body: 'Parking, schedule, and bib pickup — with a one-tap update link.' }, { when: 'Day before', title: 'Final reminder', body: 'Start time, weather, and what to bring for the whole family.' }], reschedCopy: "Can't make it after all? Normally that's a lost registration and an empty slot.", reschedCta: 'Chris taps the update link' },
        measure: { title: 'The whole journey, measured', blurb: "Chris's registration wasn't just fast — every step became data your team can act on.", stats: [['90 sec', 'question → registered & paid'], ['4', 'attendees in one chat'], ['0', 'staff touches needed']], funnelTitle: 'And Chris is one of many — registration funnel, last 30 days', funnel: [{ label: 'Saw the event', n: '5,420', w: '100%', fill: '#CBD5E1' }, { label: 'Started a conversation', n: '1,624', w: '60%', fill: '#94A3B8' }, { label: 'Started registration', n: '481', w: '30%', fill: '#6ee7b7' }, { label: 'Registered & paid', n: '372', w: '24%', fill: '#5FD089' }, { label: 'Checked in (proj.)', n: '331', w: '21%', fill: '#50C878' }] },
      },
    };
  }

  renderVals() {
    const s = this.state;
    const org = this.org();
    const E = '#50C878', NAVY = '#0F172A', LINE = '#E2E8F0', MUTED = '#64748B';
    const gold = '#a08a4a', goldDeep = '#8a7439', goldMuted = '#b4a67a';
    const isExp = this.isExp(s.view);
    const cfg = this.cfg();
    const key = this.curKey();
    const setView = v => () => { this.clearTimers(); this.scrollTop(); this.setState({ view: v, overviewOpen: false }); };
    const goExp = id => () => this.goExp(id);

    const navDef = [
      { label: 'Experience Center', v: 'home', d: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', go: setView('home') },
      { label: 'Volunteer Recruitment', v: 'volunteer', d: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75', go: goExp('volunteer') },
      { label: 'Donor Engagement', v: 'donor', d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z', go: goExp('donor') },
      { label: 'Program Enrollment', v: 'program', d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z M9 12h6 M9 16h4', go: goExp('program') },
      { label: 'Event Registration', v: 'event', d: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', go: goExp('event') },
      { label: 'Analytics', v: 'analytics', d: 'M3 3v18h18 M7 16v-5 M12 16V8 M17 16v-8', go: setView('analytics') },
      { label: 'Platform Overview', v: 'platform', d: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5', go: setView('platform') },
    ];
    const navItems = navDef.map(n => {
      const active = s.view === n.v;
      return { ...n, bg: active ? 'rgba(80,200,120,.16)' : 'transparent', fg: active ? '#6ee7b7' : 'rgba(255,255,255,.72)', hoverBg: active ? 'rgba(80,200,120,.16)' : 'rgba(255,255,255,.07)' };
    });

    const stageDefs = cfg.stages;
    const stageTotal = stageDefs.length;
    const stages = stageDefs.map((sd, i) => {
      const done = i < s.stage, current = i === s.stage, reachable = i <= s.maxStage;
      return {
        label: sd.label, hasLine: i < stageTotal - 1, flex: i < stageTotal - 1 ? '1 1 0%' : '0 0 auto',
        mark: done ? '✓' : String(i + 1),
        bg: done ? E : (current ? NAVY : '#fff'),
        fg: done || current ? '#fff' : MUTED,
        bd: done ? E : (current ? E : LINE),
        lc: current ? NAVY : (done ? '#1C7A45' : MUTED),
        anim: current ? 'ecPulse 2.2s ease-in-out infinite' : 'none',
        lineBg: done ? E : LINE,
        cursor: reachable ? 'pointer' : 'default',
        go: reachable ? (() => this.setStage(i)) : (() => {}),
      };
    });

    const perspNames = { vol: cfg.personaRole, coord: 'Coordinator', exec: 'Executive' };
    const perspPills = Object.keys(perspNames).map(k => ({
      label: perspNames[k], set: () => this.setState({ perspective: k }),
      bg: s.perspective === k ? NAVY : 'transparent', fg: s.perspective === k ? '#fff' : '#475569',
    }));
    const eyebrows = { vol: 'WHAT THE ' + cfg.personaRole.toUpperCase() + ' FEELS', coord: 'WHAT THE COORDINATOR SEES', exec: 'WHAT THE EXECUTIVE MEASURES' };
    const Lraw = this.lens()[s.perspective][key] || this.lens()[s.perspective].engage;
    const nm = cfg.persona;
    const fillName = str => str.replace(/\{name\}/g, nm);
    const L = { h: fillName(Lraw.h), b: fillName(Lraw.b), p: Lraw.p.map(fillName) };

    const chDef = [
      { id: 'website', label: 'Website', e: '🌐' },
      { id: 'qr', label: 'QR code', e: '📋' },
      { id: 'facebook', label: 'Facebook', e: '💬' },
      { id: 'instagram', label: 'Instagram', e: '📱' },
    ];
    const channels = chDef.map(c => ({
      ...c, set: () => this.setState({ channel: c.id }),
      bd: s.channel === c.id ? E : LINE, bg: s.channel === c.id ? '#E9F7EF' : '#fff', fg: s.channel === c.id ? '#065f46' : '#475569',
    }));

    const thread = s.thread.map((m, i) => {
      const optSrc = m.t === 'daypick' ? cfg.schedule.days : (m.kind === 'slots' ? cfg.schedule.times : (m.opts || []));
      return {
        ...m,
        isUser: m.t === 'user', isBot: m.t === 'bot',
        isMenu: m.t === 'menu' && !m.done,
        isGate: m.t === 'gate', isFormhead: m.t === 'formhead',
        isOptions: m.t === 'options' && !m.done && m.kind !== 'slots',
        isDaypick: (m.t === 'daypick' || m.kind === 'slots') && !m.done,
        isPicked: m.t === 'picked',
        isConfirm: m.t === 'confirm' && !m.done,
        isCompletion: m.t === 'completion',
        isShowcase: m.t === 'showcase',
        highlights: (cfg.showcase && cfg.showcase.highlights) || [],
        register: () => { const fi = cfg.stages.findIndex(x => x.key === 'form'); this.setStage(fi); },
        details: () => this.rowSend('What is included in registration?', m.id),
        showActions: m.t === 'bot' && !m.quiet,
        copied: !!m.copied,
        upFill: m.fb === 1 ? gold : 'none', downFill: m.fb === -1 ? gold : 'none',
        upStroke: m.fb === 1 ? goldDeep : goldMuted, downStroke: m.fb === -1 ? goldDeep : goldMuted,
        upBg: m.fb === 1 ? '#f0ecdd' : 'transparent', downBg: m.fb === -1 ? '#f0ecdd' : 'transparent',
        copy: () => this.copyMsg(i), up: () => this.fb(i, 1), down: () => this.fb(i, -1),
        rows: (m.rows || []).map((r, ri, arr) => ({
          label: r.label,
          bd: ri < arr.length - 1 ? '1px solid #f2eddc' : 'none',
          go: r.reopen ? (() => { this.hideItem(m.id); this.setState({ qOverlayOpen: true }); }) : (() => this.rowSend(r.label, m.id)),
        })),
        opts: optSrc.map((label, oi) => ({
          label,
          go: m.t === 'daypick' ? (() => this.pickDay(oi)) : (m.kind === 'slots' ? (() => this.pickSlot(oi)) : (() => {})),
        })),
      };
    });

    const faqChips = cfg.faqs.map(f => {
      const asked = s.asked.includes(f.q);
      return { q: f.q, asked, fg: asked ? '#8a7439' : '#475569', ask: () => this.askQ(f) };
    });

    const profDef = cfg.profile.fields;
    const profileFields = profDef.map((f, i) => {
      const filled = i < s.formStep;
      return { label: f[0], value: filled ? f[1] : 'Not collected yet', filled, empty: !filled, vc: filled ? NAVY : '#CBD5E1' };
    });

    const sc = cfg.schedule || { days: [], times: [], calEvent: '', coordTitle: '', coordRole: '', title: '', where: '', confirmCta: 'Confirm', calPlaceholder: '', prompt: '' };
    const apptDay = s.slotDay >= 0 ? sc.days[s.slotDay] : (sc.days[0] || '');
    const apptTime = s.slotTime >= 0 ? sc.times[s.slotTime] : (sc.times[0] || '');
    const apptLabel = apptDay + ' · ' + apptTime;
    const calRows = (sc.times || []).length ? (() => {
      const base = [sc.times[0], sc.times[1] || sc.times[0], sc.times[2] || sc.times[0]];
      const seen = {};
      return base.filter(t => { if (seen[t]) return false; seen[t] = 1; return true; }).map((t, idx) => {
        if (t === apptTime && s.calShown) return { t, isNew: true, grey: false, title: '' };
        if (idx === 0) return { t, grey: true, isNew: false, title: 'Team standup' };
        if (idx === 2) return { t, grey: true, isNew: false, title: 'Staff sync' };
        return { t, grey: false, isNew: false, title: '' };
      });
    })() : [];

    const rem = cfg.remind || { items: [], blurb: '', reschedCopy: '', reschedCta: '' };
    const tlItems = rem.items.slice(0, s.tlShown);
    const reschedDay = apptDay === (sc.days[sc.days.length - 1] || '') ? (sc.days[2] || sc.days[0] || '') : (sc.days[sc.days.length - 1] || '');
    const reschedTime = (sc.times && sc.times[0]) || '10:00 AM';
    const reschedLabel = reschedDay + ' · ' + reschedTime;
    const finalDay = s.rescheduled ? reschedDay : apptDay;
    const finalLabel = s.rescheduled ? reschedLabel : apptLabel;
    const reschedDayLong = 'It’s ' + finalDay + '.';

    const attendLogAll = ['Attendance recorded — 10:04 AM', 'Status updated: Applicant → Active volunteer', 'Pipeline and reports updated — no data entry'];
    const attendLogLines = attendLogAll.slice(0, s.attendLog);
    const checkIn = () => { this.setState({ attended: true, attendLog: 0 }); [1, 2, 3].forEach(n => this.after(200 + n * 500, () => this.setState({ attendLog: n }))); };

    const stText = (cfg.stageText || {})[key] || { title: '', blurb: '' };
    const stageEyebrow = 'STAGE ' + (s.stage + 1) + ' · ' + (stageDefs[s.stage] ? stageDefs[s.stage].label.toUpperCase() : '');

    const nextStage = () => { if (this.state.stage < stageTotal - 1) this.setStage(this.state.stage + 1); else setView('analytics')(); };
    const prevStage = () => { if (this.state.stage > 0) this.setStage(this.state.stage - 1); };
    const nextLabel = s.stage < stageTotal - 1 ? 'Next: ' + stageDefs[s.stage + 1].label : 'Open the full dashboards';

    const stew = cfg.steward || { blurb: '', timeline: [] };

    // Analytics (Premium Emerald) — stays volunteer-recruitment flavored
    const dashNames = { exec: 'Executive', mgr: 'Manager', ops: 'Operational' };
    const dashTabs = Object.keys(dashNames).map(k => ({ label: dashNames[k], set: () => this.setState({ dashTab: k }), bg: s.dashTab === k ? NAVY : 'transparent', fg: s.dashTab === k ? '#fff' : '#475569' }));
    const rangePills = ['7', '30', '90'].map(r => ({ label: r + 'D', set: () => this.setState({ dashRange: r }), bg: s.dashRange === r ? E : 'transparent', fg: s.dashRange === r ? '#fff' : '#64748B' }));
    const execSets = {
      '7': [['312', 'Conversations', '+9% vs prior week'], ['205', 'Actions completed', '65.7% of conversations'], ['51', 'Applications', '+12% vs prior week'], ['39', 'Sessions booked', '+8% vs prior week'], ['89%', 'Attendance rate', '+2 pts'], ['51.2%', 'After-hours share', 'captured automatically']],
      '30': [['1,347', 'Conversations', '+18% vs June'], ['884', 'Actions completed', '65.6% of conversations'], ['214', 'Applications', '+31% vs June'], ['168', 'Sessions booked', '+24% vs June'], ['87%', 'Attendance rate', '+9 pts since launch'], ['49.4%', 'After-hours share', 'captured automatically']],
      '90': [['3,904', 'Conversations', '+52% vs prior 90 days'], ['2,561', 'Actions completed', '65.6% of conversations'], ['598', 'Applications', '+61% vs prior 90 days'], ['471', 'Sessions booked', '+58% vs prior 90 days'], ['85%', 'Attendance rate', '+7 pts'], ['48.9%', 'After-hours share', 'captured automatically']],
    };
    const execKpis = execSets[s.dashRange].map(k => ({ v: k[0], l: k[1], d: k[2] }));
    const fFunnel = [
      { label: 'Form views', n: '1,240', w: '100%', fill: 'linear-gradient(90deg,#6ee7b7 0%,#50C878 100%)' },
      { label: 'Engaged', n: '843', w: '68%', fill: 'linear-gradient(90deg,#34d399 0%,#10b981 100%)' },
      { label: 'Started', n: '289', w: '23%', fill: 'linear-gradient(90deg,#10b981 0%,#059669 100%)' },
      { label: 'Completed', n: '214', w: '17%', fill: 'linear-gradient(90deg,#059669 0%,#047857 100%)' },
    ];
    const heatRowLabels = ['6–9a', '9–12p', '12–3p', '3–6p', '6–9p', '9–12a'];
    const heatVals = [[4, 5, 3, 4, 6, 8, 6], [12, 14, 11, 13, 12, 9, 7], [10, 11, 12, 10, 11, 13, 10], [13, 12, 14, 12, 10, 15, 11], [26, 34, 24, 28, 22, 18, 14], [15, 19, 16, 17, 12, 9, 8]];
    const heatMax = 34;
    const ramp = v => { if (!v) return { bg: '#f8faf9', fg: '#94a3b8' }; const t = v / heatMax; if (t >= 0.8) return { bg: '#50C878', fg: '#fff', peak: true }; if (t >= 0.6) return { bg: '#34d399', fg: '#fff' }; if (t >= 0.4) return { bg: '#6ee7b7', fg: '#047857' }; if (t >= 0.2) return { bg: '#a7f3d0', fg: '#047857' }; return { bg: '#d1fae5', fg: '#065f46' }; };
    const heatCells = [];
    heatVals.forEach((row, ri) => {
      heatCells.push({ isLabel: true, isCell: false, text: heatRowLabels[ri], bg: '', fg: '', glow: '' });
      row.forEach(v => { const c = ramp(v); heatCells.push({ isLabel: false, isCell: true, text: v ? String(v) : '', bg: c.bg, fg: c.fg, glow: c.peak ? '0 0 18px rgba(80,200,120,.35)' : 'none' }); });
    });
    const topQs = [
      { q: 'How long is the commitment?', n: 212, pct: '9.9', w: '100%' },
      { q: 'How old do I need to be?', n: 184, pct: '8.6', w: '87%' },
      { q: 'Do you require background checks?', n: 151, pct: '7.1', w: '71%' },
      { q: 'What training do you provide?', n: 126, pct: '5.9', w: '59%' },
      { q: 'What areas do you serve?', n: 98, pct: '4.6', w: '46%' },
    ];
    const bottlenecks = [
      { f: 'Phone number', pct: 8, w: '20%', fill: 'linear-gradient(90deg,#ffe4e6 0%,#fecdd3 100%)' },
      { f: 'Availability', pct: 12, w: '30%', fill: 'linear-gradient(90deg,#ffe4e6 0%,#fecdd3 100%)' },
      { f: 'Emergency contact', pct: 19, w: '48%', fill: 'linear-gradient(90deg,#fecdd3 0%,#fda4af 100%)' },
      { f: 'Experience (long answer)', pct: 27, w: '68%', fill: 'linear-gradient(90deg,#fda4af 0%,#fb7185 100%)' },
    ];
    const upcomingRows = [
      { mon: 'JUL', day: '14', t: 'Discovery session · 10:00 AM', sub: 'In person · Atlanta office', pill: '12 OF 15', pillBg: '#E9F7EF', pillFg: '#065f46' },
      { mon: 'JUL', day: '16', t: 'Discovery session · 5:30 PM', sub: 'Virtual · Zoom', pill: '9 OF 15', pillBg: '#E9F7EF', pillFg: '#065f46' },
      { mon: 'JUL', day: '18', t: 'Discovery session · 10:00 AM', sub: 'Includes Maya Thompson', pill: 'FULL', pillBg: '#FBBF24', pillFg: NAVY },
    ];
    const pipelineRows = [
      { l: 'New inquiries', n: 38, w: '81%', o: .45 },
      { l: 'In conversation', n: 24, w: '51%', o: .6 },
      { l: 'Application complete', n: 19, w: '40%', o: .75 },
      { l: 'Session scheduled', n: 31, w: '66%', o: .9 },
      { l: 'Attended this month', n: 47, w: '100%', o: 1 },
    ];
    const outcomeRows = [
      { l: 'Booked a discovery session', pct: 42, w: '42%', c: '#50C878' },
      { l: 'Question answered & resolved', pct: 31, w: '31%', c: '#6ee7b7' },
      { l: 'Info pack requested', pct: 15, w: '15%', c: '#a7f3d0' },
      { l: 'Handed to staff', pct: 8, w: '8%', c: '#FBBF24' },
      { l: 'Other', pct: 4, w: '4%', c: '#CBD5E1' },
    ];
    const opsKpis = [
      { l: 'Avg response time', v: '1.8s', sub: 'Any channel, any hour' },
      { l: 'Reschedules', v: '22', sub: '21 fully self-served' },
      { l: 'Cancellations', v: '9', sub: '14 seats recovered' },
      { l: 'Reminders sent', v: '486', sub: 'Zero sent by staff' },
    ];
    const reminderRows = [
      { l: 'Confirmation opened', pct: 98, w: '98%' },
      { l: '48-hour reminder opened', pct: 91, w: '91%' },
      { l: '24-hour reminder opened', pct: 86, w: '86%' },
    ];
    const channelRows = [
      { e: '🌐', l: 'Website chat', pct: 44, w: '100%' },
      { e: '📋', l: 'QR code', pct: 18, w: '41%' },
      { e: '💬', l: 'Facebook', pct: 14, w: '32%' },
      { e: '📱', l: 'Instagram', pct: 12, w: '27%' },
      { e: '💬', l: 'SMS', pct: 8, w: '18%' },
      { e: '✉️', l: 'Email', pct: 4, w: '9%' },
    ];

    const archNodes = [
      { t: 'Knowledge', b: "Your FAQs, programs, and policies — the engine's single source of truth.", d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
      { t: 'Forms', b: 'Collects structured information conversationally, with eligibility gates — nothing to abandon halfway.', d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z M9 12h6 M9 16h4' },
      { t: 'Scheduling', b: 'Books discovery sessions, calls, and appointments straight onto staff calendars.', d: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      { t: 'Automation', b: 'Confirmations, reminders, reschedules, and follow-ups — completely hands-free.', d: 'M21 12a9 9 0 1 1-9-9 M21 3v6h-6' },
      { t: 'Analytics', b: 'Every step measured: conversations, conversions, attendance, outcomes.', d: 'M3 3v18h18 M7 16v-5 M12 16V8 M17 16v-8' },
    ];

    return {
      orgName: org,
      isLanding: s.view === 'landing', notLanding: s.view !== 'landing',
      isHome: s.view === 'home', isExperience: isExp,
      welcomeOpen: s.welcomeOpen,
      beginExperience: () => this.setState({ welcomeOpen: false }),
      sectorOpts: [
        { id: 'nonprofit', label: 'Nonprofit', sub: 'Volunteers, donors, programs, events' },
        { id: 'hospice', label: 'Hospice', sub: 'Coming soon' },
      ].map(o => {
        const on = s.sector === o.id;
        const avail = o.id === 'nonprofit';
        return { label: o.label, sub: o.sub,
          set: avail ? (() => this.setState({ sector: o.id })) : (() => {}),
          cursor: avail ? 'pointer' : 'not-allowed',
          bd: on ? E : LINE, bg: on ? '#E9F7EF' : (avail ? '#fff' : '#F8FAFC'),
          dot: on ? E : '#CBD5E1', fill: on ? E : 'transparent',
          subc: avail ? '#64748B' : '#94A3B8' };
      }),
      perspIntro: [
        { e: '👤', role: 'Visitor', desc: 'Experience what someone sees when they engage with your organization.' },
        { e: '👥', role: 'Coordinator', desc: 'See what’s automated and removed from your team’s workload.' },
        { e: '📈', role: 'Executive', desc: 'Measure engagement, conversion, and organizational impact.' },
      ],
      isAnalytics: s.view === 'analytics', isPlatform: s.view === 'platform', isFinal: s.view === 'final',
      goHome: setView('home'), goLanding: setView('landing'),
      goVolunteer: goExp('volunteer'), goDonor: goExp('donor'), goProgram: goExp('program'), goEvent: goExp('event'),
      goAnalytics: setView('analytics'), goPlatform: setView('platform'), goFinal: setView('final'),
      openOverview: () => this.setState({ overviewOpen: true }),
      closeOverview: () => this.setState({ overviewOpen: false }),
      goHomeFromModal: setView('home'),
      overviewOpen: s.overviewOpen,
      navItems,

      expTitle: cfg.title, expSub: cfg.sub, expScreenLabel: cfg.screenLabel,
      stages, stageNum: s.stage + 1, stageTotal,
      kDiscover: key === 'discover', kEngage: key === 'engage', kSchedule: key === 'schedule',
      kForm: key === 'form', kRemind: key === 'remind', kAttend: key === 'attend', kSteward: key === 'steward', kMeasure: key === 'measure', kHandoff: key === 'handoff',
      sWidget: ['engage', 'answer', 'form', 'schedule'].includes(key),
      stageEyebrow, stageTitle: stText.title, stageBlurb: stText.blurb,
      canBack: s.stage > 0, nextStage, prevStage, nextLabel,
      perspPills, lensEyebrow: eyebrows[s.perspective], lensHead: L.h, lensBody: L.b, lensPoints: L.p,

      discoverIntro: cfg.discover.intro, discoverQrTag: cfg.discover.qrTag, discoverUrl: cfg.discover.url,
      discoverFbUser: cfg.discover.fbUser, discoverFbBot: cfg.discover.fbBot, discoverIgUser: cfg.discover.igUser, discoverIgBot: cfg.discover.igBot,
      channels, chWebsite: s.channel === 'website', chQr: s.channel === 'qr', chFb: s.channel === 'facebook', chIg: s.channel === 'instagram',

      showEventFlyer: this.curExp() === 'event' && key === 'engage',
      flyerHighlights: (cfg.showcase && cfg.showcase.highlights) || [],
      flyerRegister: () => { const fi = cfg.stages.findIndex(x => x.key === 'form'); this.setStage(fi); },
      thread, typing: s.typing, threadRef: this.threadRef,
      qOverlayOpen: s.qOverlayOpen, closeQOverlay: () => this.setState({ qOverlayOpen: false }),
      faqChips, faqCount: s.asked.length,
      formIdle: !s.formPlaying && !s.formDone, playForm: () => this.playForm(),
      watchFormLabel: cfg.watchFormLabel || 'Watch it fill in',
      formCount: s.formStep, formStepLabel: Math.min(s.formStep + 1, cfg.form.total), formPctW: Math.round(s.formStep / cfg.form.total * 100) + '%',
      formTotal: cfg.form.total, formHeadTitle: cfg.formHeadTitle, recordTitle: cfg.profile.title, recordCaption: cfg.profile.caption,
      profileFields,
      completionHead: cfg.completion.head, completionMsg: cfg.completion.msg, completionSummaryLabel: cfg.completion.summaryLabel,
      completionFields: cfg.completion.fields.map(f => ({ label: f[0], value: f[1] })), completionNext: cfg.completion.next, completionCta: cfg.completion.cta,

      confirmed: s.confirmed, notConfirmed: !s.confirmed, confirmBooking: () => this.confirmBookingFn(),
      apptLabel, apptDay, calRows,
      scheduleTitle: sc.title, scheduleWhere: sc.where, confirmCta: sc.confirmCta,
      coordCalTitle: sc.coordTitle, coordRole: sc.coordRole, calEventLabel: sc.calEvent, calPlaceholder: sc.calPlaceholder,

      remindEyebrow: 'STAGE ' + (s.stage + 1) + ' · REMIND', remindBlurb: rem.blurb, remindReschedCopy: rem.reschedCopy, reschedCta: rem.reschedCta,
      tlItems, tlDone: s.tlShown >= 3, notRescheduled: !s.rescheduled, rescheduled: s.rescheduled,
      doReschedule: () => this.setState({ rescheduled: true }), reschedLabel, finalLabel, reschedDayLong,
      reschedDotBg: s.rescheduled ? E : '#FBBF24',

      attended: s.attended, notAttended: !s.attended, checkIn,
      attendLabel: s.attended ? 'ATTENDED' : 'SCHEDULED',
      attendBg: s.attended ? '#E9F7EF' : '#F1F5F9', attendFg: s.attended ? '#065f46' : '#475569',
      attendLogLines, attendComplete: s.attendLog >= 3,

      stewardEyebrow: 'STAGE ' + (s.stage + 1) + ' · STEWARD', stewardTitle: 'The relationship starts now', stewardBlurb: stew.blurb, stewardTimeline: stew.timeline,
      handoffEyebrow: 'STAGE ' + (s.stage + 1) + ' · CONTINUE SECURELY', handoffTitle: (cfg.handoff && cfg.handoff.title) || '', handoffBlurb: (cfg.handoff && cfg.handoff.blurb) || '', handoffUrl: (cfg.handoff && cfg.handoff.url) || '', handoffGiftItems: ((cfg.handoff && cfg.handoff.giftItems) || []).map(x => ({ label: x[0], value: x[1] })),

      measureEyebrow: 'STAGE ' + (s.stage + 1) + ' · ' + (stageDefs[s.stage] ? stageDefs[s.stage].label.toUpperCase() : 'MEASURE RESULTS'), measureTitle: cfg.measure.title, measureBlurb: cfg.measure.blurb,
      measureStats: cfg.measure.stats.map(x => ({ v: x[0], l: x[1] })), measureFunnelTitle: cfg.measure.funnelTitle,
      measureCallout: cfg.measure.callout || false,
      funnelRows: cfg.measure.funnel,

      dashTabs, rangePills, dExec: s.dashTab === 'exec', dMgr: s.dashTab === 'mgr', dOps: s.dashTab === 'ops',
      execKpis, fFunnel, heatCells, topQs, bottlenecks, upcomingRows, pipelineRows, outcomeRows, opsKpis, reminderRows, channelRows,
      archNodes,
    };
  }

  // ── small icon helpers ──────────────────────────────────────────────────
  chk(size, stroke, sw) { return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: sw || 3, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M20 6 9 17l-5-5' })); }
  arrow(size, stroke) { return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M5 12h14 M12 5l7 7-7 7' })); }

  // ── LANDING ─────────────────────────────────────────────────────────────
  renderLanding(v) {
    const chip = (label) => h('span', { style: 'padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:11.5px;font-weight:600;color:rgba(255,255,255,.65)' }, label);
    const sep = () => h('span', { style: 'color:rgba(255,255,255,.3);font-size:12px;align-self:center' }, '→');
    const flow = ['Discover', 'Engage', 'Answer', 'Collect', 'Schedule', 'Remind', 'Show Up', 'Measure'];
    const flowKids = [];
    flow.forEach((f, i) => { flowKids.push(chip(f)); if (i < flow.length - 1) flowKids.push(sep()); });
    return h('div', { style: 'position:relative;min-height:100vh;background:var(--navy-900,#0F172A);overflow:hidden;display:flex;flex-direction:column;animation:ecFadeUp .35s ease-out both' },
      h('div', { style: 'position:absolute;top:-240px;right:-140px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(80,200,120,.16) 0%,rgba(80,200,120,0) 65%);pointer-events:none' }),
      h('div', { style: 'position:absolute;bottom:-280px;left:-220px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(80,200,120,.09) 0%,rgba(80,200,120,0) 65%);pointer-events:none' }),
      h('header', { class: 'ec-landing-header', style: 'position:relative;display:flex;align-items:center;justify-content:space-between;padding:26px 48px' },
        h('img', { src: '/images/logo-white.webp', alt: 'MyRecruiter', style: 'width:168px;display:block' }),
        h('div', { class: 'ec-landing-pill', style: 'display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);font-size:12.5px;font-weight:600;color:rgba(255,255,255,.85);white-space:nowrap' },
          h('span', { style: 'width:7px;height:7px;border-radius:50%;background:var(--emerald-500,#50C878);animation:ecLive 2s ease-in-out infinite' }),
          h('span', null, 'Experience Center · self-guided demo'))),
      h('main', { class: 'ec-landing-main', style: 'position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;max-width:860px;margin:0 auto;padding:20px 48px 40px;text-align:center' },
        h('div', { style: 'font-size:12px;font-weight:600;letter-spacing:.16em;color:var(--emerald-300,#6ee7b7);text-transform:uppercase' }, 'AI Engagement for Mission-Driven Organizations'),
        h('h1', { class: 'ec-landing-h1', style: 'margin:18px 0 0;font-size:64px;line-height:1.06;font-weight:700;letter-spacing:-0.02em;color:#fff' }, 'Turn Interest Into ', h('span', { style: 'background:linear-gradient(135deg,#75dbb7,#50C878,#3da060);-webkit-background-clip:text;background-clip:text;color:transparent' }, 'Action')),
        h('p', { style: 'margin:22px auto 0;max-width:620px;font-size:17px;line-height:1.65;color:rgba(255,255,255,.72)' }, 'Remove the friction between interest and action, so more volunteers, donors, and program participants join your mission.'),
        h('div', { style: 'display:flex;gap:14px;justify-content:center;margin-top:34px' },
          h(Btn, { size: 'lg', onClick: v.goHome }, 'Explore the Self-Guided Experience')),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:52px' }, flowKids)),
      h('footer', { style: 'position:relative;padding:22px 48px;text-align:center;font-size:12.5px;color:rgba(255,255,255,.4)' }, 'Trusted by National Angels · Austin Angels · Foster Village · Big Brothers Big Sisters of Central Texas'));
  }

  // ── APP SHELL (sidebar + main) ──────────────────────────────────────────
  renderShell(v) {
    const nav = h('nav', { class: 'ec-sidebar', style: 'width:238px;flex:none;background:var(--navy-900,#0F172A);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;box-sizing:border-box' },
      h('a', { href: 'https://www.myrecruiter.ai', class: 'ec-logo-link ec-sb-logo', style: 'padding:22px 20px 16px', title: 'Back to myrecruiter.ai' },
        h('img', { src: '/images/logo-white.webp', alt: 'MyRecruiter', style: 'width:148px;display:block' }),
        h('span', { class: 'ec-logo-hint' }, '← Back to site')),
      h('div', { class: 'ec-sb-eyebrow', style: 'padding:8px 22px 10px;font-size:10.5px;font-weight:700;letter-spacing:.14em;color:var(--slate-400,#94A3B8)' }, 'EXPERIENCE CENTER'),
      h('div', { class: 'ec-navlist', style: 'display:flex;flex-direction:column;gap:2px;padding:0 10px' },
        v.navItems.map((it, i) => h('div', { key: i, onClick: it.go, class: 'ec-hoverbg', style: `display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;background:${it.bg};color:${it.fg};font-size:13px;font-weight:600;transition:background .15s;--hb:${it.hoverBg}` },
          h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: it.d })),
          h('span', null, it.label)))),
      h('div', { class: 'ec-sb-back', style: 'margin-top:auto;padding:0 22px 12px' },
        h('a', { href: 'https://www.myrecruiter.ai', class: 'ec-site-link' },
          h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M19 12H5M12 19l-7-7 7-7' })), 'Back to myrecruiter.ai')),
      h('div', { class: 'ec-sb-cta', style: 'padding:0 16px 16px' },
        h('div', { style: 'background:var(--navy-800,#1E293B);border:1px solid var(--navy-700,#334155);border-radius:14px;padding:16px' },
          h('div', { style: 'font-size:13px;font-weight:700;color:#fff' }, 'Ready for the real thing?'),
          h('div', { style: 'font-size:12px;color:var(--slate-400,#94A3B8);line-height:1.5;margin:6px 0 12px' }, 'Live on your site in 48 hours. We handle everything.'),
          h(Btn, { size: 'sm', full: true, href: '/demo' }, 'Schedule a Live Demo'))));

    let main;
    if (v.isHome) main = this.renderHome(v);
    else if (v.isExperience) main = this.renderExperience(v);
    else if (v.isAnalytics) main = this.renderAnalytics(v);
    else if (v.isPlatform) main = this.renderPlatform(v);
    else if (v.isFinal) main = this.renderFinal(v);

    return h('div', { class: 'ec-shell', style: 'display:flex;min-height:100vh;background:var(--slate-50,#F8FAFC)' },
      nav,
      h('main', { style: 'flex:1;min-width:0;position:relative' }, main));
  }

  // ── HOME ────────────────────────────────────────────────────────────────
  renderHome(v) {
    const card = (bg, title, blurb, dur, go, preview) => h('div', { class: 'ec-card', style: 'background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .2s,transform .2s' },
      h('div', { style: 'height:148px;background:var(--mint,#E9F7EF);position:relative;overflow:hidden' }, preview),
      h('div', { style: 'padding:20px 22px 22px;display:flex;flex-direction:column;gap:9px;flex:1' },
        h('div', { style: 'font-size:17px;font-weight:700;color:var(--navy,#0F172A)' }, title),
        h('p', { style: 'margin:0;font-size:13.5px;line-height:1.55;color:var(--slate,#475569)' }, blurb),
        h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:8px' },
          h('span', { style: 'font-size:12px;font-weight:600;color:var(--muted,#64748B)' }, dur),
          h(Btn, { size: 'sm', onClick: go }, 'Start Experience'))));

    const volPrev = h(Fragment, null,
      h('div', { style: 'position:absolute;left:22px;top:26px;max-width:210px;padding:9px 12px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px 12px 12px 4px;font-size:11.5px;color:var(--slate,#475569);box-shadow:0 2px 8px rgba(15,23,42,.06)' }, 'What volunteer opportunities do you have?'),
      h('div', { style: 'position:absolute;right:22px;top:86px;max-width:220px;padding:9px 12px;background:#fbf8ee;border:1px solid #e8e2ce;border-radius:10px;font-size:11.5px;color:#334155;box-shadow:0 2px 8px rgba(15,23,42,.06)' }, 'Three ways to get involved — want to hear more?'));
    const donorPrev = h(Fragment, null,
      h('div', { style: 'position:absolute;left:22px;top:26px;max-width:220px;padding:9px 12px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px 12px 12px 4px;font-size:11.5px;color:var(--slate,#475569);box-shadow:0 2px 8px rgba(15,23,42,.06)' }, 'Where does my donation actually go?'),
      h('div', { style: 'position:absolute;right:22px;top:74px;max-width:220px;padding:9px 12px;background:#fbf8ee;border:1px solid #e8e2ce;border-radius:10px;font-size:11.5px;color:#334155;box-shadow:0 2px 8px rgba(15,23,42,.06)' }, '92¢ of every dollar funds direct programs.'));
    const progPrev = h('div', { style: 'position:absolute;left:22px;top:22px;right:22px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px;padding:12px 14px;box-shadow:0 2px 8px rgba(15,23,42,.06)' },
      h('div', { style: 'font-size:11px;font-weight:700;color:var(--navy,#0F172A);margin-bottom:8px' }, 'Intake — STEM Tutoring'),
      h('div', { style: 'display:flex;align-items:center;gap:8px;font-size:11px;color:var(--slate,#475569);padding:4px 0' }, this.chk(13, '#1C7A45', 2.5), h('span', null, 'Eligibility confirmed')),
      h('div', { style: 'display:flex;align-items:center;gap:8px;font-size:11px;color:var(--slate,#475569);padding:4px 0' }, this.chk(13, '#1C7A45', 2.5), h('span', null, 'Intake complete')),
      h('div', { style: 'display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted,#64748B);padding:4px 0' }, h('span', { style: 'width:13px;height:13px;border:1.5px dashed var(--muted,#64748B);border-radius:50%;box-sizing:border-box;flex:none' }), h('span', null, 'Assessment scheduled…')));
    const eventPrev = h(Fragment, null,
      h('div', { style: 'position:absolute;left:22px;top:22px;right:22px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px;padding:12px 14px;box-shadow:0 2px 8px rgba(15,23,42,.06);display:flex;align-items:center;gap:12px' },
        h('div', { style: 'flex:none;width:44px;text-align:center;background:var(--mint,#E9F7EF);border-radius:9px;padding:6px 0' },
          h('div', { style: 'font-size:9px;font-weight:700;letter-spacing:.08em;color:var(--emerald-700,#1C7A45)' }, 'OCT'),
          h('div', { style: 'font-size:16px;font-weight:700;color:var(--navy,#0F172A)' }, '17')),
        h('div', null,
          h('div', { style: 'font-size:11.5px;font-weight:700;color:var(--navy,#0F172A)' }, 'Hope Run 5K'),
          h('div', { style: 'font-size:10.5px;color:var(--muted,#64748B);margin-top:2px' }, '248 registered · reminders scheduled'))),
      h('div', { style: "position:absolute;left:22px;right:22px;top:96px;padding:8px 12px;background:#ECFDF3;border:1px solid #A7F3D0;border-radius:10px;font-size:11px;font-weight:600;color:#2F9D58;display:flex;align-items:center;gap:7px" },
        this.chk(14, 'currentColor', 2.4),
        h('span', null, "You're registered! Confirmation on its way.")));

    return h('div', { style: 'position:relative' },
      v.welcomeOpen ? this.renderWelcome(v) : null,
      h('div', { class: 'ec-page', style: 'max-width:1040px;margin:0 auto;padding:52px 44px 72px;animation:ecFadeUp .35s ease-out both' },
        h('div', { style: 'font-size:11.5px;font-weight:700;letter-spacing:.15em;color:var(--emerald-700,#1C7A45)' }, 'SELF-GUIDED DEMO'),
        h('h1', { style: 'margin:10px 0 0;font-size:36px;font-weight:700;letter-spacing:-0.015em;color:var(--navy,#0F172A)' }, 'The Nonprofit Experience'),
        h('p', { style: 'margin:12px 0 0;max-width:640px;font-size:15px;line-height:1.65;color:var(--slate,#475569);text-wrap:pretty' }, 'Four realistic scenarios, drawn from real nonprofit work. Each one walks a supporter from first question to completed action — with no staff involved.'),
        h('div', { style: 'display:flex;align-items:center;gap:12px;margin:22px 0 26px;padding:14px 18px;background:var(--navy-900,#0F172A);border-radius:14px' },
          h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#6ee7b7', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' })),
          h('span', { style: 'font-size:13px;line-height:1.5;color:rgba(255,255,255,.82)' }, 'Switch between Visitor, Coordinator, and Executive views at any time.')),
        h('div', { class: 'ec-grid', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:20px' },
          card('', 'Volunteer Recruitment', 'Experience how volunteer interest becomes a scheduled orientation automatically.', '≈ 3 min', v.goVolunteer, volPrev),
          card('', 'Donor Engagement', 'Build donor confidence through instant answers and guided next steps.', '≈ 2 min', v.goDonor, donorPrev),
          card('', 'Program Enrollment', 'Guide participants from their first questions to a completed intake and scheduled appointment.', '≈ 2 min', v.goProgram, progPrev),
          card('', 'Event Registration', 'Fill more seats by guiding attendees from registration to event day automatically.', '≈ 2 min', v.goEvent, eventPrev))));
  }

  renderWelcome(v) {
    // position:fixed, not absolute: absolute centred the modal inside the page's content box,
    // which on a phone is far taller than the screen, so it landed below the fold. Fixed centres
    // it on the viewport (and matches the Overview modal, which is already fixed).
    return h('div', { class: 'ec-welcome-overlay', style: 'position:fixed;inset:0;z-index:40;background:rgba(2,6,23,.55);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:32px;box-sizing:border-box;animation:ecFadeUp .25s ease-out both' },
      h('div', { style: 'width:560px;max-width:100%;max-height:calc(100vh - 64px);overflow:auto;background:#fff;border-radius:20px;box-shadow:0 32px 80px rgba(2,6,23,.5)' },
        h('div', { style: 'padding:30px 34px 22px;background:var(--navy-900,#0F172A);position:relative;overflow:hidden' },
          h('div', { style: 'position:absolute;top:-70px;right:-50px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(80,200,120,.18) 0%,rgba(80,200,120,0) 65%);pointer-events:none' }),
          h('div', { style: 'position:relative' },
            h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.15em;color:var(--emerald-300,#6ee7b7)' }, 'EXPERIENCE CENTER'),
            h('div', { style: 'font-size:24px;font-weight:700;letter-spacing:-.01em;color:#fff;margin-top:8px' }, 'Welcome to the Experience Center'),
            h('div', { style: 'font-size:14px;line-height:1.55;color:rgba(255,255,255,.72);margin-top:6px' }, 'Choose the experience that’s most relevant to you.'))),
        h('div', { style: 'padding:24px 34px 30px' },
          h('div', { class: 'ec-sector-row', style: 'display:flex;gap:12px' },
            v.sectorOpts.map((so, i) => h('div', { key: i, onClick: so.set, style: `flex:1;display:flex;align-items:center;gap:11px;padding:15px 16px;border-radius:13px;border:1.5px solid ${so.bd};background:${so.bg};cursor:${so.cursor};transition:border-color .15s,background .15s` },
              h('span', { style: `width:18px;height:18px;border-radius:50%;border:2px solid ${so.dot};display:flex;align-items:center;justify-content:center;flex:none;box-sizing:border-box` }, h('span', { style: `width:9px;height:9px;border-radius:50%;background:${so.fill}` })),
              h('div', { style: 'min-width:0' },
                h('div', { style: 'font-size:14.5px;font-weight:700;color:var(--navy,#0F172A)' }, so.label),
                h('div', { style: `font-size:11.5px;color:${so.subc}` }, so.sub))))),
          h('div', { style: 'height:1px;background:var(--line,#E2E8F0);margin:22px 0' }),
          h('div', { style: 'font-size:13px;font-weight:600;color:var(--navy,#0F172A)' }, 'See the same workflow through three different roles.'),
          h('div', { style: 'display:flex;flex-direction:column;gap:14px;margin-top:16px' },
            v.perspIntro.map((pi, i) => h('div', { key: i, style: 'display:flex;gap:12px;align-items:flex-start' },
              h('span', { style: 'font-size:18px;line-height:1.2;flex:none;width:24px;text-align:center' }, pi.e),
              h('div', null,
                h('div', { style: 'font-size:13.5px;font-weight:700;color:var(--navy,#0F172A)' }, pi.role),
                h('div', { style: 'font-size:12.5px;line-height:1.5;color:var(--slate,#475569)' }, pi.desc))))),
          h('div', { style: 'margin-top:26px;display:flex;justify-content:center' },
            h(Btn, { size: 'lg', onClick: v.beginExperience }, 'Begin Experience')))));
  }

  // ── EXPERIENCE (journey) ────────────────────────────────────────────────
  renderExperience(v) {
    return h('div', { class: 'ec-page', style: 'max-width:1120px;margin:0 auto;padding:30px 36px 64px;animation:ecFadeUp .35s ease-out both' },
      // header row
      h('div', { style: 'display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap' },
        h('div', null,
          h('a', { onClick: v.goHome, style: 'font-size:12.5px;font-weight:600;cursor:pointer' }, '← Experience Center'),
          h('h1', { style: 'margin:8px 0 0;font-size:27px;font-weight:700;letter-spacing:-0.01em;color:var(--navy,#0F172A)' }, v.expTitle),
          h('div', { style: 'margin-top:5px;font-size:13px;color:var(--muted,#64748B)' }, v.expSub)),
        h('div', { class: 'ec-persp', style: 'display:flex;align-items:center;gap:10px' },
          h('span', { style: 'font-size:11.5px;font-weight:600;color:var(--muted,#64748B)' }, 'Viewing as'),
          h('div', { class: 'ec-persp-pills', style: 'display:flex;gap:3px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:999px;padding:4px' },
            v.perspPills.map((pp, i) => h('div', { key: i, onClick: pp.set, style: `padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;background:${pp.bg};color:${pp.fg};transition:background .15s,color .15s;white-space:nowrap` }, pp.label))))),
      // stage rail
      h('div', { class: 'ec-rail', style: 'background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:16px;padding:18px 20px 14px;margin:20px 0 20px;display:flex;align-items:flex-start' },
        v.stages.map((st, i) => h('div', { key: i, class: 'ec-rail-item', style: `display:flex;align-items:flex-start;flex:${st.flex};min-width:0` },
          h('div', { onClick: st.go, style: `display:flex;flex-direction:column;align-items:center;gap:7px;cursor:${st.cursor};min-width:0` },
            h('div', { style: `width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-sizing:border-box;background:${st.bg};color:${st.fg};border:2px solid ${st.bd};animation:${st.anim};transition:background .3s,border-color .3s` }, st.mark),
            h('div', { style: `font-size:10.5px;font-weight:600;color:${st.lc};text-align:center;line-height:1.25;max-width:78px` }, st.label)),
          st.hasLine ? h('div', { style: `flex:1;height:2px;border-radius:2px;background:${st.lineBg};margin:14px 8px 0;transition:background .3s` }) : null))),
      // lens card
      h('div', { style: 'background:var(--navy-900,#0F172A);border-radius:18px;padding:20px 24px;margin-bottom:20px;position:relative;overflow:hidden;display:flex;flex-wrap:wrap;gap:16px 34px;align-items:center' },
        h('div', { style: 'position:absolute;top:-90px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(80,200,120,.15) 0%,rgba(80,200,120,0) 70%);pointer-events:none' }),
        h('div', { style: 'position:relative;flex:1 1 300px;min-width:0' },
          h('div', { style: 'font-size:10px;font-weight:700;letter-spacing:.14em;color:var(--emerald-300,#6ee7b7)' }, v.lensEyebrow),
          h('div', { style: 'font-size:17px;font-weight:700;color:#fff;margin:7px 0 6px;line-height:1.3' }, v.lensHead),
          h('p', { style: 'font-size:12.5px;line-height:1.55;color:var(--slate-400,#94A3B8);margin:0' }, v.lensBody)),
        h('div', { style: 'position:relative;flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:8px' },
          v.lensPoints.map((lp, i) => h('div', { key: i, style: 'display:flex;gap:9px;align-items:flex-start;font-size:12px;color:rgba(255,255,255,.87);line-height:1.4' },
            h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: '#50C878', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none;margin-top:2px' }, h('path', { d: 'M20 6 9 17l-5-5' })),
            h('span', null, lp))))),
      // content
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start' },
        h('div', { class: 'ec-journey-card', style: 'flex:1 1 560px;min-width:0;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:18px;padding:26px 28px;min-height:440px;box-sizing:border-box' },
          v.kDiscover ? this.renderDiscover(v) : null,
          v.sWidget ? this.renderWidgetStage(v) : null,
          v.kRemind ? this.renderRemind(v) : null,
          v.kAttend ? this.renderAttend(v) : null,
          v.kHandoff ? this.renderHandoff(v) : null,
          v.kSteward ? this.renderSteward(v) : null,
          v.kMeasure ? this.renderMeasure(v) : null)),
      // back / next
      h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:20px' },
        h('div', null, v.canBack ? h(Btn, { variant: 'outline', onClick: v.prevStage }, '← Back') : null),
        h('div', { style: 'display:flex;align-items:center;gap:16px' },
          h('span', { style: 'font-size:12px;font-weight:600;color:var(--muted,#64748B)' }, 'Stage ' + v.stageNum + ' of ' + v.stageTotal),
          h(Btn, { onClick: v.nextStage }, v.nextLabel))));
  }

  renderDiscover(v) {
    const mock = () => {
      if (v.chWebsite) return h('div', { style: 'background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px;box-shadow:0 10px 28px rgba(15,23,42,.08);overflow:hidden;width:420px;max-width:100%;animation:ecPop .25s ease-out both' },
        h('div', { style: 'display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--line-100,#F1F5F9);border-bottom:1px solid var(--line,#E2E8F0)' },
          h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--line,#E2E8F0)' }), h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--line,#E2E8F0)' }), h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--line,#E2E8F0)' }),
          h('span', { style: 'flex:1;margin-left:6px;background:#fff;border-radius:6px;padding:4px 10px;font-size:10.5px;color:var(--muted,#64748B)' }, v.discoverUrl)),
        h('div', { style: 'padding:16px;position:relative;height:196px;box-sizing:border-box' },
          h('div', { style: 'width:55%;height:13px;border-radius:4px;background:var(--line,#E2E8F0)' }),
          h('div', { style: 'width:80%;height:8px;border-radius:4px;background:var(--line-100,#F1F5F9);margin-top:10px' }),
          h('div', { style: 'width:72%;height:8px;border-radius:4px;background:var(--line-100,#F1F5F9);margin-top:6px' }),
          h('div', { style: 'width:40%;height:22px;border-radius:999px;background:var(--mint,#E9F7EF);margin-top:12px' }),
          h('div', { style: 'position:absolute;right:14px;bottom:58px;max-width:220px;padding:10px 13px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px 12px 4px 12px;font-size:11.5px;line-height:1.45;color:var(--navy,#0F172A);box-shadow:0 8px 20px rgba(15,23,42,.1);animation:ecFadeUp .4s .2s ease-out both' }, 'Hi! 👋 Ask me about ' + v.orgName + '.'),
          h('div', { style: 'position:absolute;right:14px;bottom:12px;width:38px;height:38px;border-radius:50%;background:#a1905f;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(161,144,95,.4);animation:ecPulseG 2.4s ease-in-out infinite' },
            h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })))));
      if (v.chQr) return h('div', { style: 'background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.08);width:250px;padding:22px;text-align:center;animation:ecPop .25s ease-out both' },
        h('div', { style: 'font-size:10px;font-weight:700;letter-spacing:.14em;color:#8a7439' }, v.discoverQrTag),
        h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A);margin-top:4px' }, v.orgName),
        h('svg', { width: 118, height: 118, viewBox: '0 0 25 25', style: 'margin:14px auto 0;display:block' },
          h('rect', { x: 0, y: 0, width: 25, height: 25, fill: '#fff' }),
          h('path', { fill: '#0F172A', d: 'M0 0h7v7H0zM18 0h7v7h-7zM0 18h7v7H0z' }),
          h('path', { fill: '#fff', d: 'M1 1h5v5H1zM19 1h5v5h-5zM1 19h5v5H1z' }),
          h('path', { fill: '#0F172A', d: 'M2 2h3v3H2zM20 2h3v3h-3zM2 20h3v3H2zM9 0h2v2H9zM13 1h2v2h-2zM9 4h2v3H9zM14 5h2v2h-2zM0 9h2v2H0zM3 10h2v2H3zM6 9h3v2H6zM10 9h2v2h-2zM13 10h3v2h-3zM18 9h2v3h-2zM21 10h2v2h-2zM23 13h2v2h-2zM9 13h2v2H9zM12 14h2v2h-2zM15 13h2v2h-2zM9 17h2v2H9zM13 18h2v2h-2zM18 14h2v2h-2zM20 17h3v2h-3zM18 20h2v3h-2zM21 21h2v2h-2zM9 21h2v2H9zM13 22h2v2h-2zM0 13h2v2H0zM4 14h2v2H4z' })),
        h('div', { style: 'font-size:11.5px;line-height:1.5;color:var(--slate,#475569);margin-top:14px' }, 'Scan to chat with us —', h('br'), 'day or night 🌙'));
      const dmHeader = (name, statusLabel, statusColor, chanLabel) => h('div', { style: 'display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line-100,#F1F5F9)' },
        h('div', { style: 'width:32px;height:32px;border-radius:50%;background:#a1905f;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex:none' }, 'AA'),
        h('div', { style: 'flex:1' },
          h('div', { style: 'font-size:13px;font-weight:700;color:var(--navy,#0F172A)' }, name),
          h('div', { style: 'font-size:10.5px;color:var(--emerald-700,#1C7A45);font-weight:600' }, statusLabel)),
        h('span', { style: 'padding:4px 9px;border-radius:999px;background:var(--line-100,#F1F5F9);font-size:10px;font-weight:700;color:var(--slate,#475569)' }, chanLabel));
      const dmBody = (user, bot) => h('div', { style: 'padding:16px;display:flex;flex-direction:column;gap:8px;background:var(--slate-50,#F8FAFC)' },
        h('div', { style: 'align-self:flex-end;max-width:78%;padding:9px 12px;background:#fbf8ee;border:1px solid #e8e2ce;color:#334155;border-radius:10px;font-size:12px;line-height:1.5' }, user),
        h('div', { style: 'align-self:flex-start;max-width:80%;padding:9px 12px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:14px 14px 14px 4px;font-size:12px;line-height:1.5;color:var(--navy,#0F172A);animation:ecFadeUp .4s .25s ease-out both' }, bot));
      if (v.chFb) return h('div', { style: 'background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.08);width:350px;max-width:100%;overflow:hidden;animation:ecPop .25s ease-out both' },
        dmHeader(v.orgName, 'Typically replies instantly', null, '💬 Messenger'), dmBody(v.discoverFbUser, v.discoverFbBot));
      if (v.chIg) return h('div', { style: 'background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.08);width:350px;max-width:100%;overflow:hidden;animation:ecPop .25s ease-out both' },
        dmHeader('@brightpath', 'Active now', null, '📱 Instagram DM'), dmBody(v.discoverIgUser, v.discoverIgBot));
      return null;
    };
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, 'STAGE 1 · DISCOVER'),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, 'Every journey starts at a different door'),
      h('p', { style: 'margin:0;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.discoverIntro),
      h('div', { class: 'ec-discover-grid', style: 'display:grid;grid-template-columns:172px minmax(0,1fr);gap:20px;margin-top:22px' },
        h('div', { style: 'display:flex;flex-direction:column;gap:8px' },
          v.channels.map((ch, i) => h('div', { key: i, onClick: ch.set, class: 'ec-hoverborder', style: `display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px;border:1.5px solid ${ch.bd};background:${ch.bg};cursor:pointer;transition:border-color .15s,background .15s` },
            h('span', { style: 'font-size:16px' }, ch.e),
            h('span', { style: `font-size:13px;font-weight:600;color:${ch.fg}` }, ch.label))),
          h('div', { style: 'margin-top:6px;font-size:11.5px;line-height:1.5;color:var(--muted,#64748B)' }, 'Same AI. Same knowledge. Same journey.')),
        h('div', { style: 'background:var(--slate-50,#F8FAFC);border:1px solid var(--line-100,#F1F5F9);border-radius:14px;min-height:300px;display:flex;align-items:center;justify-content:center;padding:22px' }, mock())));
  }

  renderWidgetStage(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, v.stageEyebrow),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, v.stageTitle),
      h('p', { style: 'margin:0;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.stageBlurb),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:22px;justify-content:center;align-items:flex-start;margin-top:20px' },
        this.renderWidgetShell(v),
        v.showEventFlyer ? this.renderEventFlyer(v) : null,
        v.kForm ? this.renderFormCard(v) : null,
        v.kSchedule ? this.renderScheduleCard(v) : null),
      v.kEngage ? h('div', { style: 'text-align:center;margin-top:14px' }, h('a', { onClick: () => this.runEngage(), style: 'font-size:12.5px;font-weight:600;cursor:pointer' }, '↻ Replay conversation')) : null);
  }

  renderWidgetShell(v) {
    const org = v.orgName;
    return h('div', { class: 'ec-widget', style: 'position:relative;width:380px;max-width:100%;height:560px;display:flex;flex-direction:column;background:#fffefb;border:1px solid #e8e2ce;border-top:2px solid #a08a4a;border-radius:12px;box-shadow:0 2px 24px rgba(15,23,42,.08);box-sizing:border-box;overflow:hidden;flex-shrink:0' },
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;flex:none' },
        h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:#8a7439;text-transform:uppercase' }, org),
        h('div', { style: 'display:flex;align-items:center;gap:14px' },
          h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: '#b4a67a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M21 4h-7 M10 4H3 M21 12h-9 M8 12H3 M21 20h-5 M12 20H3 M10 2v4 M12 10v4 M16 18v4' })),
          h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: '#b4a67a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M18 6 6 18 M6 6l12 12' })))),
      h('div', { ref: v.threadRef, style: 'flex:1;overflow-y:auto;padding:8px 20px 14px;display:flex;flex-direction:column;gap:16px' },
        v.thread.map((m, i) => h('div', { key: i, style: 'flex:none' }, this.renderMsg(m, v))),
        v.typing ? h('div', { style: 'flex:none' },
          h('div', { style: 'font-size:9px;font-weight:700;letter-spacing:.12em;color:#8a7439;margin-bottom:6px;text-transform:uppercase' }, org),
          h('div', { style: 'display:flex;gap:4px;padding:4px 0' },
            h('span', { style: 'width:5px;height:5px;border-radius:50%;background:#b4a67a;animation:ecDot 1.1s 0s infinite' }),
            h('span', { style: 'width:5px;height:5px;border-radius:50%;background:#b4a67a;animation:ecDot 1.1s .15s infinite' }),
            h('span', { style: 'width:5px;height:5px;border-radius:50%;background:#b4a67a;animation:ecDot 1.1s .3s infinite' }))) : null),
      h('div', { style: 'flex:none;padding:10px 16px 10px' },
        h('div', { style: 'display:flex;align-items:center;gap:9px;background:#fff;border:1px solid #e3dcc6;border-radius:999px;padding:8px 8px 8px 12px;box-shadow:0 1px 3px rgba(15,23,42,.05)' },
          h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#b4a67a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M12 5v14 M5 12h14' })),
          h('span', { style: 'flex:1;font-size:13.5px;color:#a99e7e' }, 'Ask a question…'),
          h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: '#b4a67a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3' })),
          h('div', { style: 'width:30px;height:30px;border-radius:50%;background:#fff;border:1px solid #e3dcc6;display:flex;align-items:center;justify-content:center;flex:none;box-sizing:border-box' },
            h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#c3b483', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M12 19V5 M5 12l7-7 7 7' })))),
        h('div', { style: 'display:flex;align-items:center;justify-content:center;gap:5px;margin-top:8px' },
          h('span', { style: 'font-size:9.5px;color:#b7ae93' }, 'Powered by'),
          h('img', { src: '/images/icon.webp', alt: '', style: 'width:14px;height:14px;border-radius:3px;display:block' }),
          h('span', { style: 'font-size:10px;font-weight:700;color:#8f8871' }, 'MyRecruiter'))),
      v.qOverlayOpen ? this.renderQOverlay(v) : null);
  }

  renderMsg(m, v) {
    if (m.isUser) return h('div', { style: 'display:flex;flex-direction:column;align-items:flex-end;animation:ecFadeUp .25s ease-out both' },
      h('div', { style: 'font-size:9px;font-weight:700;letter-spacing:.12em;color:#b4a67a;margin-bottom:5px' }, 'YOU'),
      h('div', { style: 'max-width:85%;background:#fbf8ee;border:1px solid #e8e2ce;border-radius:10px;padding:10px 13px;font-size:13px;line-height:1.55;color:#334155;box-sizing:border-box' }, m.text));
    if (m.isBot) return h('div', { style: 'animation:ecFadeUp .25s ease-out both' },
      h('div', { style: 'font-size:9px;font-weight:700;letter-spacing:.12em;color:#8a7439;margin-bottom:5px;text-transform:uppercase' }, v.orgName),
      h('div', { style: 'font-size:13.5px;line-height:1.6;color:#475569;white-space:pre-line' }, m.text),
      m.showActions ? h('div', { style: 'display:flex;align-items:center;gap:3px;margin-top:9px' },
        h('div', { onClick: m.copy, class: 'ec-hovercream', style: 'width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer' },
          h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: '#b4a67a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }))),
        h('div', { onClick: m.up, class: 'ec-hovercream', style: `width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:${m.upBg}` },
          h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: m.upFill, stroke: m.upStroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M7 10v12 M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z' }))),
        h('div', { onClick: m.down, class: 'ec-hovercream', style: `width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:${m.downBg}` },
          h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: m.downFill, stroke: m.downStroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'transform:rotate(180deg)' }, h('path', { d: 'M7 10v12 M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z' }))),
        m.copied ? h('span', { style: 'font-size:10.5px;font-weight:600;color:#8a7439;margin-left:5px' }, 'Copied') : null) : null);
    if (m.isMenu) return h('div', { style: 'border:1px solid #ede7d3;border-radius:10px;overflow:hidden;animation:ecFadeUp .25s ease-out both' },
      m.rows.map((r, i) => h('div', { key: i, onClick: r.go, class: 'ec-hovercream', style: `display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 15px;cursor:pointer;border-bottom:${r.bd};transition:background .15s` },
        h('span', { style: 'font-size:13px;font-weight:600;color:#0f172a' }, r.label),
        h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: '#c3b483', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M5 12h14 M12 5l7 7-7 7' })))));
    if (m.isGate) return h('div', { style: 'display:flex;align-items:center;gap:7px;justify-content:center;font-size:10.5px;font-weight:600;color:#8a7439;animation:ecFadeUp .25s ease-out both' },
      this.chk(12, '#a08a4a', 3), h('span', null, m.text));
    if (m.isFormhead) return h('div', { style: 'border:1px solid #ede7d3;border-radius:10px;padding:12px 15px;animation:ecFadeUp .25s ease-out both' },
      h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' },
        h('span', { style: 'font-size:13px;font-weight:700;color:#0f172a' }, v.formHeadTitle),
        h('span', { style: 'font-size:10.5px;font-weight:600;color:#8a7439' }, 'Step ' + v.formStepLabel + ' of ' + v.formTotal)),
      h('div', { style: 'height:3px;border-radius:2px;background:#f2eddc;margin-top:9px;overflow:hidden' }, h('div', { style: `height:100%;background:#a08a4a;border-radius:2px;width:${v.formPctW};transition:width .3s cubic-bezier(.16,1,.3,1)` })));
    if (m.isOptions) return h('div', { style: 'display:flex;flex-wrap:wrap;gap:7px;animation:ecFadeUp .25s ease-out both' },
      m.opts.map((o, i) => h('div', { key: i, onClick: o.go, class: 'ec-hovercream', style: 'padding:8px 14px;border-radius:16px;border:1px solid #ede7d3;background:#fff;font-size:12.5px;font-weight:600;color:#0f172a;cursor:pointer;transition:background .15s' }, o.label)));
    if (m.isDaypick) return h('div', { style: 'display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;animation:ecFadeUp .25s ease-out both' },
      m.opts.map((o, i) => h('div', { key: i, onClick: o.go, class: 'ec-hovercream', style: 'flex:0 0 auto;padding:8px 13px;border-radius:16px;border:1px solid #ede7d3;background:#fff;font-size:12.5px;font-weight:600;color:#0f172a;cursor:pointer;transition:background .15s' }, o.label)));
    if (m.isPicked) return h('div', { style: 'display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:#8a7439;animation:ecFadeUp .25s ease-out both' },
      this.chk(12, '#a08a4a', 3), h('span', null, m.text));
    if (m.isConfirm) return h('div', { style: 'border:1px solid #ede7d3;border-radius:10px;padding:14px 15px;animation:ecFadeUp .25s ease-out both' },
      h('div', { style: 'font-size:13px;font-weight:700;color:#0f172a' }, v.scheduleTitle),
      h('div', { style: 'font-size:12.5px;color:#64748b;margin-top:3px' }, v.apptLabel + ' · ' + v.scheduleWhere),
      h('div', { onClick: v.confirmBooking, class: 'ec-hovergold', style: 'margin-top:11px;display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;border-radius:999px;background:#a08a4a;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .15s' }, v.confirmCta));
    if (m.isCompletion) return h('div', { style: 'border:1px solid #ede7d3;border-radius:10px;padding:15px;animation:ecPop .3s ease-out both' },
      h('div', { style: 'display:flex;align-items:center;gap:8px' },
        h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: '#a08a4a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3' })),
        h('span', { style: 'font-size:13px;font-weight:700;color:#0f172a' }, v.completionHead)),
      h('div', { style: 'font-size:12.5px;line-height:1.55;color:#475569;margin-top:8px' }, v.completionMsg),
      h('div', { style: 'border:1px solid #f2eddc;border-radius:8px;margin-top:10px;padding:10px 12px;display:flex;flex-direction:column;gap:4px' },
        h('div', { style: 'font-size:10.5px;font-weight:700;color:#8a7439;margin-bottom:2px' }, v.completionSummaryLabel),
        v.completionFields.map((cf, i) => h('div', { key: i, style: 'display:flex;gap:6px;font-size:11.5px;color:#475569' }, h('span', { style: 'font-weight:600;color:#0f172a' }, cf.label + ':'), h('span', null, cf.value)))),
      h('div', { style: 'margin-top:10px' },
        h('div', { style: 'font-size:10.5px;font-weight:700;color:#8a7439' }, 'What happens next'),
        v.completionNext.map((cn, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:6px;font-size:11.5px;color:#475569;margin-top:5px' }, this.chk(11, '#a08a4a', 3), h('span', null, cn)))),
      h('div', { onClick: v.nextStage, class: 'ec-hovergold', style: 'margin-top:12px;display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;border-radius:999px;background:#a08a4a;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .15s' }, v.completionCta));
    return null;
  }

  renderQOverlay(v) {
    return h('div', { style: 'position:absolute;inset:0;background:rgba(255,254,251,.6);backdrop-filter:blur(2px);z-index:5' },
      h('div', { style: 'position:absolute;left:18px;right:18px;top:58px;background:#fff;border:1px solid #e8e2ce;border-radius:12px;box-shadow:0 16px 48px rgba(15,23,42,.16);overflow:hidden;animation:ecPop .18s ease-out both' },
        h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid #f2eddc' },
          h('span', { style: 'font-size:12.5px;font-weight:700;color:#8a7439' }, 'Common questions'),
          h('svg', { onClick: v.closeQOverlay, width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#b4a67a', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'cursor:pointer' }, h('path', { d: 'M18 6 6 18 M6 6l12 12' }))),
        v.faqChips.map((f, i) => h('div', { key: i, onClick: f.ask, class: 'ec-faq', style: `display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 15px;font-size:13px;color:${f.fg};cursor:pointer;transition:background .12s` },
          h('span', null, f.q),
          f.asked ? this.chk(12, '#a08a4a', 3) : null))));
  }

  renderEventFlyer(v) {
    return h('div', { style: 'flex:1 1 250px;max-width:310px;min-width:0' },
      h('div', { style: 'font-size:10px;font-weight:700;letter-spacing:.12em;color:#8a7439;margin-bottom:8px' }, 'EVENT FLYER · SURFACED IN CHAT'),
      h('div', { style: 'background:#fff;border:1px solid #ede7d3;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(15,23,42,.06)' },
        h('div', { style: 'height:118px;background:linear-gradient(135deg,#fbf8ee 0%,#f0ecdd 100%);display:flex;align-items:center;justify-content:center;border-bottom:1px solid #f2eddc' },
          h('div', { style: 'text-align:center' },
            h('svg', { width: 30, height: 30, viewBox: '0 0 24 24', fill: 'none', stroke: '#a08a4a', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M13.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M4 21l3.5-3.5L10 20l2.5-5 2 2.5 M9 12l2-3 3 1.5 2.5-1' })),
            h('div', { style: 'font-size:11.5px;font-weight:700;color:#8a7439;letter-spacing:.1em;margin-top:6px' }, 'OCT 17 · 8:00 AM'))),
        h('div', { style: 'padding:16px;display:flex;flex-direction:column;gap:8px' },
          h('span', { style: 'align-self:flex-start;padding:3px 9px;border-radius:999px;background:#fbf8ee;color:#8a7439;font-size:10px;font-weight:700;letter-spacing:.02em' }, 'Event'),
          h('div', { style: 'font-size:15px;font-weight:700;line-height:1.3;color:#0f172a' }, 'Hope Run 5K'),
          h('div', { style: 'font-size:12.5px;font-weight:600;line-height:1.4;color:#8a7439' }, 'Run for foster families this fall'),
          h('div', { style: 'font-size:13px;line-height:1.55;color:#475569' }, 'A family-friendly 5K and 1K fun run supporting ' + v.orgName + '. Every registration helps surround a local foster family with a year of support.'),
          h('span', { style: 'align-self:flex-start;padding:4px 10px;border-radius:999px;background:#fbf8ee;color:#8a7439;font-size:12px;font-weight:700' }, '$30 adults · kids free'),
          h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:2px' },
            v.flyerHighlights.map((hl, i) => h('div', { key: i, style: 'display:flex;align-items:flex-start;gap:6px;font-size:12px;line-height:1.4;color:#475569' },
              h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: '#8a7439', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none;margin-top:1px' }, h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3' })),
              h('span', null, hl)))),
          h('blockquote', { style: 'margin:2px 0 0;padding-left:12px;border-left:2px solid #e8e2ce;font-size:12px;font-style:italic;line-height:1.5;color:#64748b' }, '"Our whole family did it last year — such a joyful morning." — Chris O.'),
          h('div', { onClick: v.flyerRegister, class: 'ec-hovergold', style: 'margin-top:4px;display:flex;align-items:center;justify-content:center;padding:11px 16px;border-radius:999px;background:#a08a4a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s' }, 'Register now'))));
  }

  renderFormCard(v) {
    return h('div', { style: 'flex:1 1 230px;max-width:270px;min-width:0' },
      v.formIdle ? h('div', { style: 'border:1px dashed var(--line,#E2E8F0);border-radius:14px;padding:18px;text-align:center;margin-bottom:12px' },
        h('div', { style: 'display:inline-flex;align-items:center;gap:10px' },
          h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--emerald-600,#2FA45E)', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none;animation:ecNudge 1.1s ease-in-out infinite' }, h('path', { d: 'M5 12h14 M13 6l6 6-6 6' })),
          h('div', { style: 'animation:ecPulse 1.8s ease-in-out infinite;border-radius:999px' }, h(Btn, { size: 'sm', onClick: v.playForm }, v.watchFormLabel))),
        h('div', { style: 'font-size:11px;color:var(--muted,#64748B);margin-top:8px' }, '≈ 30 seconds, right in the chat')) : null,
      h('div', { style: 'border:1px solid var(--line,#E2E8F0);border-radius:14px;overflow:hidden;background:#fff' },
        h('div', { style: 'padding:13px 16px;background:var(--navy-900,#0F172A)' },
          h('div', { style: 'display:flex;align-items:center;justify-content:space-between' },
            h('span', { style: 'font-size:12px;font-weight:700;color:#fff' }, v.recordTitle),
            h('span', { style: 'font-size:11px;font-weight:700;color:var(--emerald-300,#6ee7b7)' }, v.formCount + '/' + v.formTotal)),
          h('div', { style: 'height:4px;border-radius:2px;background:rgba(255,255,255,.15);margin-top:9px;overflow:hidden' }, h('div', { style: `height:100%;border-radius:2px;background:var(--emerald-500,#50C878);width:${v.formPctW};transition:width .4s cubic-bezier(.16,1,.3,1)` }))),
        v.profileFields.map((pf, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid var(--line-100,#F1F5F9)' },
          pf.filled ? h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: '#1C7A45', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none;animation:ecPop .25s ease-out both' }, h('path', { d: 'M20 6 9 17l-5-5' })) : h('span', { style: 'width:13px;height:13px;border:1.5px dashed var(--line,#E2E8F0);border-radius:50%;box-sizing:border-box;flex:none' }),
          h('div', { style: 'min-width:0' },
            h('div', { style: 'font-size:9.5px;font-weight:700;letter-spacing:.06em;color:var(--muted,#64748B);text-transform:uppercase' }, pf.label),
            h('div', { style: `font-size:11.5px;font-weight:600;color:${pf.vc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis` }, pf.value)))),
        h('div', { style: 'display:flex;align-items:center;gap:7px;padding:10px 14px;background:var(--mint,#E9F7EF);font-size:10.5px;font-weight:600;color:var(--emerald-800,#065f46)' },
          h('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M21 12a9 9 0 1 1-9-9 M21 3v6h-6' })), v.recordCaption)));
  }

  renderScheduleCard(v) {
    return h('div', { style: 'flex:1 1 260px;max-width:330px;min-width:0' },
      v.notConfirmed ? h('div', { style: 'border:1px dashed var(--line,#E2E8F0);border-radius:14px;padding:20px;font-size:12.5px;line-height:1.6;color:var(--muted,#64748B);text-align:center' }, v.calPlaceholder) : null,
      v.confirmed ? h(Fragment, null,
        h('div', { style: 'border:1px solid var(--line,#E2E8F0);border-radius:16px;overflow:hidden;background:#fff;animation:ecFadeUp .3s ease-out both' },
          h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--navy-900,#0F172A)' },
            h('div', null,
              h('div', { style: 'font-size:12.5px;font-weight:700;color:#fff' }, v.coordCalTitle),
              h('div', { style: 'font-size:10.5px;color:var(--slate-400,#94A3B8)' }, v.coordRole + ' · ' + v.apptDay)),
            h('span', { style: 'display:inline-flex;align-items:center;gap:6px;font-size:9.5px;font-weight:700;color:var(--emerald-300,#6ee7b7)' }, h('span', { style: 'width:6px;height:6px;border-radius:50%;background:var(--emerald-500,#50C878);animation:ecLive 2s infinite' }), 'LIVE SYNC')),
          h('div', { style: 'background:#fff;padding:8px 0' },
            v.calRows.map((cr, i) => h('div', { key: i, style: 'display:flex;align-items:stretch;gap:10px;padding:4px 14px;min-height:38px' },
              h('div', { style: 'width:54px;flex:none;font-size:10.5px;color:var(--muted,#64748B);padding-top:8px;text-align:right' }, cr.t),
              h('div', { style: 'flex:1;border-left:1px solid var(--line-100,#F1F5F9);padding-left:10px;display:flex;align-items:center' },
                cr.grey ? h('div', { style: 'flex:1;padding:6px 10px;border-radius:8px;background:var(--line-100,#F1F5F9);font-size:11px;font-weight:600;color:var(--slate,#475569)' }, cr.title) : null,
                cr.isNew ? h('div', { style: 'flex:1;padding:6px 10px;border-radius:8px;background:var(--mint,#E9F7EF);border:1.5px solid var(--emerald-500,#50C878);font-size:11px;font-weight:700;color:var(--emerald-800,#065f46);animation:ecPop .35s .5s cubic-bezier(.16,1,.3,1) both;box-shadow:0 6px 18px rgba(80,200,120,.25)' }, v.calEventLabel + ' ', h('span', { style: 'font-weight:600;color:var(--emerald-700,#1C7A45)' }, '· auto-booked')) : null))))),
        h('div', { style: 'margin-top:14px;display:flex;flex-direction:column;gap:7px' },
          ['No emails.', 'No phone tag.', 'No manual scheduling.'].map((t, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:9px;font-size:13px;font-weight:700;color:var(--navy,#0F172A)' }, this.chk(14, '#1C7A45', 3), t)))) : null);
  }

  renderRemind(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, v.remindEyebrow),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, 'Reminders nobody has to send'),
      h('p', { style: 'margin:0 0 22px;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.remindBlurb),
      h('div', { style: 'max-width:560px;margin:0 auto' },
        v.tlItems.map((tl, i) => h('div', { key: i, style: 'display:flex;gap:16px;animation:ecFadeUp .35s ease-out both' },
          h('div', { style: 'display:flex;flex-direction:column;align-items:center;flex:none;width:26px' },
            h('div', { style: 'width:12px;height:12px;border-radius:50%;background:var(--emerald-500,#50C878);border:3px solid var(--mint,#E9F7EF);box-sizing:content-box' }),
            h('div', { style: 'width:2px;flex:1;background:var(--line,#E2E8F0);min-height:26px' })),
          h('div', { style: 'padding-bottom:18px;min-width:0;flex:1' },
            h('div', { style: 'font-size:10.5px;font-weight:700;letter-spacing:.08em;color:var(--emerald-700,#1C7A45);text-transform:uppercase' }, tl.when),
            h('div', { style: 'font-size:14px;font-weight:700;color:var(--navy,#0F172A);margin-top:3px' }, tl.title),
            h('div', { style: 'font-size:12.5px;color:var(--slate,#475569);margin-top:3px;line-height:1.5' }, tl.body)))),
        v.tlDone ? h('div', { style: 'display:flex;gap:16px;animation:ecFadeUp .35s ease-out both' },
          h('div', { style: 'display:flex;flex-direction:column;align-items:center;flex:none;width:26px' },
            h('div', { style: `width:12px;height:12px;border-radius:50%;background:${v.reschedDotBg};border:3px solid var(--amber-bg,#FFFBEB);box-sizing:content-box` })),
          h('div', { style: 'min-width:0;flex:1' },
            h('div', { style: 'font-size:10.5px;font-weight:700;letter-spacing:.08em;color:var(--amber-500,#F59E0B);text-transform:uppercase' }, 'Life happens'),
            h('div', { style: 'font-size:14px;font-weight:700;color:var(--navy,#0F172A);margin-top:3px' }, 'Need to reschedule?'),
            v.notRescheduled ? h(Fragment, null,
              h('div', { style: 'font-size:12.5px;color:var(--slate,#475569);margin:3px 0 12px;line-height:1.5' }, v.remindReschedCopy),
              h(Btn, { variant: 'outline', size: 'sm', onClick: v.doReschedule }, v.reschedCta)) : null,
            v.rescheduled ? h('div', { style: 'margin-top:8px;border:1px solid var(--line,#E2E8F0);border-radius:12px;padding:14px 16px;animation:ecPop .3s ease-out both' },
              h('div', { style: 'font-size:12px;color:var(--muted,#64748B);text-decoration:line-through' }, v.apptLabel),
              h('div', { style: 'display:flex;align-items:center;gap:8px;margin-top:6px' },
                h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: '#1C7A45', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M5 12h14 M12 5l7 7-7 7' })),
                h('span', { style: 'font-size:13px;font-weight:700;color:var(--navy,#0F172A)' }, v.reschedLabel),
                h('span', { style: 'padding:3px 8px;border-radius:999px;background:var(--mint,#E9F7EF);font-size:9.5px;font-weight:700;color:var(--emerald-800,#065f46)' }, 'RE-BOOKED IN 20 SEC')),
              h('div', { style: 'font-size:12px;color:var(--slate,#475569);margin-top:9px;line-height:1.5' }, 'New time appeared on the calendar instantly. ', h('strong', null, 'Staff never got involved.'))) : null)) : null));
  }

  renderAttend(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, 'STAGE 7 · SHOW UP'),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, 'Discovery session day'),
      h('p', { style: 'margin:0;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.reschedDayLong + ' Maya walks in — prepared, because every question was already answered.'),
      h('div', { style: 'max-width:520px;margin:20px auto 0;border:1px solid var(--line,#E2E8F0);border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06)' },
        h('div', { style: 'padding:14px 18px;background:var(--navy-900,#0F172A);display:flex;align-items:center;justify-content:space-between' },
          h('div', null,
            h('div', { style: 'font-size:13px;font-weight:700;color:#fff' }, 'Discovery session'),
            h('div', { style: 'font-size:11px;color:var(--slate-400,#94A3B8)' }, v.finalLabel + ' · Atlanta office')),
          h('span', { style: 'padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:10px;font-weight:700;color:#fff' }, '15 ATTENDEES')),
        h('div', { style: 'background:#fff;padding:16px 18px' },
          h('div', { style: 'display:flex;align-items:center;gap:12px' },
            h('div', { style: 'width:38px;height:38px;border-radius:50%;background:var(--mint,#E9F7EF);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--emerald-800,#065f46);flex:none' }, 'MT'),
            h('div', { style: 'flex:1' },
              h('div', { style: 'font-size:13.5px;font-weight:700;color:var(--navy,#0F172A)' }, 'Maya Thompson'),
              h('div', { style: 'font-size:11px;color:var(--muted,#64748B)' }, 'Interested in: Mentoring · Events')),
            h('span', { style: `padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700;background:${v.attendBg};color:${v.attendFg};transition:background .3s,color .3s` }, v.attendLabel)),
          v.notAttended ? h('div', { style: 'text-align:center;margin-top:18px;padding-top:16px;border-top:1px solid var(--line-100,#F1F5F9)' }, h(Btn, { onClick: v.checkIn }, 'Maya checks in at the door')) : null,
          v.attended ? h('div', { style: 'margin-top:16px;padding-top:14px;border-top:1px solid var(--line-100,#F1F5F9);display:flex;flex-direction:column;gap:8px' },
            v.attendLogLines.map((al, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--slate,#475569);animation:ecFadeUp .3s ease-out both' }, this.chk(13, '#1C7A45', 3), h('span', null, al)))) : null),
        v.attendComplete ? h('div', { style: 'padding:13px 18px;background:var(--mint,#E9F7EF);font-size:12.5px;font-weight:700;color:var(--emerald-800,#065f46);text-align:center;animation:ecFadeUp .3s ease-out both' }, 'Journey complete — every step handled automatically.') : null));
  }

  renderHandoff(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, v.handoffEyebrow),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, v.handoffTitle),
      h('p', { style: 'margin:0;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.handoffBlurb),
      h('div', { style: 'max-width:600px;margin:22px auto 0;border:1px solid var(--line,#E2E8F0);border-radius:16px;overflow:hidden;box-shadow:0 14px 36px rgba(15,23,42,.1);background:#fff' },
        h('div', { style: 'display:flex;align-items:center;gap:8px;padding:11px 14px;background:var(--line-100,#F1F5F9);border-bottom:1px solid var(--line,#E2E8F0)' },
          h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--line,#E2E8F0)' }), h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--line,#E2E8F0)' }), h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--line,#E2E8F0)' }),
          h('div', { style: 'flex:1;margin-left:6px;display:flex;align-items:center;gap:6px;background:#fff;border-radius:6px;padding:5px 11px;font-size:10.5px;color:var(--slate,#475569)' },
            h('svg', { width: 11, height: 11, viewBox: '0 0 24 24', fill: 'none', stroke: '#1C7A45', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4' })), v.handoffUrl),
          h('span', { style: 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:var(--mint,#E9F7EF);font-size:9.5px;font-weight:700;color:var(--emerald-800,#065f46)' }, 'SECURE')),
        h('div', { style: 'position:relative;padding:28px 28px 30px;background:var(--slate-50,#F8FAFC);min-height:320px;box-sizing:border-box' },
          h('div', { style: 'text-align:center' },
            h('div', { style: 'font-size:10.5px;font-weight:700;letter-spacing:.13em;color:var(--emerald-700,#1C7A45)' }, v.orgName + ' · SECURE GIVING'),
            h('div', { style: 'font-size:19px;font-weight:700;color:var(--navy,#0F172A);margin-top:5px' }, 'Complete your gift')),
          h('div', { style: 'max-width:340px;margin:18px auto 0;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:14px;padding:18px 20px;box-shadow:0 8px 24px rgba(15,23,42,.06)' },
            h('div', { style: 'font-size:10px;font-weight:700;letter-spacing:.11em;color:var(--muted,#64748B)' }, 'YOUR GIFT'),
            h('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:12px' },
              v.handoffGiftItems.map((gi, i) => h('div', { key: i, style: 'display:flex;align-items:center;justify-content:space-between' },
                h('span', { style: 'font-size:12.5px;color:var(--slate,#475569)' }, gi.label),
                h('span', { style: 'font-size:12.5px;font-weight:700;color:var(--navy,#0F172A)' }, gi.value)))),
            h('div', { style: 'height:1px;background:var(--line-100,#F1F5F9);margin:14px 0' }),
            h('div', { style: 'display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--muted,#64748B)' },
              h('svg', { width: 11, height: 11, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, h('path', { d: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4' })), 'Secure checkout on your donation platform'),
            h('div', { style: 'margin-top:14px;padding:11px 16px;border-radius:999px;background:var(--emerald-500,#50C878);color:#fff;font-size:13px;font-weight:700;text-align:center;box-shadow:0 8px 20px rgba(80,200,120,.3)' }, 'Give securely →')),
          h('div', { style: 'max-width:420px;margin:14px auto 26px;text-align:center;font-size:11px;line-height:1.5;color:var(--muted,#64748B)' }, 'Maya completes her gift here, on your trusted page. MyRecruiter never sees or stores payment details.'),
          h('div', { style: 'position:absolute;right:18px;bottom:18px;display:flex;align-items:flex-end;gap:9px;max-width:58%;justify-content:flex-end' },
            h('div', { style: 'max-width:186px;background:#fffefb;border:1px solid #e8e2ce;border-radius:12px 12px 4px 12px;padding:9px 12px;font-size:11px;line-height:1.45;color:#475569;box-shadow:0 6px 16px rgba(15,23,42,.1)' }, 'Still here if any questions come up! 💬'),
            h('div', { style: 'width:40px;height:40px;border-radius:50%;background:var(--emerald-500,#50C878);display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 8px 20px rgba(80,200,120,.4);animation:ecPulse 2.4s ease-in-out infinite' },
              h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })))))));
  }

  renderSteward(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, v.stewardEyebrow),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, v.stewardTitle),
      h('p', { style: 'margin:0;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.stewardBlurb),
      h('div', { style: 'max-width:520px;margin:20px auto 0;border:1px solid var(--line,#E2E8F0);border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06)' },
        h('div', { style: 'padding:16px 18px;background:var(--navy-900,#0F172A);display:flex;align-items:center;justify-content:space-between' },
          h('div', null,
            h('div', { style: 'font-size:13px;font-weight:700;color:#fff' }, 'Recurring gift active'),
            h('div', { style: 'font-size:11px;color:var(--slate-400,#94A3B8)' }, '$25 / month · Maria Delgado')),
          h('span', { style: 'display:inline-flex;align-items:center;gap:6px;font-size:9.5px;font-weight:700;color:var(--emerald-300,#6ee7b7)' }, h('span', { style: 'width:6px;height:6px;border-radius:50%;background:var(--emerald-500,#50C878);animation:ecLive 2s infinite' }), 'LIVE')),
        h('div', { style: 'background:#fff;padding:16px 18px;display:flex;flex-direction:column;gap:12px' },
          v.stewardTimeline.map((stw, i) => h('div', { key: i, style: 'display:flex;gap:11px;align-items:flex-start' },
            h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#1C7A45', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none;margin-top:2px' }, h('path', { d: 'M20 6 9 17l-5-5' })),
            h('div', null,
              h('div', { style: 'font-size:12.5px;font-weight:700;color:var(--navy,#0F172A)' }, stw.title),
              h('div', { style: 'font-size:11.5px;color:var(--slate,#475569);line-height:1.5' }, stw.body))))),
        h('div', { style: 'padding:13px 18px;background:var(--mint,#E9F7EF);font-size:12.5px;font-weight:700;color:var(--emerald-800,#065f46);text-align:center' }, 'A one-time supporter became a recurring donor — automatically.')));
  }

  renderMeasure(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--emerald-700,#1C7A45)' }, v.measureEyebrow),
      h('h2', { style: 'margin:7px 0 8px;font-size:22px;font-weight:700;color:var(--navy,#0F172A)' }, v.measureTitle),
      h('p', { style: 'margin:0;font-size:13.5px;line-height:1.6;color:var(--slate,#475569);max-width:560px' }, v.measureBlurb),
      h('div', { class: 'ec-kpis', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:20px' },
        v.measureStats.map((ms, i) => h('div', { key: i, style: 'border:1px solid var(--line,#E2E8F0);border-radius:14px;padding:18px;text-align:center' },
          h('div', { style: 'font-size:30px;font-weight:700;letter-spacing:-.02em;color:var(--emerald-600,#2FA45E)' }, ms.v),
          h('div', { style: 'font-size:11.5px;font-weight:600;color:var(--muted,#64748B);margin-top:4px' }, ms.l)))),
      h('div', { style: 'border:1px solid var(--line,#E2E8F0);border-radius:14px;padding:20px 22px;margin-top:16px' },
        h('div', { style: 'font-size:12px;font-weight:700;color:var(--navy,#0F172A);margin-bottom:14px' }, v.measureFunnelTitle),
        h('div', { style: 'display:flex;flex-direction:column;gap:9px' },
          v.funnelRows.map((fr, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:12px' },
            h('div', { style: 'width:158px;flex:none;font-size:12px;font-weight:600;color:var(--slate,#475569);text-align:right' }, fr.label),
            h('div', { style: 'flex:1;height:22px;background:var(--line-100,#F1F5F9);border-radius:6px;overflow:hidden' }, h('div', { style: `height:100%;width:${fr.w};background:${fr.fill};border-radius:6px;transition:width .6s cubic-bezier(.16,1,.3,1)` })),
            h('div', { style: 'width:52px;flex:none;font-size:12px;font-weight:700;color:var(--navy,#0F172A)' }, fr.n)))),
        v.measureCallout ? h('div', { style: 'display:flex;gap:11px;align-items:flex-start;margin-top:16px;padding:13px 16px;background:var(--mint,#E9F7EF);border-radius:12px' },
          h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#1C7A45', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none;margin-top:1px' }, h('path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' })),
          h('span', { style: 'font-size:12.5px;line-height:1.55;color:var(--emerald-900,#064e3b)' }, v.measureCallout)) : null),
      h('div', { style: 'display:flex;gap:12px;justify-content:center;margin-top:22px' },
        h(Btn, { onClick: v.goAnalytics }, 'Open the full dashboards'),
        h(Btn, { variant: 'outline', onClick: v.goFinal }, 'See the closing message')));
  }

  // ── ANALYTICS ───────────────────────────────────────────────────────────
  renderAnalytics(v) {
    return h('div', { class: 'ec-page', style: 'max-width:1060px;margin:0 auto;padding:44px 40px 56px;animation:ecFadeUp .35s ease-out both' },
      h('div', { style: 'display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap' },
        h('div', null,
          h('div', { style: 'display:flex;align-items:center;gap:8px' },
            h('div', { style: 'width:16px;height:2px;border-radius:2px;background:var(--emerald-500,#50C878)' }),
            h('span', { style: 'font-size:10px;font-weight:700;letter-spacing:.2em;color:var(--emerald-600,#2FA45E)' }, 'Mission Intelligence')),
          h('h1', { style: 'margin:8px 0 0;font-size:30px;font-weight:700;letter-spacing:-0.015em;color:var(--navy,#0F172A)' }, 'Analytics'),
          h('div', { style: 'margin-top:5px;font-size:13px;color:var(--muted,#64748B)' }, 'Volunteer recruitment · every number below is captured automatically')),
        h('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap' },
          h('div', { style: 'display:flex;gap:2px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:999px;padding:3px' },
            v.rangePills.map((rp, i) => h('div', { key: i, onClick: rp.set, style: `padding:7px 14px;border-radius:999px;font-size:12.5px;font-weight:600;cursor:pointer;background:${rp.bg};color:${rp.fg};transition:background .2s,color .2s` }, rp.label))),
          h('div', { style: 'display:flex;gap:3px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:999px;padding:4px' },
            v.dashTabs.map((dt, i) => h('div', { key: i, onClick: dt.set, style: `padding:8px 16px;border-radius:999px;font-size:12.5px;font-weight:600;cursor:pointer;background:${dt.bg};color:${dt.fg};transition:background .15s,color .15s;white-space:nowrap` }, dt.label))))),
      v.dExec ? this.renderExecDash(v) : null,
      v.dMgr ? this.renderMgrDash(v) : null,
      v.dOps ? this.renderOpsDash(v) : null,
      h('div', { style: 'margin-top:36px;padding-top:20px;border-top:1px solid var(--line-100,#F1F5F9);display:flex;align-items:center;justify-content:center;gap:7px' },
        h('span', { style: 'font-size:12.5px;color:var(--slate-400,#94A3B8)' }, 'Mission Intelligence Platform powered by'),
        h('img', { src: '/images/logo.webp', alt: 'MyRecruiter', style: 'height:18px;width:auto;display:block' })));
  }

  renderExecDash(v) {
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { class: 'ec-kpis', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-top:24px' },
        v.execKpis.map((k, i) => h('div', { key: i, class: 'ec-lift', style: 'background:#fff;border-radius:16px;padding:24px 18px;text-align:center;box-shadow:0 4px 20px -2px rgba(0,0,0,.08),0 2px 8px -2px rgba(0,0,0,.04);transition:transform .3s cubic-bezier(.16,1,.3,1)' },
          h('div', { style: 'font-size:38px;font-weight:700;line-height:1;letter-spacing:-.02em;color:var(--emerald-500,#50C878)' }, k.v),
          h('div', { style: 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:var(--slate,#475569);margin-top:14px' }, k.l),
          h('div', { style: 'font-size:12px;color:var(--slate-400,#94A3B8);margin-top:5px' }, k.d)))),
      h('div', { class: 'ec-grid', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-top:16px' },
        // funnel card
        h('div', { style: 'background:#fff;border-radius:12px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 1px 2px -1px rgba(0,0,0,.04)' },
          h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px' },
            h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, 'Conversion funnel'),
            h('span', { style: 'padding:5px 12px;border-radius:999px;background:var(--emerald-100,#d1fae5);color:var(--emerald-700,#1C7A45);font-size:12px;font-weight:600' }, '17.3% conversion rate')),
          h('div', { style: 'display:flex;flex-direction:column;gap:12px' },
            v.fFunnel.map((fr, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:14px' },
              h('div', { style: 'width:86px;flex:none;font-size:12.5px;color:var(--slate,#475569);text-align:right' }, fr.label),
              h('div', { style: 'flex:1;height:32px;background:var(--line-100,#F1F5F9);border-radius:8px;overflow:hidden' }, h('div', { style: `height:100%;width:${fr.w};background:${fr.fill};border-radius:8px;transition:width .5s cubic-bezier(.16,1,.3,1)` })),
              h('div', { style: 'width:52px;flex:none;font-size:13px;font-weight:600;color:var(--navy,#0F172A);text-align:right' }, fr.n)))),
          h('div', { style: 'display:flex;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid var(--line-100,#F1F5F9)' },
            [['Total views', '1,240', 'var(--navy,#0F172A)'], ['Abandoned', '75', '#e11d48'], ['Completed', '214', 'var(--emerald-600,#2FA45E)']].map((c, i) => h('div', { key: i, style: 'text-align:center' },
              h('div', { style: 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted,#64748B)' }, c[0]),
              h('div', { style: `font-size:17px;font-weight:700;color:${c[2]};margin-top:3px` }, c[1]))))),
        // heatmap card
        h('div', { style: 'background:#fff;border-radius:12px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 1px 2px -1px rgba(0,0,0,.04)' },
          h('div', { style: 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px' },
            h('div', null,
              h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, 'Engagement density'),
              h('div', { style: 'font-size:12.5px;color:var(--muted,#64748B);margin-top:2px' }, 'Peak: ', h('span', { style: 'font-weight:600;color:var(--emerald-600,#2FA45E)' }, 'Tue at 6–9 PM'), ' — after your office closes')),
            h('div', { style: 'text-align:right' },
              h('div', { style: 'font-size:24px;font-weight:700;color:var(--emerald-500,#50C878);line-height:1' }, '1,347'),
              h('div', { style: 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:var(--muted,#64748B);margin-top:4px' }, 'Total'))),
          h('div', { style: 'display:grid;grid-template-columns:44px repeat(7,1fr);gap:4px;align-items:center' },
            h('div'),
            ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => h('div', { key: i, style: 'font-size:10px;font-weight:600;color:var(--muted,#64748B);text-align:center;text-transform:uppercase;letter-spacing:.06em' }, d)),
            v.heatCells.map((hc, i) => hc.isLabel
              ? h('div', { key: i, style: 'font-size:10px;color:var(--slate-400,#94A3B8);white-space:nowrap;text-align:right;padding-right:2px' }, hc.text)
              : h('div', { key: i, class: 'ec-heat', style: `height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:600;background:${hc.bg};color:${hc.fg};box-shadow:${hc.glow};transition:transform .2s` }, hc.text))),
          h('div', { style: 'display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:14px' },
            h('span', { style: 'font-size:10px;font-weight:600;color:var(--slate-400,#94A3B8);text-transform:uppercase;letter-spacing:.08em' }, 'Less'),
            h('div', { style: 'display:flex;gap:4px' },
              ['#f8faf9', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#50C878'].map((c, i) => h('div', { key: i, style: `width:16px;height:16px;border-radius:5px;background:${c}${i === 0 ? ';border:1px solid var(--line-100,#F1F5F9)' : ''}` }))),
            h('span', { style: 'font-size:10px;font-weight:600;color:var(--slate-400,#94A3B8);text-transform:uppercase;letter-spacing:.08em' }, 'More')))));
  }

  renderMgrDash(v) {
    const cardStyle = 'background:#fff;border-radius:12px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 1px 2px -1px rgba(0,0,0,.04)';
    const upcoming = h('div', { style: cardStyle },
      h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A);margin-bottom:14px' }, 'Upcoming discovery sessions'),
      h('div', { style: 'display:flex;flex-direction:column;gap:10px' },
        v.upcomingRows.map((ur, i) => h('div', { key: i, class: 'ec-hoverbg', style: 'display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--line-100,#F1F5F9);border-radius:12px;transition:background .15s;--hb:var(--slate-50,#F8FAFC)' },
          h('div', { style: 'flex:none;width:44px;text-align:center;background:var(--mint,#E9F7EF);border-radius:9px;padding:5px 0' },
            h('div', { style: 'font-size:9px;font-weight:700;letter-spacing:.06em;color:var(--emerald-700,#1C7A45)' }, ur.mon),
            h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, ur.day)),
          h('div', { style: 'flex:1;min-width:0' },
            h('div', { style: 'font-size:12.5px;font-weight:700;color:var(--navy,#0F172A)' }, ur.t),
            h('div', { style: 'font-size:11px;color:var(--muted,#64748B)' }, ur.sub)),
          h('span', { style: `padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;background:${ur.pillBg};color:${ur.pillFg}` }, ur.pill)))));
    const pipeline = h('div', { style: cardStyle },
      h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A);margin-bottom:14px' }, 'Volunteer pipeline'),
      h('div', { style: 'display:flex;flex-direction:column;gap:9px' },
        v.pipelineRows.map((pr, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:12px' },
          h('div', { style: 'width:150px;flex:none;font-size:12px;font-weight:600;color:var(--slate,#475569);text-align:right' }, pr.l),
          h('div', { style: 'flex:1;height:18px;background:var(--line-100,#F1F5F9);border-radius:6px;overflow:hidden' }, h('div', { style: `height:100%;width:${pr.w};background:var(--emerald-500,#50C878);border-radius:6px;opacity:${pr.o}` })),
          h('div', { style: 'width:34px;flex:none;font-size:12px;font-weight:700;color:var(--navy,#0F172A)' }, pr.n)))));
    const topQ = h('div', { style: cardStyle },
      h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:16px' },
        h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, 'Top five questions'),
        h('div', { style: 'display:flex;align-items:baseline;gap:6px' },
          h('span', { style: 'font-size:22px;font-weight:700;color:var(--emerald-500,#50C878)' }, '2,140'),
          h('span', { style: 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:var(--muted,#64748B)' }, 'Total'))),
      h('div', { style: 'display:flex;flex-direction:column;gap:15px' },
        v.topQs.map((tq, i) => h('div', { key: i },
          h('div', { style: 'font-size:12.5px;color:var(--slate,#475569);line-height:1.5;margin-bottom:6px' }, '"' + tq.q + '"'),
          h('div', { style: 'display:flex;align-items:center;justify-content:space-between;font-size:11px;margin-bottom:6px' },
            h('span', { style: 'color:var(--muted,#64748B)' }, h('strong', { style: 'color:var(--slate,#475569)' }, tq.n), ' times'),
            h('span', { style: 'font-weight:600;color:var(--emerald-600,#2FA45E)' }, tq.pct + '% of all questions')),
          h('div', { style: 'height:7px;background:var(--line-100,#F1F5F9);border-radius:4px;overflow:hidden' }, h('div', { style: `height:100%;width:${tq.w};border-radius:4px;background:linear-gradient(90deg,#34d399 0%,#50C878 100%)` }))))),
      h('div', { style: 'margin-top:16px;padding-top:14px;border-top:1px solid var(--line-100,#F1F5F9);font-size:11.5px;line-height:1.5;color:var(--muted,#64748B)' }, "Every one of these was answered instantly — and each reveals what your website isn't saying."));
    const outcomes = h('div', { style: cardStyle },
      h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A);margin-bottom:14px' }, 'Conversation outcomes'),
      h('div', { style: 'display:flex;height:14px;border-radius:7px;overflow:hidden;gap:2px' },
        v.outcomeRows.map((o, i) => h('div', { key: i, style: `width:${o.w};background:${o.c}` }))),
      h('div', { style: 'display:flex;flex-direction:column;gap:7px;margin-top:14px' },
        v.outcomeRows.map((o, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:9px;font-size:12px;color:var(--slate,#475569)' },
          h('span', { style: `width:9px;height:9px;border-radius:3px;background:${o.c};flex:none` }),
          h('span', { style: 'flex:1' }, o.l),
          h('span', { style: 'font-weight:700;color:var(--navy,#0F172A)' }, o.pct + '%')))));
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      h('div', { class: 'ec-grid', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px;margin-top:24px' },
        h('div', { style: 'display:flex;flex-direction:column;gap:16px' }, upcoming, pipeline),
        h('div', { style: 'display:flex;flex-direction:column;gap:16px' }, topQ, outcomes)));
  }

  renderOpsDash(v) {
    const cardStyle = 'background:#fff;border-radius:12px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 1px 2px -1px rgba(0,0,0,.04)';
    const kpis = h('div', { class: 'ec-kpis', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-top:24px' },
      v.opsKpis.map((ok, i) => h('div', { key: i, style: 'background:#fff;border-radius:16px;padding:20px 18px;text-align:center;box-shadow:0 4px 20px -2px rgba(0,0,0,.08),0 2px 8px -2px rgba(0,0,0,.04)' },
        h('div', { style: 'font-size:30px;font-weight:700;line-height:1;letter-spacing:-.02em;color:var(--emerald-500,#50C878)' }, ok.v),
        h('div', { style: 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:var(--slate,#475569);margin-top:12px' }, ok.l),
        h('div', { style: 'font-size:11.5px;color:var(--slate-400,#94A3B8);margin-top:4px' }, ok.sub))));
    const bottleneck = h('div', { style: cardStyle },
      h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, 'Form field bottlenecks'),
      h('div', { style: 'font-size:12px;color:var(--muted,#64748B);margin-top:2px' }, 'Where applicants drop off — the friction spectrum'),
      h('div', { style: 'display:flex;flex-direction:column;gap:12px;margin-top:16px' },
        v.bottlenecks.map((bn, i) => h('div', { key: i },
          h('div', { style: 'display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--slate,#475569);margin-bottom:5px' }, h('span', null, bn.f), h('span', { style: 'color:var(--navy,#0F172A);font-weight:700' }, bn.pct + '% abandon')),
          h('div', { style: 'height:10px;background:var(--line-100,#F1F5F9);border-radius:5px;overflow:hidden' }, h('div', { style: `height:100%;width:${bn.w};border-radius:5px;background:${bn.fill}` }))))),
      h('div', { style: 'display:flex;align-items:center;gap:9px;margin-top:16px;padding:11px 14px;background:var(--amber-bg,#FFFBEB);border-radius:10px;font-size:11.5px;line-height:1.5;color:var(--warning,#B54708)' },
        h('span', { style: 'width:7px;height:7px;border-radius:50%;background:var(--amber,#FBBF24);flex:none' }),
        'The long-answer experience field causes the most drop-off — consider making it optional.'));
    const reminder = h('div', { style: cardStyle },
      h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, 'Reminder effectiveness'),
      h('div', { style: 'font-size:12px;color:var(--muted,#64748B);margin-top:2px' }, 'No-shows cut roughly in half since launch'),
      h('div', { style: 'display:flex;flex-direction:column;gap:11px;margin-top:14px' },
        v.reminderRows.map((rr, i) => h('div', { key: i },
          h('div', { style: 'display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--slate,#475569);margin-bottom:5px' }, h('span', null, rr.l), h('span', { style: 'color:var(--navy,#0F172A);font-weight:700' }, rr.pct + '%')),
          h('div', { style: 'height:8px;background:var(--line-100,#F1F5F9);border-radius:4px;overflow:hidden' }, h('div', { style: `height:100%;width:${rr.w};background:linear-gradient(90deg,#34d399 0%,#50C878 100%);border-radius:4px` }))))));
    const channel = h('div', { style: cardStyle },
      h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A);margin-bottom:12px' }, 'Engagement by channel'),
      h('div', { style: 'display:flex;flex-direction:column;gap:9px' },
        v.channelRows.map((cw, i) => h('div', { key: i, style: 'display:flex;align-items:center;gap:10px' },
          h('span', { style: 'width:20px;text-align:center;font-size:13px;flex:none' }, cw.e),
          h('div', { style: 'width:110px;flex:none;font-size:12px;font-weight:600;color:var(--slate,#475569)' }, cw.l),
          h('div', { style: 'flex:1;height:8px;background:var(--line-100,#F1F5F9);border-radius:4px;overflow:hidden' }, h('div', { style: `height:100%;width:${cw.w};background:var(--emerald-500,#50C878);border-radius:4px` })),
          h('div', { style: 'width:36px;flex:none;font-size:11.5px;font-weight:700;color:var(--navy,#0F172A);text-align:right' }, cw.pct + '%')))));
    return h('div', { style: 'animation:ecFadeUp .3s ease-out both' },
      kpis,
      h('div', { class: 'ec-grid', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:16px' },
        bottleneck,
        h('div', { style: 'display:flex;flex-direction:column;gap:16px' }, reminder, channel)));
  }

  // ── PLATFORM OVERVIEW ───────────────────────────────────────────────────
  renderPlatform(v) {
    const chan = (e, label) => h('div', { style: 'display:flex;align-items:center;gap:9px;padding:11px 14px;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:12px' },
      h('span', { style: 'font-size:15px' }, e), h('span', { style: 'font-size:12.5px;font-weight:600;color:var(--navy,#0F172A)' }, label));
    const connector = (hh) => h('div', { style: 'display:flex;justify-content:center;margin:2px 0' },
      h('svg', { width: 24, height: hh, viewBox: `0 0 24 ${hh}` }, h('line', { x1: 12, y1: 2, x2: 12, y2: hh - 2, stroke: '#50C878', strokeWidth: 2, strokeDasharray: '4 7', strokeLinecap: 'round', style: 'animation:ecFlow 1.4s linear infinite' })));
    return h('div', { class: 'ec-page', style: 'max-width:820px;margin:0 auto;padding:48px 40px 80px;animation:ecFadeUp .35s ease-out both' },
      h('div', { style: 'text-align:center' },
        h('div', { style: 'font-size:11.5px;font-weight:700;letter-spacing:.15em;color:var(--emerald-700,#1C7A45)' }, 'HOW IT WORKS'),
        h('h1', { style: 'margin:10px 0 0;font-size:32px;font-weight:700;letter-spacing:-0.015em;color:var(--navy,#0F172A)' }, 'One AI engine behind every conversation'),
        h('p', { style: 'margin:12px auto 0;max-width:560px;font-size:14.5px;line-height:1.65;color:var(--slate,#475569);text-wrap:pretty' }, 'Every channel feeds the same engine. It knows your programs, collects what you need, books the next step, and measures everything.')),
      h('div', { class: 'ec-chan-grid', style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:560px;margin:32px auto 0' },
        chan('🌐', 'Website chat'), chan('📋', 'QR codes'), chan('💬', 'SMS'), chan('💬', 'Facebook Messenger'), chan('📱', 'Instagram Messenger'), chan('✉️', 'Email')),
      connector(44),
      h('div', { style: 'max-width:460px;margin:0 auto;background:var(--navy-900,#0F172A);border-radius:18px;padding:24px 26px;text-align:center;position:relative;overflow:hidden;box-shadow:0 20px 48px rgba(15,23,42,.25)' },
        h('div', { style: 'position:absolute;top:-70px;left:50%;transform:translateX(-50%);width:300px;height:200px;background:radial-gradient(circle,rgba(80,200,120,.22) 0%,rgba(80,200,120,0) 70%);pointer-events:none' }),
        h('div', { style: 'position:relative' },
          h('div', { style: 'width:44px;height:44px;border-radius:12px;background:var(--emerald-500,#50C878);display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 8px 24px rgba(80,200,120,.4)' },
            h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }))),
          h('div', { style: 'font-size:18px;font-weight:700;color:#fff;margin-top:12px' }, 'AI Conversation Engine'),
          h('div', { style: 'font-size:12.5px;line-height:1.6;color:var(--slate-400,#94A3B8);margin-top:6px' }, 'Trained on your programs, policies, and voice. Answers naturally, 24/7, in every channel at once.'))),
      v.archNodes.map((an, i) => h(Fragment, { key: i },
        connector(40),
        h('div', { style: 'max-width:460px;margin:0 auto;background:#fff;border:1px solid var(--line,#E2E8F0);border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:14px' },
          h('div', { style: 'width:38px;height:38px;border-radius:11px;background:var(--mint,#E9F7EF);display:flex;align-items:center;justify-content:center;flex:none' },
            h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: '#1C7A45', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: an.d }))),
          h('div', null,
            h('div', { style: 'font-size:14px;font-weight:700;color:var(--navy,#0F172A)' }, an.t),
            h('div', { style: 'font-size:12px;line-height:1.5;color:var(--slate,#475569);margin-top:2px' }, an.b))))),
      h('div', { style: 'text-align:center;margin-top:32px' }, h(Btn, { href: '/#pricing' }, 'Choose your plan')));
  }

  // ── FINAL ───────────────────────────────────────────────────────────────
  renderFinal(v) {
    return h('div', { style: 'min-height:100vh;background:var(--navy-900,#0F172A);display:flex;flex-direction:column;position:relative;overflow:hidden;animation:ecFadeUp .35s ease-out both' },
      h('div', { style: 'position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:600px;background:radial-gradient(circle,rgba(80,200,120,.16) 0%,rgba(80,200,120,0) 65%);pointer-events:none' }),
      h('div', { class: 'ec-final', style: 'position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;max-width:680px;margin:0 auto;padding:60px 44px' },
        h('div', { style: 'font-size:11.5px;font-weight:700;letter-spacing:.16em;color:var(--emerald-300,#6ee7b7)' }, 'YOU’VE SEEN THE JOURNEY'),
        h('h1', { class: 'ec-final-h1', style: 'margin:18px 0 0;font-size:42px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;color:#fff;text-wrap:pretty' }, 'Imagine Every Interested Person Becoming Part of Your Mission.'),
        h('p', { style: 'margin:20px 0 0;font-size:15.5px;line-height:1.7;color:rgba(255,255,255,.72);text-wrap:pretty' }, 'You just experienced one volunteer’s journey. Now imagine every volunteer, donor, family, or program participant automatically receiving that same friction-free experience.'),
        h('div', { style: 'display:flex;gap:14px;justify-content:center;margin-top:32px' },
          h(Btn, { size: 'lg', href: '/demo' }, 'Schedule a Live Demo'),
          h(Btn, { variant: 'outline', size: 'lg', onDark: true, href: '/#pricing' }, 'Choose Your Plan')),
        h('a', { onClick: v.goHome, style: 'margin-top:28px;font-size:12.5px;font-weight:600;color:var(--slate-400,#94A3B8);cursor:pointer' }, '← Back to the Experience Center')),
      h('div', { style: 'position:relative;padding:24px 44px;display:flex;justify-content:flex-end' }, h('img', { src: '/images/logo-white.webp', alt: 'MyRecruiter', style: 'width:150px;display:block' })));
  }

  // ── OVERVIEW MODAL ──────────────────────────────────────────────────────
  renderOverview(v) {
    return h('div', { onClick: v.closeOverview, style: 'position:fixed;inset:0;background:rgba(2,6,23,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:50;animation:ecFadeUp .2s ease-out both' },
      h('div', { style: 'width:680px;max-width:calc(100vw - 60px);background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 32px 80px rgba(2,6,23,.5)' },
        h('div', { style: 'aspect-ratio:16/9;background:var(--navy-900,#0F172A);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;position:relative;overflow:hidden' },
          h('div', { style: 'position:absolute;top:-120px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(80,200,120,.18) 0%,rgba(80,200,120,0) 65%)' }),
          h('div', { style: 'width:64px;height:64px;border-radius:50%;background:var(--emerald-500,#50C878);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px rgba(80,200,120,.4);cursor:pointer' },
            h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: '#fff' }, h('path', { d: 'M8 5v14l11-7z' }))),
          h('div', { style: 'font-size:13px;font-weight:600;color:rgba(255,255,255,.7);position:relative' }, 'Video placeholder — drop your 2-minute overview here')),
        h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:16px 22px' },
          h('div', null,
            h('div', { style: 'font-size:15px;font-weight:700;color:var(--navy,#0F172A)' }, 'MyRecruiter in 2 minutes'),
            h('div', { style: 'font-size:12px;color:var(--muted,#64748B);margin-top:2px' }, 'Or skip the video — the guided experience shows everything live.')),
          h(Btn, { size: 'sm', onClick: v.goHomeFromModal }, 'Explore instead'))));
  }

  render() {
    const v = this.renderVals();
    return h('div', { style: 'min-height:100vh' },
      v.isLanding ? this.renderLanding(v) : this.renderShell(v),
      v.overviewOpen ? this.renderOverview(v) : null);
  }
}
