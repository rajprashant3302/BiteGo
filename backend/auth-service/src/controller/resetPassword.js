const bcrypt = require("bcrypt");
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
      verificationLink: `http://localhost:5000/api/auth/reset-password?token=${resetToken}`
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

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reset Password</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; }
          .box { width: 350px; margin: 100px auto; padding: 20px; background: #fff; border-radius: 5px; }
          input { width: 100%; padding: 10px; margin: 8px 0; }
          button { width: 100%; padding: 10px; background: #28a745; color: white; border: none; cursor: pointer; }
          .error { color: red; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="box">
          <h3>Reset Password</h3>

          <input type="password" id="password" placeholder="New Password" required />
          <input type="password" id="confirmPassword" placeholder="Confirm Password" required />

          <p id="error" class="error"></p>

          <button onclick="submitForm()">Reset Password</button>
        </div>

        <script>
          function submitForm() {
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const error = document.getElementById("error");

            if (!password || !confirmPassword) {
              error.textContent = "Both fields are required";
              return;
            }

            if (password !== confirmPassword) {
              error.textContent = "Passwords do not match";
              return;
            }

            fetch("/api/auth/reset-password/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: "${token}",
                newPassword: password
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data.message) {
                document.querySelector(".box").innerHTML = \`
                  <h3 style="color: green;">Password Reset Successful 🎉</h3>
                  <p>\${data.message}</p>
                  <a href="${LOGIN_URL}"
                     style="
                       display: inline-block;
                       margin-top: 15px;
                       padding: 10px 15px;
                       background: #007bff;
                       color: #fff;
                       text-decoration: none;
                       border-radius: 4px;
                     ">
                     Return to Login
                  </a>
                \`;
              }
            })
            .catch(() => {
              error.textContent = "Something went wrong";
            });
          }
        </script>
      </body>
      </html>
    `);

  } catch {
    res.status(400).send("Reset link expired or invalid");
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
