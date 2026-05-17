// config/email.js

if (!process.env.BREVO_API_KEY) {
  console.warn("⚠️ Thiếu BREVO_API_KEY trong biến môi trường.");
}

if (!process.env.EMAIL_FROM) {
  console.warn("⚠️ Thiếu EMAIL_FROM trong biến môi trường.");
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendBrevoEmail({ to, subject, textContent, htmlContent }) {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || "English Vocabulary",
        email: process.env.EMAIL_FROM,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      textContent,
      htmlContent,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Brevo API error ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  return data;
}

// =========================
// GỬI EMAIL XÁC THỰC TÀI KHOẢN
// =========================
async function sendVerificationEmail(email, token) {
  try {
    const verifyLink = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
      token,
    )}`;

    await sendBrevoEmail({
      to: email,
      subject: "Xác nhận đăng ký tài khoản",
      textContent: `
Xác nhận tài khoản English Vocabulary

Cảm ơn bạn đã đăng ký tài khoản.

Vui lòng mở link sau để xác nhận email:
${verifyLink}

Link này sẽ hết hạn sau 15 phút.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Xác nhận tài khoản</h2>

          <p>Cảm ơn bạn đã đăng ký tài khoản <strong>English Vocabulary</strong>.</p>

          <p>Vui lòng bấm vào nút bên dưới để xác nhận email:</p>

          <p>
            <a 
              href="${verifyLink}"
              style="
                display: inline-block;
                padding: 10px 16px;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
              "
            >
              Xác nhận email
            </a>
          </p>

          <p>Nếu nút không hoạt động, hãy copy link bên dưới và dán vào trình duyệt:</p>

          <p>
            <a href="${verifyLink}">${verifyLink}</a>
          </p>

          <p>Link này sẽ hết hạn sau <strong>15 phút</strong>.</p>

          <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });

    console.log(`✅ Đã gửi email xác thực tới: ${email}`);
  } catch (error) {
    console.error("❌ Lỗi gửi email xác thực:", error.message);
    throw error;
  }
}

// =========================
// GỬI EMAIL ĐẶT LẠI MẬT KHẨU
// =========================
async function sendResetPasswordEmail(email, token) {
  try {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

    await sendBrevoEmail({
      to: email,
      subject: "Đặt lại mật khẩu",
      textContent: `
Đặt lại mật khẩu English Vocabulary

Bạn đã yêu cầu đặt lại mật khẩu.

Vui lòng mở link sau để tạo mật khẩu mới:
${resetLink}

Link này sẽ hết hạn sau 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Đặt lại mật khẩu</h2>

          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>English Vocabulary</strong>.</p>

          <p>Bấm vào nút bên dưới để tạo mật khẩu mới:</p>

          <p>
            <a 
              href="${resetLink}"
              style="
                display: inline-block;
                padding: 10px 16px;
                background-color: #dc2626;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
              "
            >
              Đặt lại mật khẩu
            </a>
          </p>

          <p>Nếu nút không hoạt động, hãy copy link bên dưới và dán vào trình duyệt:</p>

          <p>
            <a href="${resetLink}">${resetLink}</a>
          </p>

          <p>Link này sẽ hết hạn sau <strong>15 phút</strong>.</p>

          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });

    console.log(`✅ Đã gửi email đặt lại mật khẩu tới: ${email}`);
  } catch (error) {
    console.error("❌ Lỗi gửi email đặt lại mật khẩu:", error.message);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
