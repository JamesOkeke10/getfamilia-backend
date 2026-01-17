const { Resend } = require("resend");

function requiredEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

// One Resend client for the whole app
const resend = new Resend(requiredEnv("RESEND_API_KEY"));

async function sendSubmissionEmails({ name, email, inquiryType, links, message }) {
  const from = requiredEnv("FROM_EMAIL");       // e.g. Get Familia <no-reply@getfamilia.ca>
  const notifyTo = requiredEnv("NOTIFY_EMAIL"); // e.g. info@getfamilia.ca

  // 1) ADMIN NOTIFICATION
  await resend.emails.send({
    from,
    to: notifyTo,
    subject: `New Contact Submission – ${inquiryType}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>New Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Inquiry Type:</strong> ${escapeHtml(inquiryType)}</p>
        <p><strong>Links:</strong> ${escapeHtml(links || "N/A")}</p>
        <p><strong>Message:</strong></p>
        <div style="padding:12px;border:1px solid #ddd;border-radius:8px;background:#fafafa;">
          ${escapeHtml(message).replace(/\n/g, "<br/>")}
        </div>
      </div>
    `,
  });

  // 2) AUTO-REPLY TO USER
  await resend.emails.send({
    from,
    to: email,
    subject: "We received your message – Get Familia",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hi ${escapeHtml(name)},</p>

        <p>Thank you for reaching out to <strong>Get Familia</strong>.</p>

        <p>
          We’ve received your message and our team will review it shortly.
          If it’s a strong fit, we’ll reach out to confirm next steps.
        </p>

        <p><strong>Your inquiry type:</strong> ${escapeHtml(inquiryType)}</p>

        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />

        <p style="margin:0;">
          Best regards,<br/>
          <strong>Get Familia Team</strong><br/>
          Toronto, Canada
        </p>

        <p style="color:#6b7280;font-size:12px;margin-top:16px;">
          This is an automated confirmation. Please do not reply to this email.
        </p>
      </div>
    `,
  });

  return true;
}

// Prevent HTML injection in emails
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { sendSubmissionEmails };
