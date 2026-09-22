import React from 'react';

export default function FynaptixLanding() {
  return (
    <div className="bg-[#080b0f] text-[#dde1eb] min-h-screen font-sans selection:bg-[#f0a500] selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#080b0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#f0a500] rounded flex items-center justify-center text-black font-bold text-xs">FX</div>
            <span className="font-mono font-bold tracking-widest text-sm">FYNAPTIX</span>
          </div>
          <div className="hidden md:flex gap-8 text-xs font-mono text-[#5a6478]">
            <a href="#services" className="hover:text-[#f0a500] transition">SERVICES</a>
            <a href="#protocol" className="hover:text-[#f0a500] transition">x402 PROTOCOL</a>
            <a href="#contact" className="hover:text-[#f0a500] transition">CONNECT</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 border border-[#f0a500]/30 rounded-full text-[10px] font-mono text-[#f0a500] mb-6 tracking-tighter">
            LIVE ON THE AGENTIC MARKETPLACE
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
            Bridges for the <span className="text-[#f0a500]">Agentic</span> Economy
          </h1>
          <p className="max-w-2xl mx-auto text-[#5a6478] text-lg mb-10 leading-relaxed">
            Fynaptix integrates legacy data assets into the machine-native workforce. 
            We build the neural pathways that allow your business to think, connect, and monetize autonomously.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button className="px-8 py-3 bg-[#f0a500] text-black font-bold rounded-lg text-sm hover:bg-[#ffc107] transition">
              DEPLOY AN AGENT
            </button>
            <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition">
              VIEW PROTOCOL
            </button>
          </div>
        </div>
      </section>

      {/* The Banner Area (Neural Background) */}
      <section className="px-6 py-10">
        <div className="max-w-7xl mx-auto h-[400px] rounded-2xl overflow-hidden border border-white/10 relative">
          {/* Replace this div with your actual Banner image */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] to-[#1c2330] flex items-center justify-center">
            <p className="text-[#5a6478] font-mono text-xs italic">[Neural Banner Image Asset]</p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 px-6 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="text-[#f0a500] font-mono text-xs">01 // AUDIT</div>
            <h3 className="text-xl font-semibold">Asset Discovery</h3>
            <p className="text-sm text-[#5a6478] leading-relaxed">We identify the high-value "atomic skills" within your legacy databases that are currently invisible to AI agents.</p>
          </div>
          <div className="space-y-4">
            <div className="text-[#f0a500] font-mono text-xs">02 // ARCHITECTURE</div>
            <h3 className="text-xl font-semibold">AgentKit Wrappers</h3>
            <p className="text-sm text-[#5a6478] leading-relaxed">Using Coinbase AgentKit, we wrap your assets in machine-readable MCP schemas for programmatic discovery.</p>
          </div>
          <div className="space-y-4">
            <div className="text-[#f0a500] font-mono text-xs">03 // SETTLEMENT</div>
            <h3 className="text-xl font-semibold">x402 Integration</h3>
            <p className="text-sm text-[#5a6478] leading-relaxed">Automate revenue with micro-payments in USDC. No invoices, no credit cards, just pure automated settlement.</p>
          </div>
        </div>
      </section>

      {/* Footer / Wallet */}
      <footer id="contact" className="py-20 border-t border-white/5 text-center px-6">
        <p className="text-xs font-mono text-[#5a6478] mb-4 tracking-widest uppercase">Agentic Handshake</p>
        <p className="text-sm text-white/80 mb-8">Ready to exit the 8-5? Let's build the future of work.</p>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 font-mono text-[10px]">
          <span className="text-[#f0a500]">BASE:</span> 0x857...2941 (Fynaptix_Treasury)
        </div>
      </footer>
    </div>
  );
}