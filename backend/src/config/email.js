// config/email.js
const nodemailer = require("nodemailer");

// =========================
// KIỂM TRA ENV
// =========================
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn(
    "⚠️ Thiếu EMAIL_USER hoặc EMAIL_PASS trong file .env. Chức năng gửi email có thể lỗi.",
  );
}

// =========================
// LINK FRONTEND
// =========================
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// =========================
// CẤU HÌNH GỬI EMAIL
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =========================
// GỬI EMAIL XÁC THỰC TÀI KHOẢN
// =========================
async function sendVerificationEmail(email, token) {
  try {
    const verifyLink = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
      token,
    )}`;

    await transporter.sendMail({
      from: `"English Vocabulary" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Xác nhận đăng ký tài khoản",
      text: `
Xác nhận tài khoản English Vocabulary

Cảm ơn bạn đã đăng ký tài khoản.

Vui lòng mở link sau để xác nhận email:
${verifyLink}

Link này sẽ hết hạn sau 15 phút.
      `,
      html: `
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

    await transporter.sendMail({
      from: `"English Vocabulary" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Đặt lại mật khẩu",
      text: `
Đặt lại mật khẩu English Vocabulary

Bạn đã yêu cầu đặt lại mật khẩu.

Vui lòng mở link sau để tạo mật khẩu mới:
${resetLink}

Link này sẽ hết hạn sau 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      `,
      html: `
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
