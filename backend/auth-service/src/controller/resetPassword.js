const bcrypt = require("bcryptjs");
const { prisma } = require("database");
const { generateToken, generateVerificationToken, verifyToken } = require("../utils/jwt");
const { publishEvent } = require("../kafka/producer");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";
const LOGIN_URL = `${FRONTEND_URL.replace(/\/$/, "")}/login`;


exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { Email: email }
    });

    
    if (!existingUser) {
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent."
      });
    }

    const resetToken = generateVerificationToken({
      email,
      purpose: "RESET_PASSWORD"
    });

    await publishEvent("RESET_PASSWORD_INITIATED", {
      email,
      verificationLink: `http://${AUTH_SERVICE_URL}/api/auth/reset-password?token=${resetToken}`
    });

    console.log(`📨 Reset password email sent to ${email}`);

    res.status(200).json({
      message: "If this email exists, a reset link has been sent."
    });

  } catch (error) {
    console.error("❌ RESET INIT ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.showResetPasswordPage = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid reset link");
  }

  try {
    verifyToken(token); 

    const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "/login";

    // Sending a fully stylized, Tailwind-powered HTML page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Create New Password</title>
        
        <script src="https://cdn.tailwindcss.com"></script>
        
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: { sans: ['Inter', 'sans-serif'] },
                colors: {
                  brand: {
                    50: '#FFF0E6',
                    500: '#FF651D',
                    600: '#D84A00',
                  }
                }
              }
            }
          }
        </script>
        
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { background-color: #f9fafb; }
          .loader { 
            border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; 
            border-radius: 50%; width: 20px; height: 20px; 
            animation: spin 1s linear infinite; display: inline-block; 
            vertical-align: middle; margin-right: 8px; 
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-50 rounded-full filter blur-3xl opacity-70 z-0 pointer-events-none"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-50 rounded-full filter blur-3xl opacity-70 z-0 pointer-events-none"></div>

        <div class="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden" id="main-card">
          <div class="p-8 sm:p-12">
            
            <div class="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm">
              <svg class="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2 tracking-tight">Set New Password</h2>
            <p class="text-sm text-gray-500 text-center mb-8 leading-relaxed">Your new password must be different from previously used passwords.</p>

            <form id="resetForm" onsubmit="submitForm(event)" class="space-y-5">
              
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input type="password" id="password" class="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-brand-500 transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium" placeholder="New Password" required minlength="6" />
              </div>

              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <input type="password" id="confirmPassword" class="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-brand-500 transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium" placeholder="Confirm Password" required minlength="6"/>
              </div>

              <div id="error-box" class="hidden p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 text-center transition-all"></div>

              <button type="submit" id="submitBtn" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md shadow-brand-500/30 mt-2">
                <span id="btnText">Reset Password</span>
                <span id="btnLoader" class="hidden"><div class="loader"></div> Updating...</span>
              </button>
            </form>
          </div>
        </div>

        <script>
          function submitForm(e) {
            e.preventDefault();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const errorBox = document.getElementById("error-box");
            const submitBtn = document.getElementById("submitBtn");
            const btnText = document.getElementById("btnText");
            const btnLoader = document.getElementById("btnLoader");

            errorBox.classList.add("hidden");

            if (password !== confirmPassword) {
              showError("Passwords do not match");
              return;
            }

            // Trigger Loading State
            btnText.classList.add("hidden");
            btnLoader.classList.remove("hidden");
            submitBtn.disabled = true;
            submitBtn.classList.add("opacity-70", "cursor-not-allowed");

            fetch("/api/auth/reset-password/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: "${token}",
                newPassword: password
              })
            })
            .then(async res => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Something went wrong");
              return data;
            })
            .then(data => {
              // Replace form with beautiful Success UI
              document.getElementById("main-card").innerHTML = \`
                <div class="p-8 sm:p-12 flex flex-col items-center text-center">
                  <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-200">
                    <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Password Updated!</h2>
                  <p class="text-gray-500 mb-8 font-medium">\${data.message}</p>
                  <a href="${FRONTEND_LOGIN_URL}" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-md inline-block">
                    Return to Login
                  </a>
                </div>
              \`;
            })
            .catch((err) => {
              showError(err.message);
              // Revert Loading State
              btnText.classList.remove("hidden");
              btnLoader.classList.add("hidden");
              submitBtn.disabled = false;
              submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
            });
          }

          function showError(msg) {
            const errorBox = document.getElementById("error-box");
            errorBox.textContent = msg;
            errorBox.classList.remove("hidden");
          }
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
          <p class="text-gray-500 mb-6">This password reset link is invalid or has expired.</p>
          <a href="${process.env.FRONTEND_LOGIN_URL || '/login'}" class="text-[#FF651D] font-bold hover:underline">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  }
};



exports.confirmResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const decoded = verifyToken(token);

    if (decoded.data.purpose !== "RESET_PASSWORD") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { Email: decoded.data.email },
      data: { PasswordHash: hashedPassword }
    });

    await publishEvent("PASSWORD_RESET_SUCCESS", {
      email: decoded.data.email
    });

    res.status(200).json({
      message: "Password reset successful. You can now login."
    });

  } catch (err) {
    console.error(" RESET CONFIRM ERROR:", err);
    res.status(400).json({ message: "Reset link expired or invalid" });
  }
};