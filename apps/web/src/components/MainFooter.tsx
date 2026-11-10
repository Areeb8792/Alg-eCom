import React from 'react';

export const MainFooter: React.FC = () => {
  return (
    <footer className="bg-ink text-white pt-32 pb-8 px-12 relative overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 mb-40 relative z-10">
        <div className="col-span-2">
          <h4 className="anton-heading text-2xl mb-6">SUBSCRIBE TO UPDATES</h4>
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center border-b border-white/20 pb-2">
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="bg-transparent space-grotesk text-xs outline-none w-full placeholder:text-zinc-500"
            />
            <button className="text-xs font-bold space-grotesk uppercase hover:line-through">
              JOIN
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h5 className="space-grotesk text-[10px] tracking-[0.2em] opacity-40 uppercase">Shop</h5>
          <nav className="flex flex-col gap-2">
            <a href="#essentials" className="space-grotesk text-xs hover:line-through">ESSENTIALS</a>
            <a href="#collections" className="space-grotesk text-xs hover:line-through">COLLECTIONS</a>
            <a href="#objects" className="space-grotesk text-xs hover:line-through">OBJECTS</a>
          </nav>
        </div>

        <div className="space-y-4">
          <h5 className="space-grotesk text-[10px] tracking-[0.2em] opacity-40 uppercase">Info</h5>
          <nav className="flex flex-col gap-2">
            <a href="#sizing" className="space-grotesk text-xs hover:line-through">SIZING</a>
            <a href="#stockists" className="space-grotesk text-xs hover:line-through">STOCKISTS</a>
            <a href="#lookbook" className="space-grotesk text-xs hover:line-through">LOOKBOOK</a>
          </nav>
        </div>

        <div className="space-y-4">
          <h5 className="space-grotesk text-[10px] tracking-[0.2em] opacity-40 uppercase">Contact</h5>
          <nav className="flex flex-col gap-2">
            <a href="#instagram" className="space-grotesk text-xs hover:line-through">INSTAGRAM</a>
            <a href="#twitter" className="space-grotesk text-xs hover:line-through">TWITTER</a>
            <a href="mailto:concierge@heavyweight.com" className="space-grotesk text-xs hover:line-through">EMAIL US</a>
          </nav>
        </div>

        <div className="space-y-4">
          <h5 className="space-grotesk text-[10px] tracking-[0.2em] opacity-40 uppercase">Location</h5>
          <p className="space-grotesk text-xs opacity-60 leading-relaxed">
            124 CANAL ST<br />
            NEW YORK, NY 10002
          </p>
        </div>
      </div>

      {/* Massive Background Watermark */}
      <div className="absolute bottom-[-5vw] left-0 w-full flex justify-center pointer-events-none select-none">
        <h2 className="anton-heading text-[25vw] leading-none text-white/5 opacity-10">HEAVY</h2>
      </div>

      <div className="relative z-10 flex justify-between items-center pt-8 border-t border-white/10 text-xs">
        <span className="space-grotesk text-[10px] opacity-40">
          © 2024 HEAVYWEIGHT CORP. / ALGIONS AI LABS ASSESSMENT
        </span>
        <div className="flex gap-4 opacity-40 font-mono text-[10px]">
          <span>DEV & CLOUD ENG</span>
          <span>•</span>
          <span>DOCKER & CI/CD</span>
        </div>
      </div>
    </footer>
  );
};
