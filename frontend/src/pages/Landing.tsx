import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { Sparkles, BarChart2, Target, Globe, Megaphone, DollarSign, Plug, Zap, ArrowRight, CheckCircle } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }
const fadeIn  = { hidden: { opacity: 0 }, visible: { opacity: 1 } }

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, staggerChildren: 0.1 }} className={className}>
      {children}
    </motion.div>
  )
}

const features = [
  { icon: BarChart2, color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',  title: 'Market Intelligence',    desc: 'Live Google-grounded TAM/SAM/SOM with positioning matrix' },
  { icon: Target,   color: '#818cf8', bg: 'rgba(129,140,248,0.1)', title: 'Competitor Mapping',      desc: 'Deep SWOT of top 5 competitors with exploitable gaps' },
  { icon: Globe,    color: '#34d399', bg: 'rgba(52,211,153,0.1)',  title: 'Website Generator',       desc: 'Award-winning landing page built by Gemini AI + Tailwind' },
  { icon: Megaphone,color: '#f472b6', bg: 'rgba(244,114,182,0.1)', title: 'Marketing Kit',           desc: 'Platform-specific posts for Instagram, LinkedIn, Twitter' },
  { icon: DollarSign,color:'#fbbf24', bg: 'rgba(251,191,36,0.1)', title: 'Funding Matcher',          desc: 'AI-matched grants, VCs, accelerators & angel investors' },
  { icon: Plug,     color: '#c084fc', bg: 'rgba(192,132,252,0.1)', title: 'Integrations',            desc: 'Push to n8n and Zapier for full automation deployment' },
]

const steps = [
  { n: '01', title: 'Describe your idea',    desc: 'Give us your concept, industry, target audience, and location in one form.' },
  { n: '02', title: 'AI builds everything', desc: 'Our 6-node LangGraph pipeline generates all assets in about 2 minutes.' },
  { n: '03', title: 'Launch & scale',        desc: 'Download, deploy, and connect to your automation tools instantly.' },
]

const perks = ['No credit card required', '2-minute generation', 'Full data ownership', '6 complete modules']

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#07070f' }}>

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.05]"
        style={{ background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-[0_0_16px_rgba(45,212,191,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg font-display tracking-tight">Waymaker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-4 py-2">
              Sign In
            </Link>
            <Link to="/register"
              className="bg-teal-500 hover:bg-teal-400 text-black px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_0_16px_rgba(45,212,191,0.25)] hover:shadow-[0_0_24px_rgba(45,212,191,0.45)] hover:-translate-y-0.5">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center pt-16 pb-24 overflow-hidden mesh-bg">
        {/* Animated blobs */}
        <div className="blob w-[600px] h-[600px] bg-teal-500/20 top-[-10%] left-[-10%]" style={{ animationDuration: '12s' }} />
        <div className="blob w-[500px] h-[500px] bg-indigo-500/20 bottom-[-10%] right-[-5%]" style={{ animationDuration: '15s', animationDelay: '-5s' }} />
        <div className="blob w-[300px] h-[300px] bg-purple-500/15 top-[30%] right-[20%]" style={{ animationDuration: '9s', animationDelay: '-3s' }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.12 }}
            className="flex flex-col items-center text-center">

            {/* Badge */}
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}>
              <Zap className="w-3 h-3" />
              Powered by LangGraph + Groq + Gemini AI
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp}
              className="font-display text-[clamp(2.8rem,8vw,6rem)] font-bold leading-[1.05] mb-6">
              <span className="text-white">Your Autonomous</span><br />
              <span className="gradient-text">AI Co-Founder</span>
            </motion.h1>

            {/* Sub */}
            <motion.p variants={fadeUp}
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
              Transform any business idea into a complete startup foundation in&nbsp;
              <span className="text-white font-semibold">2 minutes flat</span>.
              Market research, competitor analysis, landing page, marketing kit — fully automated.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 mb-10">
              <Link to="/register"
                className="btn-gradient px-9 py-4 text-base font-bold rounded-2xl shadow-[0_0_32px_rgba(45,212,191,0.25)]">
                Build Your Startup Free →
              </Link>
              <Link to="/login"
                className="btn-ghost px-8 py-4 text-base rounded-2xl">
                Sign In
              </Link>
            </motion.div>

            {/* Perks row */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {perks.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                  {p}
                </div>
              ))}
            </motion.div>

            {/* Floating glass stat card */}
            <motion.div variants={fadeUp} transition={{ delay: 0.5 }}
              className="mt-16 grid grid-cols-3 gap-4 w-full max-w-lg">
              {[
                { value: '~2 min', label: 'Generation time' },
                { value: '6',      label: 'Complete modules' },
                { value: '100%',   label: 'AI automated' },
              ].map((s, i) => (
                <div key={i} className="glass text-center px-4 py-4" style={{ border: '1px solid rgba(45,212,191,0.12)' }}>
                  <div className="gradient-text text-2xl font-bold font-display">{s.value}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────── */}
      <section className="py-28 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <Section className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <div className="section-label mb-3">What you get</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Everything to Launch
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Six AI agents run in sequence, each an expert in its domain, delivering production-ready outputs.
              </p>
            </motion.div>
          </Section>

          <Section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ delay: i * 0.07 }}
                  className="glass-card-hover p-6 group">
                  <div className="module-icon mb-5" style={{ background: f.bg }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-28 px-6 relative"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(45,212,191,0.03) 50%, transparent)' }}>
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <div className="section-label mb-3">How it works</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
                Idea → Launch in 3 Steps
              </h2>
            </motion.div>
          </Section>

          <Section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* connecting line */}
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.3), transparent)' }} />

              {steps.map((s, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ delay: i * 0.15 }}
                  className="glass-card p-7 text-center relative">
                  <div className="text-4xl font-display font-bold gradient-text mb-4">{s.n}</div>
                  <h3 className="text-white font-semibold text-lg mb-3">{s.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-4xl mx-auto">
          <Section>
            <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { q: 'Generated a full market analysis and landing page for my SaaS in under 3 minutes. Absolutely insane.', name: 'Sarah K.', role: 'Founder, DevTools startup' },
                { q: 'The competitor SWOT analysis alone would have cost me $500 from a consultant. Got it for free in seconds.', name: 'Raj M.', role: 'Co-founder, HealthTech' },
                { q: 'I pitched to investors using the market research Waymaker generated. They were impressed.', name: 'Priya L.', role: 'CEO, EdTech startup' },
              ].map((t, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 flex flex-col gap-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed flex-1">"{t.q}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-white text-xs font-semibold">{t.name}</div>
                      <div className="text-zinc-600 text-[10px]">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="blob w-[500px] h-[500px] bg-teal-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Section>
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="section-label mb-2">Get started</div>
              <h2 className="font-display text-5xl md:text-6xl font-bold text-white">
                Ready to Build?
              </h2>
              <p className="text-zinc-400 text-xl">Your AI co-founder is waiting.</p>
              <Link to="/register"
                className="inline-flex items-center gap-2 btn-gradient px-12 py-5 text-xl font-bold rounded-2xl mt-4 shadow-[0_0_40px_rgba(45,212,191,0.2)]">
                Start Building Free <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-zinc-700 text-sm">No credit card · Takes 30 seconds to register</p>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold font-display">Waymaker AI</span>
            <span className="text-zinc-700 text-sm ml-2">Autonomous business builder</span>
          </div>
          <div className="text-zinc-700 text-sm text-right">
            <div>Built with LangGraph · FastAPI · MongoDB · Gemini</div>
            <div className="mt-0.5">© 2026 Waymaker AI</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
