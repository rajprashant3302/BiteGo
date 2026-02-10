'use client';

import React, { useEffect } from 'react';

// --- TYPES ---
type ViewState = 'home' | 'login' | 'signup' | 'forgot' | 'dashboard';

interface NavProps {
  navigateTo?: (view: ViewState) => void;
}

export default function Home({ navigateTo = (view) => console.log(`Navigating to ${view}`) }: NavProps) {
  
  // --- MOUSE TRACKING & FONTS ---
  useEffect(() => {
    // 1. Inject Fonts & Icons
    const linkFA = document.createElement('link');
    linkFA.rel = 'stylesheet';
    linkFA.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(linkFA);

    const linkFonts = document.createElement('link');
    linkFonts.rel = 'stylesheet';
    linkFonts.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(linkFonts);

    // 2. Mouse Spotlight Logic
    const handleMouseMove = (e: MouseEvent) => {
      const xPct = (e.clientX / window.innerWidth) * 100;
      const yPct = (e.clientY / window.innerHeight) * 100;
      const newHue = Math.floor((e.clientX / window.innerWidth) * 360);
      
      document.documentElement.style.setProperty('--x', `${xPct}%`);
      document.documentElement.style.setProperty('--y', `${yPct}%`);
      document.documentElement.style.setProperty('--hue', newHue.toString());
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        /* HOME PAGE SPECIFIC STYLES */
        :root { --primary: #ff4757; --primary-dark: #d32f2f; --accent: #ffa502; --dark: #1e1e1e; --black: #000000; --white: #ffffff; --x: 50%; --y: 50%; --hue: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: var(--black); color: var(--white); overflow-x: hidden; background-image: radial-gradient(circle at var(--x) var(--y), hsl(var(--hue), 60%, 15%) 0%, #000000 60%); transition: background-image 0.1s ease; }

        #landing-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; }
        .spotlight-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(1000px circle at var(--x) var(--y), hsla(var(--hue), 80%, 60%, 0.1), transparent 50%); pointer-events: none; z-index: 1; }

        .hero-section { flex: 1; display: flex; align-items: center; padding: 0 80px; position: relative; z-index: 2; }
        .hero-title { font-family: 'Playfair Display'; font-size: 6rem; line-height: 1.1; margin-bottom: 30px; background: linear-gradient(to right, #fff, #bbb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-title span { color: var(--primary); -webkit-text-fill-color: var(--primary); font-style: italic; }
        .hero-subtitle { font-size: 1.3rem; color: #aaa; margin-bottom: 50px; line-height: 1.6; max-width: 600px; }
        .cta-btn { display: inline-flex; align-items: center; gap: 15px; padding: 20px 50px; background: var(--primary); color: #fff; text-decoration: none; border: none; border-radius: 16px; font-size: 1.2rem; font-weight: 700; transition: 0.3s; box-shadow: 0 10px 40px rgba(255, 71, 87, 0.4); cursor: pointer; }
        .cta-btn:hover { transform: translateY(-5px); background: var(--primary-dark); }
        .hero-image { position: absolute; right: 0; top: 0; width: 55%; height: 100%; background: url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070') center/cover; mask-image: linear-gradient(to right, transparent, black 40%); -webkit-mask-image: linear-gradient(to right, transparent, black 40%); opacity: 0.8; z-index: -1; }
        .nav-btn { background: transparent; padding: 12px 30px; border: 1px solid rgba(255,255,255,0.2); border-radius: 30px; color: #fff; cursor: pointer; font-weight: 500; transition: 0.3s; font-size: 1rem; }
        .nav-btn:hover { border-color: var(--primary); background: rgba(255, 71, 87, 0.1); }
        .floating-badge { position: absolute; bottom: 100px; right: 100px; background: rgba(20,20,20,0.8); backdrop-filter: blur(20px); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 15px; animation: float 4s ease-in-out infinite; }
        .badge-icon { width: 50px; height: 50px; background: #333; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        
        nav { padding: 30px 60px; display: flex; justify-content: space-between; align-items: center; z-index: 100; }
        .logo { font-family: 'Playfair Display'; font-size: 2rem; font-weight: 900; color: var(--primary); display: flex; align-items: center; gap: 10px; }

        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @media (max-width: 1000px) { .hero-title { font-size: 4rem; } .hero-image { opacity: 0.4; width: 100%; mask-image: linear-gradient(to bottom, transparent, black); } .hero-section { justify-content: center; text-align: center; } .hero-content { max-width: 100%; } .floating-badge { display: none; } }
      `}</style>
      
      <div id="landing-layer">
        <div className="spotlight-layer"></div>
        <div className="hero-image"></div>
        <nav>
          <div className="logo"><i className="fas fa-box-open"></i> Yummy Box.</div>
          {/* Manual Link: Switches state to 'login' */}
          <button onClick={() => navigateTo('login')} className="nav-btn">Sign In</button>
        </nav>

        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Taste the <br/>
              <span>Extraordinary.</span>
            </h1>
            <p className="hero-subtitle">
              Experience the finest culinary delights delivered straight to your doorstep. 
              Fresh ingredients, world-class chefs, and lightning-fast delivery.
            </p>
            {/* Manual Link: Switches state to 'login' */}
            <button onClick={() => navigateTo('login')} className="cta-btn">
              Get Started <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div className="floating-badge">
            <div className="badge-icon">🔥</div>
            <div className="badge-text">
              <div>Hot Delivery</div>
              <div>25-30 min</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}