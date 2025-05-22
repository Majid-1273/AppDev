// const nodemailer = require("nodemailer");
// const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json"); // Path to your Firebase Admin SDK key

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// async function main() {
//   const userEmail = "sania@gmail.com"; // <-- Email in Firebase Auth
//   const newPassword = "hello"; // <-- New password to set

//   try {
//     // Get user by email
//     const user = await admin.auth().getUserByEmail(userEmail);

//     // Update password in Firebase Auth
//     await admin.auth().updateUser(user.uid, {
//       password: newPassword,
//     });

//     console.log(`✅ Password reset for: ${userEmail}`);

//     // Create test email account (Ethereal)
//     let testAccount = await nodemailer.createTestAccount();

//     // Create a transporter using Ethereal SMTP
//     let transporter = nodemailer.createTransport({
//       host: "smtp.ethereal.email",
//       port: 587,
//       auth: {
//         user: testAccount.user,
//         pass: testAccount.pass,
//       },
//     });

//     // Send email with the new password
//     let info = await transporter.sendMail({
//       from: '"Smart Farm Log" <no-reply@smartfarm.com>',
//       to: userEmail,
//       subject: "Your Smart Farm Log Password Has Been Reset",
//       text: `Hello,\n\nYour password has been reset. Your new temporary password is: ${newPassword}\n\nPlease log in and change your password as soon as possible.\n\nThanks,\nSmart Farm Log Team`,
//     });

//     console.log("📬 Email sent. Preview it here:");
//     console.log(nodemailer.getTestMessageUrl(info));

//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   }
// }

// main();
