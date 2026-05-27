// config/email.js

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "English Vocabulary";
const EMAIL_FROM = process.env.EMAIL_FROM;

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// =========================
// KIỂM TRA ENV
// =========================
if (!BREVO_API_KEY) {
  console.warn("⚠️ Thiếu BREVO_API_KEY trong biến môi trường.");
}

if (!EMAIL_FROM) {
  console.warn("⚠️ Thiếu EMAIL_FROM trong biến môi trường.");
}

// =========================
// HÀM GỬI EMAIL BẰNG BREVO API
// =========================
async function sendBrevoEmail({ to, subject, textContent, htmlContent }) {
  if (!BREVO_API_KEY) {
    throw new Error("Thiếu BREVO_API_KEY");
  }

  if (!EMAIL_FROM) {
    throw new Error("Thiếu EMAIL_FROM");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: EMAIL_FROM_NAME,
        email: EMAIL_FROM,
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

// =========================
// GỬI EMAIL NHẮC NHỞ HỌC SRS (CRON JOB)
// =========================
async function sendSrsReminderEmail(email, fullName, dueCount) {
  try {
    const studyLink = `${FRONTEND_URL}/study`; // Link dẫn tới trang học của bạn

    await sendBrevoEmail({
      to: email,
      subject: `⏳ Đến giờ ôn tập rồi! Bạn có ${dueCount} từ vựng cần ôn hôm nay`,
      textContent: `
Chào ${fullName},

Hôm nay bạn có ${dueCount} từ vựng đã đến hạn ôn tập trong hệ thống English Vocabulary.
Việc ôn tập đúng hạn sẽ giúp bạn nhớ từ vựng lâu hơn rất nhiều!

Hãy vào học ngay kẻo quên nhé:
${studyLink}
      `,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Đến giờ học rồi ${fullName} ơi! 🚀</h2>
          <p>Hôm nay thuật toán của chúng mình phát hiện ra bạn có <strong>${dueCount} từ vựng</strong> đã đến hạn cần ôn tập.</p>
          <p>Chỉ cần 5 phút mỗi ngày, việc ôn tập đúng lúc (Spaced Repetition) sẽ giúp từ vựng in sâu vào trí nhớ dài hạn của bạn.</p>
          <p>
            <a href="${studyLink}" style="display: inline-block; padding: 10px 16px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
              👉 Vào ôn tập ngay
            </a>
          </p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
            Nếu bạn không muốn nhận email nhắc nhở nữa, có thể tắt trong phần Cài đặt tài khoản.
          </p>
        </div>
      `,
    });

    console.log(`✅ Đã gửi email nhắc nhở SRS tới: ${email} (${dueCount} thẻ)`);
  } catch (error) {
    console.error(`❌ Lỗi gửi email nhắc nhở tới ${email}:`, error.message);
  }
}

const sendContactEmail = async (name, email, message) => {
  const subject = `Liên hệ từ ${name} (${email})`;
  const htmlContent = `<div style="font-family: Arial, sans-serif;">
    <h2>Thông tin liên hệ</h2>
    <p><strong>Họ tên:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Nội dung:</strong><br/>${message}</p>
  </div>`;
  const textContent = `Họ tên: ${name}\nEmail: ${email}\nNội dung: ${message}`;
  await sendBrevoEmail({
    to: process.env.EMAIL_FROM,
    subject,
    htmlContent,
    textContent
  });
};

// Đừng quên export hàm mới này ra nhé
module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendContactEmail,
  sendSrsReminderEmail // <--- THÊM VÀO ĐÂY
};