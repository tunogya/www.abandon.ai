import { Link } from "react-router";

export function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--accents-2) 1px, transparent 1px),
            linear-gradient(to bottom, var(--accents-2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          opacity: 0.2
        }}
      />

      <main className="max-w-5xl w-full z-10 flex flex-col gap-16">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accents-2 bg-accents-1 text-xs font-medium text-accents-5 mb-4">
            <span className="w-2 h-2 rounded-full bg-vercel-blue animate-pulse"></span>
            <span>Vercel Style V4 Design System</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground to-accents-4">
              Develop. Preview. Ship.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-accents-5 max-w-2xl text-center leading-relaxed">
            The platform for frontend developers, providing the speed and reliability you need to build at the speed of your creativity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button className="h-12 px-8 rounded-md bg-foreground text-background font-medium text-base hover:bg-accents-7 transition-colors duration-200">
              Start Deploying
            </button>
            <button className="h-12 px-8 rounded-md border border-accents-2 bg-background text-foreground font-medium text-base hover:border-foreground hover:text-foreground transition-all duration-200">
              Get a Demo
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Card
            title="Global Edge Network"
            description="Deploy your content to our global edge network for the fastest delivery speeds."
            icon={<GlobeIcon />}
          />
          <Card
            title="Serverless Functions"
            description="Run server-side code without managing servers. Scale automatically with traffic."
            icon={<LightningIcon />}
          />
          <Card
            title="Frontend Frameworks"
            description="First-class support for Next.js, React, Vue, Svelte, and more."
            icon={<CodeIcon />}
          />
          <Card
            title="Collaborative Previews"
            description="Every deploy gets a unique URL. Share with your team for instant feedback."
            icon={<EyeIcon />}
          />
          <Card
            title="Analytics"
            description="Real-time insights into your application's performance and usage."
            icon={<ChartIcon />}
          />
          <Card
            title="Security"
            description="Enterprise-grade security features to keep your data and users safe."
            icon={<LockIcon />}
          />
        </section>
      </main>

      <footer className="w-full max-w-5xl mt-24 border-t border-accents-2 pt-8 flex flex-col md:flex-row justify-between items-center text-accents-5 text-sm">
        <p>© 2025 ABANDON INC. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Status</a>
        </div>
      </footer>
    </div>
  );
}

function Card({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="group p-6 rounded-lg border border-accents-2 bg-background hover:border-foreground transition-colors duration-300 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-full bg-accents-1 flex items-center justify-center border border-accents-2 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-accents-5 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Icons
function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
  )
}

function LightningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
  )
}

function CodeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
  )
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  )
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
  )
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  )
}
