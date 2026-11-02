import { useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  House,
  Mail,
  Menu,
  PackageCheck,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitContact } from '@/lib/submitContact';
import './App.css';

type Service = {
  number: string;
  title: string;
  description: string;
  details: string[];
  Icon: typeof Wrench;
  tone: 'sage' | 'peach' | 'blue';
};

const services: Service[] = [
  {
    number: '01',
    title: 'Small Repairs',
    description: 'The little things that make a home feel right again.',
    details: ['Fixtures & fittings', 'Doors, handles & hinges', 'Everyday fixes'],
    Icon: Wrench,
    tone: 'sage',
  },
  {
    number: '02',
    title: 'Furniture Assembly',
    description: 'From flat-pack to finished, without the spare screws.',
    details: ['Furniture assembly', 'Wall mounting', 'Room-ready setup'],
    Icon: PackageCheck,
    tone: 'peach',
  },
  {
    number: '03',
    title: 'Home Maintenance',
    description: 'A little upkeep today goes a long way tomorrow.',
    details: ['Seasonal checkups', 'Preventative upkeep', 'General maintenance'],
    Icon: House,
    tone: 'blue',
  },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Sample Home Services home">
        <span className="brand-mark" aria-hidden="true"><Wrench size={19} strokeWidth={2.2} /></span>
        <span className="brand-name">sample<span>home</span></span>
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>Our approach</a>
        <a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>Get in touch <ArrowUpRight size={15} /></a>
      </nav>
    </header>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const { Icon } = service;
  return (
    <article className="service-card">
      <div className={`service-icon ${service.tone}`}><Icon size={24} strokeWidth={1.8} /></div>
      <span className="service-number">{service.number}</span>
      <h3>{service.title}</h3>
      <p className="service-description">{service.description}</p>
      <ul className="service-list">
        {service.details.map((detail) => (
          <li key={detail}><Check size={15} strokeWidth={2.5} aria-hidden="true" />{detail}</li>
        ))}
      </ul>
    </article>
  );
}

