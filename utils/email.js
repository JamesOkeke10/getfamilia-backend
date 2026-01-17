const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSubmissionEmail({ name, email, inquiryType, links, message }) {
  // 1️⃣ ADMIN NOTIFICATION (THIS IS WHAT YOU'RE MISSING)
  await resend.emails.send({
    from: process.env.FROM_EMAIL, // Get Familia <no-reply@getfamilia.ca>
    to: [process.env.NOTIFY_EMAIL], // info@getfamilia.ca
    subject: `New Contact Submission – ${inquiryType}`,
    replyTo: email, // so you can reply directly to the sender
    html: `
      <h2>New Contact Form Submission</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Inquiry Type:</strong> ${inquiryType}</p>

      ${links ? `<p><strong>Links:</strong><br>${links}</p>` : ""}

      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br />")}</p>
    `,
  });

  // 2️⃣ AUTO-REPLY TO USER
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: [email],
    subject: "Thanks for reaching out to Get Familia 🎶",
    html: `
      <p>Hi ${name},</p>

      <p>Thanks for reaching out to <strong>Get Familia</strong>.</p>

      <p>We’ve received your message and will review it shortly.  
      If it’s a strong fit, we’ll get back to you to continue the conversation.</p>

      <p>— Get Familia Team</p>
    `,
  });
}

module.exports = { sendSubmissionEmail };
