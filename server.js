const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// Setup nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Endpoint to handle form submissions
app.post('/api/referrals', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Basic validation
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Save referral data to database
    const referral = await prisma.referral.create({
      data: { name, email, phone, message }
    });

    // Send referral email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Referral Received',
      text: `Thank you for your referral, ${name}! We have received your message: "${message}".`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send referral email.' });
      }
      res.status(201).json(referral);
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while saving the referral data.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