function ContactForm() {
  const requestIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // reuse the same request_id on retry so the backend stores exactly one row
    if (requestIdRef.current === null) {
      requestIdRef.current = crypto.randomUUID();
    }

    setStatus("submitting");
    setErrorMessage(null);
    setFieldErrors({});

    const result = await submitContact({
      request_id: requestIdRef.current,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    });

    if (result.ok) {
      requestIdRef.current = null;
      setFieldErrors({});
      setStatus("success");
      form.reset();
      return;
    }

    setFieldErrors(result.fieldErrors ?? {});
    setErrorMessage(result.message);
    setStatus("idle"); // form values and request_id are preserved for retry
  }

  const inputErrorProps = (field: "name" | "email" | "message") =>
    fieldErrors[field] ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` } : {};

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" autoComplete="name" placeholder="Jane Smith" {...inputErrorProps("name")} />
        {fieldErrors.name && <p className="form-error" id="name-error" role="alert">{fieldErrors.name}</p>}
      </div>
      <div className="form-row">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="jane@example.com" {...inputErrorProps("email")} />
        {fieldErrors.email && <p className="form-error" id="email-error" role="alert">{fieldErrors.email}</p>}
      </div>
      <div className="form-row">
        <label htmlFor="message">How can we help?</label>
        <textarea id="message" name="message" rows={4} placeholder="Tell us a little about your project…" {...inputErrorProps("message")} />
        {fieldErrors.message && <p className="form-error" id="message-error" role="alert">{fieldErrors.message}</p>}
      </div>
      {/* honeypot — hidden from humans, filled by bots; the backend rejects any non-empty value */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <Button className="submit-button" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : <>Contact Us <ArrowRight size={18} /></>}
      </Button>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      {status === "success" && (
        <p className="form-success" role="status"><Check size={17} /> Thanks for reaching out. Your message was received.</p>
      )}
    </form>
  );
}

function App() {
  return (
    <div className="page-shell" id="home">
      <div className="demo-banner"><span className="demo-dot" /> DEMO WEBSITE <span className="banner-divider">/</span> Demonstration only — no services offered</div>
      <div className="content-wrap">
        <Header />

        <main>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><span /> A more considered kind of home help</p>
              <h1 id="hero-title">A little help.<br /><em>A lot more</em> home.</h1>
              <p className="hero-intro">Thoughtful help for the everyday things on your home list. Small fixes, smoother setups, and upkeep that lets you get back to living.</p>
              <div className="hero-actions">
                <a className="primary-link" href="#services">Explore services <ArrowRight size={17} /></a>
                <span className="availability"><span className="availability-dot" /> Here for the little things</span>
              </div>
              <div className="hero-trust">
                <span><ShieldCheck size={17} /> Considerate by design</span>
                <span><Clock3 size={17} /> Time well looked after</span>
              </div>
            </div>
            <div className="hero-visual" aria-label="A bright, considered home interior">
              <div className="hero-image" role="img" aria-label="Sunlit living space with warm, natural textures" />
              <div className="image-caption"><span className="caption-mark"><House size={17} /></span><span><strong>Make room for home.</strong><small>Care in every corner.</small></span><ArrowUpRight size={18} /></div>
              <div className="floating-note"><span className="note-check"><Check size={16} /></span><span><strong>One less thing</strong><small>on your to-do list</small></span></div>
              <span className="visual-index">01 / 03</span>
            </div>
            <div className="hero-side-label">HOME, HANDLED WITH CARE</div>
          </section>

          <section className="services-section" id="services" aria-labelledby="services-title">
            <div className="section-heading">
              <div><p className="eyebrow"><span /> A good place to start</p><h2 id="services-title">The things that make<br className="desktop-break" /> home <em>feel like home.</em></h2></div>
              <p className="section-intro">No job too small. Just practical, thoughtful help for the tasks that keep your home ticking.</p>
            </div>
            <div className="service-grid">{services.map((service) => <ServiceCard key={service.number} service={service} />)}</div>
          </section>

          <section className="approach-section" id="about" aria-label="Our approach">
            <div className="approach-art" aria-hidden="true"><div className="sun-disc" /><div className="line-house"><span /><span /><span /></div><span className="art-spark">✳</span><span className="art-caption">A LITTLE MORE<br />EASE, EVERY DAY</span></div>
            <div className="approach-copy"><p className="eyebrow"><span /> The sample standard</p><h2>Good work should<br />feel <em>easy.</em></h2><p>We believe home help should be simple, respectful, and reassuring. Clear communication, careful work, and a tidy finish—every little detail matters.</p><a className="text-link" href="#contact">Tell us what’s on your list <ArrowUpRight size={16} /></a></div>
            <div className="approach-seal"><span>THOUGHTFUL<br />BY NATURE</span><span className="seal-flower">✳</span></div>
          </section>

          <section className="contact-section" id="contact" aria-labelledby="contact-title">
            <div className="contact-copy"><p className="eyebrow"><span /> Start a conversation</p><h2 id="contact-title">What’s on<br />your <em>list?</em></h2><p>Tell us about the little things you’d love to get done. We’ll take it from there—one step at a time.</p><div className="contact-aside"><span className="aside-icon"><Mail size={19} /></span><span><strong>Prefer a note?</strong><small>Send a message using the form</small></span></div></div>
            <div className="contact-form-panel"><div className="form-heading"><span>01 <i>—</i> SAY HELLO</span><span className="form-spark">✳</span></div><ContactForm /></div>
          </section>
        </main>

        <footer className="site-footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Wrench size={17} /></span><span className="brand-name">sample<span>home</span></span></a><span className="footer-disclaimer">Demonstration only — no services offered</span><span className="copyright">© 2025 Sample Home Services</span></footer>
      </div>
    </div>
  );
}

export default App;
