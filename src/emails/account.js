const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'borns2shred92@gmail.com',
    subject: 'Thanks for joining to our services!',
    text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    // html: 'for the email template'
  })
}

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'borns2shred92@gmail.com',
    subject: 'Cancellation verification',
    text: `Goodbye ${name}, sorry to see you go. Is there anything we could have done to kept you onboard? Anyway, we hope to see you back sometime soon.`
    // html: 'for the email template'
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}