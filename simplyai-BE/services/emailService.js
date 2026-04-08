import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ FIX: APP_URL ab .env ke FRONTEND_URL se aata hai
// Agar FRONTEND_URL change ho (localhost -> production domain) tu email links automatically update ho jayenge
const APP_URL = process.env.FRONTEND_URL || process.env.BACKEND_URL || "http://localhost:4000";

// Create transporter with Gmail SMTP (priority) or Brevo as fallback
let transporter;
let emailEnabled = false;
let emailProvider = "";

try {
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
    });
    emailProvider = "Gmail";
    console.log("✅ Gmail SMTP transporter initialized");
    emailEnabled = true;
  } else if (process.env.BREVO_EMAIL && process.env.BREVO_API_KEY) {
    transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com", port: 587, secure: false,
      auth: { user: process.env.BREVO_EMAIL, pass: process.env.BREVO_API_KEY },
    });
    emailProvider = "Brevo";
    console.log("✅ Brevo SMTP transporter initialized (fallback)");
    emailEnabled = true;
  } else {
    console.log("⚠️ No email credentials found, using console logging");
    emailEnabled = false;
  }
} catch (error) {
  console.log("❌ Failed to initialize email transporter:", error.message);
  emailEnabled = false;
}

// --- Helper Function ---
const sendMailOrLog = async (mailOptions, logTitle) => {
  if (!emailEnabled) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 ${logTitle} (Inviata a: ${mailOptions.to})`);
    console.log(`Soggetto: ${mailOptions.subject}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return { success: true, messageId: "simulated-" + Date.now() };
  }
  try {
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Errore invio email (${logTitle}):`, error.message);
    return { success: false, error: error.message };
  }
};

// 1. Password Reset Email
export async function sendResetPasswordEmail(to, resetUrl) {
  return sendMailOrLog({
    from: process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL,
    to, subject: "Reset della password",
    html: `<p>Clicca <a href="${resetUrl}">qui</a> per resettare la tua password. Il link scadrà in 1 ora.</p>`,
  }, "PASSWORD RESET EMAIL");
}

// 2. Admin Notification Email (Nuovo Utente)
export const sendAdminNewUserNotification = async (adminEmail, newUser) => {
  return sendMailOrLog({
    from: `"SimolyAI System" <${process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL}>`,
    to: adminEmail, subject: `Nuova Registrazione: ${newUser.firstName} ${newUser.lastName}`,
    html: `<h2>Nuovo Utente Registrato 🎉</h2><p>Nome: ${newUser.firstName} ${newUser.lastName}</p><p>Email: ${newUser.email}</p>`,
  }, "ADMIN NOTIFICATION EMAIL");
};

// 3. Welcome/Payment Email
export const sendPaymentNotificationEmail = async (data, paymentInfo = null, planInfo = null) => {
  let userInfo = data.email ? data : data;
  let planData = planInfo || { name: data.planName || "Piano Gratuito" };
  
  return sendMailOrLog({
    from: `"SimolyAI" <${process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL}>`,
    to: userInfo.email, subject: `🎉 Benvenuto in SimolyAI - ${planData.name}!`,
    html: `<h2>Benvenuto in SimolyAI!</h2>
           <p>Ciao ${userInfo.firstName}, la tua registrazione è confermata.</p>
           <a href="${APP_URL}/dashboard" style="display:inline-block; background:#667eea; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; margin-top:10px;">Accedi alla Dashboard</a>`,
  }, "WELCOME EMAIL");
};

// 4. Email Completamento Questionario
export const sendQuestionnaireCompletionEmail = async (email, firstName, questionnaireTitle) => {
  return sendMailOrLog({
    from: `"SimolyAI" <${process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL}>`,
    to: email, subject: `Hai completato: ${questionnaireTitle}`,
    html: `<h2>Questionario Completato! ✅</h2>
           <p>Ciao ${firstName}, hai completato con successo: <strong>${questionnaireTitle}</strong>.</p>
           <p>Stiamo elaborando il tuo report.</p>
           <a href="${APP_URL}/dashboard" style="display:inline-block; background:#667eea; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; margin-top:10px;">Vai alla Dashboard</a>`,
  }, "QUESTIONNAIRE COMPLETION EMAIL");
};

// 5. Email Report Disponibile
export const sendReportAvailableEmail = async (email, firstName, reportTitle, reportId) => {
  const reportUrl = `${APP_URL}/report/${reportId}`;
  return sendMailOrLog({
    from: `"SimolyAI" <${process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL}>`,
    to: email, subject: `Il tuo report "${reportTitle}" è pronto!`,
    html: `<h2>Il tuo Report è Pronto! 📊</h2>
           <p>Ciao ${firstName}, il report è pronto.</p>
           <a href="${reportUrl}" style="display:inline-block; background:#667eea; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; margin-top:10px;">Visualizza Report</a>`,
  }, "REPORT AVAILABLE EMAIL");
};

// 6. Deadline Reminder Email
export const sendDeadlineReminderEmail = async ({ email, firstName, fullName, planName, totalQuestionnaires, completedQuestionnaires, remainingQuestionnaires }) => {
  const userName = firstName || fullName || "Utente";
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Promemoria Piano ⏰</h2>
      <p>Ciao <strong>${userName}</strong>,</p>
      <p>Questo è un promemoria per il tuo piano <strong>${planName}</strong>.</p>
      <p>Hai completato ${completedQuestionnaires} su ${totalQuestionnaires} questionari.</p>
      <p>Ti mancano ${remainingQuestionnaires} questionari. Vai sulla dashboard per completarli.</p>
      <a href="${APP_URL}/dashboard" style="display:inline-block; background:#667eea; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; margin-top:10px;">Vai alla Dashboard</a>
    </div>
  `;

  return sendMailOrLog({
    from: `"SimolyAI" <${process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL}>`,
    to: email,
    subject: `Promemoria: Completa il tuo piano ${planName}`,
    html: htmlTemplate,
  }, "DEADLINE REMINDER EMAIL");
};

// 7. Email di Verifica
export const sendVerificationEmail = async (email, firstName, token) => {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  return sendMailOrLog({
    from: `"SimolyAI" <${process.env.GMAIL_EMAIL || process.env.BREVO_EMAIL}>`,
    to: email, subject: "Conferma la tua email su SimolyAI",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verifica il tuo indirizzo email ✉️</h2>
        <p>Ciao ${firstName},</p>
        <p>Clicca sul pulsante qui sotto per verificare la tua email e attivare il tuo account:</p>
        <a href="${verifyUrl}" style="display:inline-block; background:#667eea; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; margin-top:10px;">Verifica Email</a>
      </div>
    `,
  }, "VERIFICATION EMAIL");
};

export default {
  sendResetPasswordEmail, 
  sendAdminNewUserNotification, 
  sendPaymentNotificationEmail,
  sendQuestionnaireCompletionEmail, 
  sendReportAvailableEmail,
  sendDeadlineReminderEmail,
  sendVerificationEmail
};