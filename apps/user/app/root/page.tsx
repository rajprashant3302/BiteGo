'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- TYPES FOR NAVIGATION ---
// This defines the valid pages in our app
type ViewState = 'home' | 'login' | 'signup' | 'forgot' | 'dashboard';

// The prop interface that every component will accept to be able to navigate
interface NavProps {
  navigateTo: (view: ViewState) => void;
}

// --- 1. HOME COMPONENT ---
const Home = ({ navigateTo }: NavProps) => {
  return (
    <div id="landing-layer">
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
  );
};

// --- 2. LOGIN COMPONENT ---
const Login = ({ navigateTo }: NavProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay then navigate to Dashboard
    setTimeout(() => {
      setIsLoading(false);
      navigateTo('dashboard');
    }, 1200);
  };

  return (
    <div id="auth-layer">
      <div className="auth-card">
        <div className="auth-visual">
          <div className="visual-text">
            <h2>Pure.<br/><span>Crave.</span></h2>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-box active">
            <div className="brand-header">
              <div className="logo-wrapper">
                <h3><i className="fas fa-box-open"></i> Yummy Box.</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-wrap">
                <input type="email" required placeholder=" " />
                <label>Email</label>
              </div>
              <div className="input-wrap">
                <input type="password" required placeholder=" " />
                <label>Password</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px', marginBottom: '20px' }}>
                {/* Manual Link: Switches state to 'forgot' */}
                <span onClick={() => navigateTo('forgot')} style={{ color: '#888', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Forgot Password?
                </span>
              </div>

              <button className="chef-btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Authenticating...' : 'Log In'}
              </button>
            </form>

            <div className="divider">OR</div>
            <div className="social-buttons single-social">
              <button className="social-btn google-btn" type="button">
                <i className="fab fa-google"></i> Continue with Google
              </button>
            </div>

            <div className="footer-link">
              {/* Manual Link: Switches state to 'signup' */}
              Not a member? <span onClick={() => navigateTo('signup')}>Sign Up Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 3. SIGNUP COMPONENT ---
const Signup = ({ navigateTo }: NavProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigateTo('dashboard');
    }, 1200);
  };

  return (
    <div id="auth-layer">
      <div className="auth-card">
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
            
            <form onSubmit={handleSubmit}>
              <div className="input-wrap">
                <input type="text" required placeholder=" " />
                <label>Full Name</label>
              </div>
              <div className="input-wrap">
                <input type="email" required placeholder=" " />
                <label>Email</label>
              </div>
              <div className="input-wrap">
                <input type="password" required placeholder=" " />
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
              {/* Manual Link: Switches state to 'login' */}
              Have an account? <span onClick={() => navigateTo('login')}>Log In</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. FORGOT PASSWORD COMPONENT ---
const ForgotPassword = ({ navigateTo }: NavProps) => {
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div id="auth-layer">
      <div className="auth-card">
        <div className="auth-visual">
          <div className="visual-text">
            <h2>Fresh.<br/><span>Start.</span></h2>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-box active">
            <div className="brand-header">
              <div className="logo-wrapper">
                <h3>Recover.</h3>
              </div>
            </div>

            {!isSent ? (
              <>
                <p style={{ color: '#aaa', marginBottom: '25px', fontSize: '0.9rem', textAlign: 'center' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="input-wrap">
                    <input type="email" required placeholder=" " />
                    <label>Email Address</label>
                  </div>
                  <button className="chef-btn" type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <i className="fas fa-envelope-open-text" style={{ fontSize: '3rem', color: '#ff4757', marginBottom: '15px' }}></i>
                <h4 style={{ color: '#fff', marginBottom: '10px' }}>Check your mail</h4>
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  We have sent password recovery instructions to your email.
                </p>
              </div>
            )}

            <div className="footer-link">
              {/* Manual Link: Switches state to 'login' */}
              Remembered it? <span onClick={() => navigateTo('login')}>Back to Log In</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. DASHBOARD COMPONENT ---
const Dashboard = ({ navigateTo }: NavProps) => {
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const menuData = [
    { id: 1, name: "Truffle Burger", category: "burger", price: 18.00, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000" },
    { id: 2, name: "Spicy Pepperoni", category: "pizza", price: 22.50, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1000" },
    { id: 3, name: "Dragon Roll", category: "asian", price: 16.00, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000" },
    { id: 4, name: "Double Cheeseburger", category: "burger", price: 15.00, img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=1000" },
    { id: 5, name: "Molten Cake", category: "dessert", price: 12.00, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=1000" },
    { id: 6, name: "Pad Thai", category: "asian", price: 14.50, img: "https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=1000" },
  ];

  const addToCart = (item: any) => {
    setCart([...cart, item]);
    setIsCartOpen(true);
    triggerConfetti();
  };

  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles: any[] = [];
    for(let i=0; i<60; i++) {
      particles.push({
        x: window.innerWidth - 100, y: 100,
        vx: (Math.random() - 0.8) * 15, vy: (Math.random() - 0.5) * 15,
        size: Math.random() * 6 + 4, color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`,
        life: 80, grav: 0.4
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for(let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life--;
        ctx.fillStyle = p.color; 
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if(p.life <= 0 || p.y > canvas.height) particles.splice(i, 1);
      }
      if(particles.length > 0) requestAnimationFrame(animate);
    }
    animate();
  };

  const filteredMenu = activeCategory === 'all' ? menuData : menuData.filter(item => item.category === activeCategory);
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div id="app-layer">
      <nav>
        <div className="logo"><i className="fas fa-box-open"></i> Yummy Box</div>
        <ul className="nav-links">
          <li><a href="#" className="active">Home</a></li>
          <li><a href="#">Menu</a></li>
          {/* Manual Link: Sign Out goes back to Home */}
          <li onClick={() => navigateTo('home')} style={{cursor:'pointer'}}>Sign Out</li>
        </ul>
        <div className="nav-actions">
          <div className="cart-icon" onClick={() => setIsCartOpen(!isCartOpen)}>
            <i className="fas fa-shopping-bag"></i>
            <span className="badge">{cart.length}</span>
          </div>
          <div className="user-avatar">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100" alt="User" />
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>Hungry?<br/><span>We got you.</span></h1>
          <p>Premium meals from top-tier chefs delivered to your doorstep in minutes.</p>
          <button className="chef-btn" style={{width: 'auto', padding: '15px 40px'}}>Start Ordering</button>
        </div>
      </section>

      <div className="categories">
        {['all', 'burger', 'pizza', 'asian', 'dessert'].map(cat => (
          <span key={cat} className={`cat-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </span>
        ))}
      </div>

      <div className="menu-grid">
        {filteredMenu.map(item => (
          <div className="food-card" key={item.id}>
            <img src={item.img} className="card-img" alt={item.name} />
            <div className="card-info">
              <div className="card-header">
                <span className="card-title">{item.name}</span>
                <span className="card-price">${item.price.toFixed(2)}</span>
              </div>
              <button className="add-btn" onClick={() => addToCart(item)}>
                <i className="fas fa-plus"></i> Add to Box
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Your Order</h3>
          <i className="fas fa-times close-btn" onClick={() => setIsCartOpen(false)}></i>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart"><i className="fas fa-box-open"></i><p>Your cart is empty.</p></div>
          ) : (
            cart.map((item, idx) => (
              <div className="cart-item" key={`${item.id}-${idx}`}>
                <img src={item.img} className="item-img" alt={item.name} />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <span className="item-price">${item.price.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-total">
          <div className="total-row"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
          <button className="chef-btn" disabled={cart.length === 0}>Checkout Now</button>
        </div>
      </div>
      <canvas ref={confettiCanvasRef} id="confetti-canvas"></canvas>
    </div>
  );
};

// --- 6. MAIN APP COMPONENT (THE ROUTER) ---
export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');

  // --- GLOBAL EFFECTS (Fonts & Mouse Tracking) ---
  useEffect(() => {
    // Inject Fonts
    const linkFA = document.createElement('link');
    linkFA.rel = 'stylesheet';
    linkFA.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(linkFA);

    const linkFonts = document.createElement('link');
    linkFonts.rel = 'stylesheet';
    linkFonts.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(linkFonts);

    // Mouse Spotlight
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
        /* HOME PAGE STYLES (Merging here for simplicity) */
        #landing-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; }
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
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @media (max-width: 1000px) { .hero-title { font-size: 4rem; } .hero-image { opacity: 0.4; width: 100%; mask-image: linear-gradient(to bottom, transparent, black); } .hero-section { justify-content: center; text-align: center; } .hero-content { max-width: 100%; } .floating-badge { display: none; } }
      `}</style>
      
      {/* --- VIEW SWITCHING LOGIC --- */}
      {currentView === 'home' && <Home navigateTo={setCurrentView} />}
      {currentView === 'login' && <Login navigateTo={setCurrentView} />}
      {currentView === 'signup' && <Signup navigateTo={setCurrentView} />}
      {currentView === 'forgot' && <ForgotPassword navigateTo={setCurrentView} />}
      {currentView === 'dashboard' && <Dashboard navigateTo={setCurrentView} />}
    </>
  );
}