// backend/auth-service/src/controller/authController.js

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const bcrypt = require("bcryptjs");
        const { prisma } = require("database");
        const { generateToken, generateVerificationToken, verifyToken } = require("../utils/jwt");
        const { publishEvent } = require("../kafka/producer");

        const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";
        const LOGIN_URL = `${FRONTEND_URL.replace(/\/$/, "")}/login`;



        exports.initiateRegistration = async (req, res) => {
          try {
            const { name, email, password, role } = req.body;

            
            if (!email || !password || !name ) {
              return res.status(400).json({ message: "All fields are required" });
            }

            
            const existingUser = await prisma.user.findFirst({
              where: {
                OR: [{ Email: email }]
              }
            });

            if (existingUser) {
              return res.status(409).json({ message: "User with this Email" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const tempUserData = {
              name,
              email,
              passwordHash: hashedPassword,
              role: role || "User"
            };

            const verificationToken = generateVerificationToken(tempUserData);

            await publishEvent("USER_REGISTRATION_INITIATED", {
              email,
              name,
              verificationLink: `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`
            });

            console.log(`Registration initiated for ${email}. Waiting for verification.`);

            res.status(200).json({
              message: "Verification email sent. Please check your inbox to complete registration."
            });

          } catch (err) {
            console.error(" INIT REG ERROR:", err);
            res.status(500).json({ error: "Internal server error" });
          }
        };


exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query; 

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return res.status(400).json({ message: "Invalid or Expired Token" });
    }

    const userData = decoded.data;

    const existingUser = await prisma.user.findUnique({ where: { Email: userData.email } });
    if (existingUser) {
      return res.status(200).json({ message: "User already verified. Please login." });
    }

    const newUser = await prisma.user.create({
      data: {
        Name: userData.name,
        Email: userData.email,
        Phone: userData.phone,
        PasswordHash: userData.passwordHash,
        Role: userData.role,
        WalletBalance: 0,
        IsActive: true 
      }
    });

    await publishEvent("USER_REGISTERED_SUCCESS", {
      userId: newUser.UserID,
      email: newUser.Email,
      role: newUser.Role,
      name: newUser.Name,
      isNewUser: true 
    });

    console.log(` User ${newUser.Email} verified and created in DB.`);

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";

    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - BiteGo</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: { sans: ['Inter', 'sans-serif'] },
                colors: { brand: { 50: '#FFF0E6', 500: '#FF651D', 600: '#D84A00' } }
              }
            }
          }
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { background-color: #f9fafb; }
        </style>
      </head>
      <body class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-50 rounded-full filter blur-3xl opacity-70 z-0 pointer-events-none"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-50 rounded-full filter blur-3xl opacity-70 z-0 pointer-events-none"></div>

        <div class="relative z-10 max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
          
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-200">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Email Verified!</h2>
          <p class="text-base text-gray-500 mb-8 leading-relaxed">
            Welcome to BiteGo, <strong class="text-gray-700">${newUser.Name}</strong>!<br> Your account has been successfully created.
          </p>

          <a href="${FRONTEND_URL}/login" class="w-full inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-md">
            Continue to Login
          </a>
          
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";

    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Failed</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = { theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'] }, colors: { brand: { 500: '#FF651D' } } } } }
        </script>
      </head>
      <body class="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p class="text-gray-500 mb-6">We couldn't verify your email. The link may have expired or is invalid.</p>
          
          <a href="${FRONTEND_URL}/register" class="text-brand-500 font-bold hover:underline">Try signing up again</a>
          
        </div>
      </body>
      </html>
    `);
  }
};



        exports.login = async (req, res) => {
          try {
            const { email, password } = req.body;

            if (!email || !password) {
              return res.status(400).json({ message: "Email and password required" });
            }

            const user = await prisma.user.findUnique({
              where: { Email: email }
            });

            if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
              return res.status(401).json({ message: "Invalid credentials" });
            }

            res.json({
              message: "Login successful",
              token: generateToken(user),
              user: { id: user.UserID, email: user.Email,name: user.Name, role: user.Role }
            });

          } catch (err) {
            console.error("❌ LOGIN ERROR:", err);
            res.status(500).json({ error: "Internal server error" });
          }
        };



// exports.googleLogin = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     if (!idToken) {
//       return res.status(400).json({ message: "Google ID token required" });
//     }

//     // 🔐 VERIFY WITH GOOGLE
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();

//     const {
//       email,
//       name,
//       picture,
//       sub: googleId,
//       email_verified,
//     } = payload;

//     if (!email_verified) {
//       return res.status(401).json({ message: "Google email not verified" });
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       const existingUser = await tx.user.findUnique({
//         where: { Email: email },
//       });

//       if (!existingUser) {
//         // 🆕 NEW USER
//         const newUser = await tx.user.create({
//           data: {
//             Email: email,
//             Name: name || "Google User",
//             PasswordHash: "OAUTH_USER",
//             Phone: null,
//             Role: "User",
//             ProfilePicURL: picture || "",
//             IsActive: true,
//             WalletBalance: 0,
//             GoogleId: googleId, // ✅ strongly recommended
//           },
//         });

//         await publishEvent("USER_REGISTERED_SUCCESS", {
//           userId: newUser.UserID,
//           email: newUser.Email,
//           name: newUser.Name,
//           role: newUser.Role,
//           isNewUser: true,
//         });

//         return { user: newUser, isNew: true };
//       }

//       // 🔁 EXISTING USER
//       const updatedUser = await tx.user.update({
//         where: { Email: email },
//         data: {
//           Name: name || existingUser.Name,
//           ProfilePicURL: picture || existingUser.ProfilePicURL,
//         },
//       });

//       return { user: updatedUser, isNew: false };
//     });

//     const token = generateToken(result.user);

//     res.status(200).json({
//       message: result.isNew ? "Registration successful" : "Login successful",
//       token,
//       user: {
//         id: result.user.UserID,
//         email: result.user.Email,
//         name: result.user.Name,
//         role: result.user.Role,
//       },
//     });
//   } catch (err) {
//     console.error("❌ GOOGLE LOGIN ERROR:", err);
//     res.status(500).json({ error: "Google authentication failed" });
//   }
// };

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token required" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      email,
      name,
      picture,
      sub: googleId,
      email_verified,
    } = payload;

    console.log("GOOGLE PAYLOAD:", payload);

    if (!email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }

    
    let user = await prisma.user.findUnique({
      where: { Email: email },
    });

    let isNew = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          Email: email,
          Name: name || "Google User",
          PasswordHash: "OAUTH_USER",
          Phone: null,
          Role: "User",
          ProfilePicURL: picture || "",
          IsActive: true,
          WalletBalance: 0,
          // GoogleId: googleId,
        },
      });
      isNew = true;
    } else {
      user = await prisma.user.update({
        where: { Email: email },
        data: {
          Name: name || user.Name,
          ProfilePicURL: picture || user.ProfilePicURL,
        },
      });
    }


    if (isNew) {
      try {
        await publishEvent("USER_REGISTERED_SUCCESS", {
          userId: user.UserID,
          email: user.Email,
          name: user.Name,
          role: user.Role,
          isNewUser: true,
        });
      } catch (eventError) {
        console.error("⚠️ Failed to publish registration event:", eventError);
      }
    }

    const token = generateToken(user);

    res.status(200).json({
      message: isNew ? "Registration successful" : "Login successful",
      token,
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.Name,
        role: user.Role,
      },
    });
  } catch (err) {
    console.error("❌ GOOGLE LOGIN ERROR:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
};