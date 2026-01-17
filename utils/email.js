const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSubmissionEmail({ name, email, inquiryType, links, message }) {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  if (!process.env.FROM_EMAIL) throw new Error("Missing FROM_EMAIL");
  if (!process.env.NOTIFY_EMAIL) throw new Error("Missing NOTIFY_EMAIL");

  const from = process.env.FROM_EMAIL;
  const notifyTo = process.env.NOTIFY_EMAIL;

  // 1️⃣ Admin notification
  await resend.emails.send({
    from,
    to: notifyTo,
    subject: `New Contact Submission — ${inquiryType}`,
    replyTo: email,
    text: `
New submission received:

Name: ${name}
Email: ${email}
Inquiry Type: ${inquiryType}
Links: ${links || "None"}

Message:
${message}
    `.trim(),
  });

  // 2️⃣ Auto-reply to user
  await resend.emails.send({
    from,
    to: email,
    subject: "We received your message — Get Familia",
    text: `
Hi ${name},

Thanks for reaching out to Get Familia 🎶

We’ve received your message and our team will review it shortly.
If it’s a strong fit, we’ll get back to you soon.

Best regards,
Get Familia Team
    `.trim(),
  });
}

module.exports = { sendSubmissionEmail };
