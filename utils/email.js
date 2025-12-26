const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendSubmissionEmail({ name, email, inquiryType, links, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeInquiry = escapeHtml(inquiryType);
  const safeLinks = escapeHtml(links);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br/>");

  // 1) Email to you (admin notification)
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: process.env.NOTIFY_EMAIL,
    subject: `New Get Familia Submission: ${name} (${inquiryType})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin:0 0 12px;">New Submission Received</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Inquiry Type:</strong> ${safeInquiry}</p>
        <p><strong>Links:</strong> ${safeLinks || "N/A"}</p>
        <p><strong>Message:</strong><br/>${safeMessage}</p>
        <hr/>
        <p style="color:#666; font-size: 12px;">Sent from GetFamilia backend.</p>
      </div>
    `,
  });

  // 2) Auto-reply to the person (recommended)
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "We received your message — Get Familia",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hi ${safeName},</p>
        <p>Thanks for reaching out to <strong>Get Familia</strong>. We’ve received your message and will review it shortly.</p>
        <p><strong>What you sent:</strong><br/>${safeMessage}</p>
        <p style="margin-top:16px;">If you added links, we’ll check them and get back to you as soon as possible.</p>
        <p style="margin-top:16px;">— Get Familia Team</p>
        <p style="color:#666; font-size: 12px;">This is an automated confirmation.</p>
      </div>
    `,
  });
}

module.exports = { sendSubmissionEmail };
