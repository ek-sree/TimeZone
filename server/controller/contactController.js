const nodemailer = require("nodemailer");
const { Email, pass } = require("../../.env");

console.log(Email);
const contactSend = async (req, res) => {
  const { name, emails, subject, message } = req.body;
  console.log("Received request:", { name, emails, subject, message });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: Email,
      pass: pass,
    },
  });

  const mailOptions = {
    from: emails,
    to: Email,
    subject: subject,
    text: `Name: ${name}\nmessage: ${message}\n email: ${emails}`,
    name: name,
  };
  console.log("yeaaa", mailOptions);
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Error sending email:", err);
      res.status(500).json({ success: false, message: "Error occurred" });
    } else {
      console.log("Email sent successfully:", info);
      res
        .status(200)
        .json({ success: true, message: "Email sent successfully" });
    }
  });
};

module.exports = { contactSend };
