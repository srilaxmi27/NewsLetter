const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────
// EmailService — sends HTML emails via SMTP
// Configure SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in .env
// ─────────────────────────────────────────────

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not set — emails will not be sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

// ─────────────────────────────────────────────
// Send newsletter publication email
// recipients: [{ name, email }]
// newsletter: { month, year, department_name }
// pdfUrl: full URL to the PDF (e.g. http://localhost:5000/uploads/xxx.pdf)
// ─────────────────────────────────────────────
const sendNewsletterEmail = async (recipients, newsletter, pdfUrl) => {
  const t = getTransporter();
  if (!t) return; // graceful no-op if SMTP not configured

  const subject = `📰 ${newsletter.department_name} Newsletter — ${newsletter.month} ${newsletter.year}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- HEADER BAND -->
          <tr>
            <td style="background:#1c1917;padding:40px 48px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;
                               letter-spacing:3px;text-transform:uppercase;">Department newsletter system</p>
                    <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
                      ${newsletter.department_name}
                    </h1>
                    <p style="margin:6px 0 0;font-size:16px;color:rgba(255,255,255,0.5);font-weight:400;">
                      ${newsletter.month} ${newsletter.year} &middot; Newsletter
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background:rgba(124,58,237,0.25);border-radius:12px;padding:10px 14px;display:inline-block;">
                      <span style="font-size:24px;">📰</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#7c3aed 0%,#a78bfa 100%);"></td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 8px;font-size:15px;color:#44403c;line-height:1.7;">
                The <strong>${newsletter.month} ${newsletter.year}</strong> edition of the
                <strong>${newsletter.department_name} Department Newsletter</strong> has just been published.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#78716c;line-height:1.7;">
                It features the latest achievements, placements, research publications, and department
                highlights from our students and faculty.
              </p>

              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
                    <a href="${pdfUrl}"
                       style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      View Newsletter PDF →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- DIVIDER -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                <tr><td style="height:1px;background:#e7e5e4;"></td></tr>
              </table>

              <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;">
                You received this email because you are a member of the
                <strong style="color:#78716c;">${newsletter.department_name} Department</strong>
                on the NewsFlow platform. This is an automated notification.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#fafaf9;border-top:1px solid #e7e5e4;padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#d6d3d1;">
                NewsFlow &middot; VNR VJIET &middot; ${newsletter.department_name}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const fromName = process.env.EMAIL_FROM || `AIML NewsFlow <${process.env.SMTP_USER}>`;

  // Send in batches to avoid overwhelming SMTP
  const errors = [];
  for (const recipient of recipients) {
    try {
      await t.sendMail({
        from:    fromName,
        to:      `${recipient.name} <${recipient.email}>`,
        subject,
        html,
      });
    } catch (err) {
      // Log but don't abort — other recipients should still get the email
      console.error(`[Email] Failed to send to ${recipient.email}:`, err.message);
      errors.push(recipient.email);
    }
  }

  if (errors.length > 0) {
    console.warn(`[Email] Failed to send to ${errors.length} recipient(s):`, errors.join(', '));
  } else {
    console.log(`[Email] Newsletter sent to ${recipients.length} recipient(s)`);
  }
};

module.exports = { sendNewsletterEmail };
