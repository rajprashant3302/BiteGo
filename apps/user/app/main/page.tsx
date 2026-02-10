'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- TYPES ---
type ViewState = 'home' | 'login' | 'signup' | 'forgot' | 'dashboard';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  img: string;
}

interface NavProps {
  navigateTo?: (view: ViewState) => void;
}

export default function Dashboard({ navigateTo = (view) => console.log(`Navigating to ${view}`) }: NavProps) {
  // --- STATE ---
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Confetti ref
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- MENU DATA ---
  const menuData: MenuItem[] = [
    { id: 1, name: "Truffle Burger", category: "burger", price: 18.00, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000" },
    { id: 2, name: "Spicy Pepperoni", category: "pizza", price: 22.50, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1000" },
    { id: 3, name: "Dragon Roll", category: "asian", price: 16.00, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000" },
    { id: 4, name: "Double Cheeseburger", category: "burger", price: 15.00, img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=1000" },
    { id: 5, name: "Molten Cake", category: "dessert", price: 12.00, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=1000" },
    { id: 6, name: "Pad Thai", category: "asian", price: 14.50, img: "https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=1000" },
  ];

  // --- EFFECTS ---
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

  // --- LOGIC ---
  const addToCart = (item: MenuItem) => {
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
        x: window.innerWidth - 100, y: 100, // Spawn near cart icon
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

  const filteredMenu = activeCategory === 'all' 
    ? menuData 
    : menuData.filter(item => item.category === activeCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <style>{`
        :root { --primary: #ff4757; --primary-dark: #d32f2f; --accent: #ffa502; --dark: #1e1e1e; --black: #000000; --white: #ffffff; --x: 50%; --y: 50%; --hue: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: var(--black); color: var(--white); overflow-x: hidden; background-image: radial-gradient(circle at var(--x) var(--y), hsl(var(--hue), 60%, 15%) 0%, #000000 60%); transition: background-image 0.1s ease; }
        
        /* Dashboard Specific Styles */
        #app-layer { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        nav { position: fixed; top: 0; width: 100%; padding: 25px 60px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); z-index: 1000; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logo { font-family: 'Playfair Display'; font-size: 1.8rem; font-weight: 900; color: var(--primary); }
        .nav-links { display: flex; gap: 40px; list-style: none; }
        .nav-links a { color: #fff; text-decoration: none; font-weight: 500; opacity: 0.7; transition: 0.3s; }
        .nav-links a.active { opacity: 1; color: var(--primary); }
        .nav-actions { display: flex; gap: 20px; align-items: center; }
        .cart-icon { position: relative; cursor: pointer; font-size: 1.4rem; color: #fff; }
        .badge { position: absolute; top: -8px; right: -10px; background: var(--primary); font-size: 0.7rem; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .user-avatar { width: 35px; height: 35px; background: #333; border-radius: 50%; overflow: hidden; }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .hero { height: 85vh; padding: 0 80px; display: flex; align-items: center; background: linear-gradient(to right, #000 40%, transparent), url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981') center/cover fixed; }
        .hero h1 { font-family: 'Playfair Display'; font-size: 5rem; line-height: 1; margin-bottom: 20px; }
        .hero span { color: var(--primary); }
        .hero p { color: #aaa; font-size: 1.2rem; max-width: 550px; margin-bottom: 35px; }
        
        .chef-btn { padding: 15px 40px; background: var(--primary); color: #fff; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 25px rgba(255, 71, 87, 0.4); }
        .chef-btn:hover { transform: translateY(-3px); background: var(--primary-dark); }
        .chef-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .categories { padding: 40px 80px; display: flex; gap: 15px; overflow-x: auto; scrollbar-width: none; }
        .cat-pill { padding: 12px 30px; background: #1a1a1a; border-radius: 40px; cursor: pointer; transition: 0.3s; border: 1px solid transparent; }
        .cat-pill.active { background: var(--primary); border-color: var(--primary); font-weight: 600; }
        .cat-pill:hover:not(.active) { background: #2a2a2a; }

        .menu-grid { padding: 0 80px 100px; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 40px; }
        .food-card { background: #111; border-radius: 25px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); transition: 0.4s; }
        .food-card:hover { transform: translateY(-12px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .card-img { width: 100%; height: 240px; object-fit: cover; }
        .card-info { padding: 25px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 1.25rem; font-weight: 700; }
        .card-price { color: var(--primary); font-family: 'Playfair Display'; font-size: 1.4rem; font-weight: 900; }
        .add-btn { width: 100%; padding: 14px; background: #222; border: none; border-radius: 12px; color: #fff; cursor: pointer; transition: 0.2s; font-weight: 600; }
        .add-btn:hover { background: var(--primary); }

        .cart-drawer { position: fixed; top: 0; right: -420px; width: 400px; height: 100%; background: #111; z-index: 2000; transition: 0.5s cubic-bezier(0.7, 0, 0.3, 1); padding: 40px; display: flex; flex-direction: column; box-shadow: -20px 0 50px rgba(0,0,0,0.8); }
        .cart-drawer.open { right: 0; }
        .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .close-btn { font-size: 1.5rem; cursor: pointer; color: #666; transition: 0.3s; }
        .close-btn:hover { color: var(--primary); }
        
        .cart-items { flex: 1; overflow-y: auto; padding-right: 5px; }
        .cart-item { display: flex; gap: 20px; margin-bottom: 25px; align-items: center; animation: slideIn 0.3s; }
        @keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .item-img { width: 70px; height: 70px; border-radius: 15px; object-fit: cover; }
        .item-details h4 { font-size: 1rem; margin-bottom: 5px; }
        .item-price { color: var(--primary); font-weight: 700; }
        
        .empty-cart { text-align: center; margin-top: 100px; color: #444; }
        .empty-cart i { font-size: 4rem; margin-bottom: 20px; }
        .cart-total { margin-top: 30px; border-top: 1px solid #222; padding-top: 30px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 1.5rem; font-weight: 800; }
        
        #confetti-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10000; }
        
        @media (max-width: 1050px) { .hero h1 { font-size: 3.5rem; } nav { padding: 20px 30px; } .cart-drawer { width: 100%; right: -100%; } }
      `}</style>

      <div id="app-layer">
        <nav>
          <div className="logo"><i className="fas fa-box-open"></i> Yummy Box</div>
          <ul className="nav-links">
            <li><a href="#" className="active">Home</a></li>
            <li><a href="#">Menu</a></li>
            {/* UPDATED: Sign Out now navigates to 'login' */}
            <li onClick={() => navigateTo('login')} style={{cursor:'pointer'}}>Sign Out</li>
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
            <span 
              key={cat} 
              className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
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

        {/* CART DRAWER */}
        <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>Your Order</h3>
            <i className="fas fa-times close-btn" onClick={() => setIsCartOpen(false)}></i>
          </div>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <i className="fas fa-box-open"></i>
                <p>Your cart is empty.</p>
              </div>
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
            <div className="total-row">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="chef-btn" disabled={cart.length === 0}>Checkout Now</button>
          </div>
        </div>

        <canvas ref={confettiCanvasRef} id="confetti-canvas"></canvas>
      </div>
    </>
  );
}