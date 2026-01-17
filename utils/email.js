const { Resend } = require("resend");

const resendKey = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Get Familia <onboarding@resend.dev>";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

if (!resendKey) {
  console.warn("RESEND_API_KEY is missing. Emails will not send.");
}
if (!NOTIFY_EMAIL) {
  console.warn("NOTIFY_EMAIL is missing. Admin notifications will not send.");
}

const resend = resendKey ? new Resend(resendKey) : null;

// Simple HTML escaping
function esc(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

async function sendSubmissionEmail({ name, email, inquiryType, links, message }) {
  if (!resend) throw new Error("Resend is not configured (missing RESEND_API_KEY).");
  if (!NOTIFY_EMAIL) throw new Error("Missing NOTIFY_EMAIL env var.");

  // 1) Admin notification
  const adminSubject = `New Contact Submission (${inquiryType}) — ${name}`;
  const adminHtml = `
    <h2>New Contact Submission</h2>
    <p><b>Name:</b> ${esc(name)}</p>
    <p><b>Email:</b> ${esc(email)}</p>
    <p><b>Inquiry Type:</b> ${esc(inquiryType)}</p>
    <p><b>Links:</b> ${esc(links || "-")}</p>
    <p><b>Message:</b><br/>${esc(message).replace(/\n/g, "<br/>")}</p>
  `;

  const notify = await resend.emails.send({
    from: FROM_EMAIL,
    to: [NOTIFY_EMAIL],
    replyTo: email, // IMPORTANT: lets you reply directly to the user
    subject: adminSubject,
    html: adminHtml,
  });

  // 2) Auto-reply to user
  const userSubject = "We received your message — Get Familia";
  const userHtml = `
    <p>Hi ${esc(name)},</p>
    <p>Thanks for reaching out to <b>Get Familia</b>. We received your message and we’ll get back to you soon.</p>
    <p><b>Your inquiry:</b> ${esc(inquiryType)}</p>
    <p><b>Your message:</b><br/>${esc(message).replace(/\n/g, "<br/>")}</p>
    <p>— Get Familia Team</p>
  `;

  const autoReply = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: userSubject,
    html: userHtml,
  });

  return {
    notifyId: notify?.data?.id,
    autoReplyId: autoReply?.data?.id,
  };
}

module.exports = { sendSubmissionEmail };
