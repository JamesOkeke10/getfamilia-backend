const { Resend } = require("resend");

function requireEnv(name) {
  const val = process.env[name];
  if (!val || String(val).trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(val).trim();
}

function normalizeEmail(s) {
  return String(s || "").trim().toLowerCase();
}

async function sendSubmissionEmail({ name, email, inquiryType, links, message }) {
  const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
  const FROM_EMAIL = requireEnv("FROM_EMAIL");     // e.g. "Get Familia <onboarding@resend.dev>"
  const NOTIFY_EMAIL = requireEnv("NOTIFY_EMAIL"); // e.g. "info@getfamilia.ca"

  const resend = new Resend(RESEND_API_KEY);

  const safeName = String(name || "").trim();
  const userEmail = normalizeEmail(email);
  const safeInquiry = String(inquiryType || "").trim();
  const safeLinks = String(links || "").trim();
  const safeMsg = String(message || "").trim();

  // 1) Notify you (admin)
  const notifySubject = `New Contact Form: ${safeInquiry} — ${safeName}`;
  const notifyHtml = `
    <div style="font-family:Arial,sans-serif; line-height:1.5;">
      <h2>New submission received</h2>
      <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
      <p><strong>Inquiry Type:</strong> ${escapeHtml(safeInquiry)}</p>
      ${safeLinks ? `<p><strong>Links:</strong> ${escapeHtml(safeLinks)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px;">${escapeHtml(safeMsg)}</pre>
      <p style="color:#666;">Reply to this email to respond to the sender.</p>
    </div>
  `;

  const notifyResult = await resend.emails.send({
    from: FROM_EMAIL,
    to: [NOTIFY_EMAIL],
    reply_to: userEmail, // so you can reply directly to the sender
    subject: notifySubject,
    html: notifyHtml,
  });

  // If Resend returns an error, throw it so we can see it in logs
  if (notifyResult?.error) {
    throw new Error(`Resend notify error: ${JSON.stringify(notifyResult.error)}`);
  }

  // 2) Auto-reply to the user
  const autoSubject = "We received your message — Get Familia";
  const autoHtml = `
    <div style="font-family:Arial,sans-serif; line-height:1.5;">
      <p>Hi ${escapeHtml(safeName || "there")},</p>
      <p>Thanks for reaching out to <strong>Get Familia</strong>. We’ve received your message and will get back to you soon.</p>
      <p><strong>Your inquiry:</strong> ${escapeHtml(safeInquiry)}</p>
      <p style="margin-top:14px; color:#666;">If you need to add more info, just reply to this email.</p>
      <p style="margin-top:18px;">— Get Familia Team</p>
    </div>
  `;

  const autoResult = await resend.emails.send({
    from: FROM_EMAIL,
    to: [userEmail],
    subject: autoSubject,
    html: autoHtml,
  });

  if (autoResult?.error) {
    throw new Error(`Resend auto-reply error: ${JSON.stringify(autoResult.error)}`);
  }

  return {
    notifyId: notifyResult?.data?.id || null,
    autoReplyId: autoResult?.data?.id || null,
  };
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = { sendSubmissionEmail };
