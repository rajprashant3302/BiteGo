'use client';

import React, { useState, useEffect } from 'react';

// --- TYPES ---
type ViewState = 'home' | 'login' | 'signup' | 'forgot' | 'dashboard';

interface NavProps {
  navigateTo?: (view: ViewState) => void;
}

export default function SignupForm({ navigateTo = (view) => console.log(`Navigating to ${view}`) }: NavProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API registration
    setTimeout(() => {
        setIsLoading(false);
        // Navigate to dashboard after successful signup
        navigateTo('dashboard');
    }, 1500);
  };

  return (
    <>
      <style>{`
        :root { --primary: #ff4757; --primary-dark: #d32f2f; --accent: #ffa502; --dark: #1e1e1e; --black: #000000; --white: #ffffff; --x: 50%; --y: 50%; --hue: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: var(--black); color: var(--white); overflow-x: hidden; background-image: radial-gradient(circle at var(--x) var(--y), hsl(var(--hue), 60%, 15%) 0%, #000000 60%); transition: background-image 0.1s ease; }
        
        #auth-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 5000; display: flex; align-items: center; justify-content: center; background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070') no-repeat center center; background-size: cover; animation: fadeIn 1s ease; }
        #auth-layer::before { content: ''; position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); }
        
        .auth-card { position: relative; width: 1000px; min-height: 650px; background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; display: flex; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.9); }
        .spotlight-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(800px circle at var(--x) var(--y), hsla(var(--hue), 80%, 60%, 0.1), transparent 45%); pointer-events: none; z-index: 1; }
        
        .auth-visual { flex: 0.9; background: url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069') center/cover; position: relative; display: flex; align-items: flex-end; padding: 40px; }
        .visual-text { position: relative; z-index: 2; }
        .visual-text h2 { font-family: 'Playfair Display', serif; font-size: 4rem; line-height: 1; text-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .visual-text span { color: var(--primary); font-style: italic; }
        
        .auth-form-container { flex: 1.1; padding: 60px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 5; }
        .auth-form-box { width: 100%; max-width: 400px; animation: slideIn 0.6s ease; }
        
        .brand-header h3 { font-family: 'Playfair Display', serif; font-size: 3rem; background: linear-gradient(to right, #fff, var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 25px; }
        
        .input-wrap { position: relative; margin-bottom: 24px; }
        .input-wrap input { width: 100%; padding: 16px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; outline: none; color: #fff; transition: 0.3s; font-family: inherit; }
        .input-wrap input:focus { border-color: var(--primary); background: rgba(255,255,255,0.08); }
        .input-wrap label { position: absolute; left: 20px; top: 16px; color: #777; pointer-events: none; transition: 0.3s; }
        .input-wrap input:focus ~ label, .input-wrap input:not(:placeholder-shown) ~ label { top: -12px; left: 12px; font-size: 0.8rem; color: var(--primary); background: #111; padding: 0 6px; }
        
        .chef-btn { width: 100%; padding: 18px; background: var(--primary); color: #fff; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 25px rgba(255, 71, 87, 0.4); }
        .chef-btn:hover:not(:disabled) { transform: translateY(-3px); background: var(--primary-dark); }
        .chef-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .divider { display: flex; align-items: center; gap: 15px; color: #555; margin: 30px 0; font-size: 0.75rem; font-weight: 600; letter-spacing: 2px; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        
        .google-btn { background: #fff; color: #111; border: none; font-weight: 600; width: 100%; padding: 16px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.3s; }
        .google-btn:hover { background: #f1f1f1; transform: translateY(-2px); }
        
        .footer-link { text-align: center; margin-top: 30px; font-size: 0.9rem; color: #888; }
        .footer-link span { color: #fff; cursor: pointer; text-decoration: underline; font-weight: 600; margin-left: 5px; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        
        @media (max-width: 1050px) { .auth-card { width: 95%; flex-direction: column; min-height: auto; } .auth-visual { height: 220px; flex: none; } .auth-form-container { padding: 40px; } }
      `}</style>

      <div id="auth-layer">
        <div className="auth-card">
          <div className="spotlight-layer"></div>
          
          <div className="auth-visual">
            <div className="visual-text">
              <h2>Join.<br/><span>The Taste.</span></h2>
            </div>
          </div>

          <div className="auth-form-container">
            <div className="auth-form-box active">
              <div className="brand-header">
                <h3>Join Us.</h3>
              </div>
              
              <form onSubmit={handleSignup}>
                <div className="input-wrap">
                  <input 
                    type="text" 
                    required 
                    placeholder=" " 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <label>Full Name</label>
                </div>

                <div className="input-wrap">
                  <input 
                    type="email" 
                    required 
                    placeholder=" " 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label>Email</label>
                </div>

                <div className="input-wrap">
                  <input 
                    type="password" 
                    required 
                    placeholder=" " 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label>Create Password</label>
                </div>

                <button className="chef-btn" type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Get Started'}
                </button>
              </form>

              <div className="divider">OR</div>

              <div className="social-buttons single-social">
                <button className="social-btn google-btn" type="button">
                  <i className="fab fa-google"></i> Register with Google
                </button>
              </div>

              <div className="footer-link">
                {/* LINK BACK TO LOGIN */}
                Have an account? <span onClick={() => navigateTo('login')} style={{color: '#fff', textDecoration: 'underline', cursor: 'pointer'}}>Log In</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}