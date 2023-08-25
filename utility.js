const nodemailer = require('nodemailer');

const sendEmailNotification = (emails, emailBody) => {
  
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'interactiveaqmap@gmail.com',
        pass: 'ocgshlfqxafmwtkg'
      },
      host: 'smtp.gmail.com'
    });
  
    const mailOptions = {
      from: 'interactiveaqmap@gmail.com',
      to: emails,
      subject: 'Air Quality Alert',
      text: emailBody
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    
  };

  module.exports = { sendEmailNotification };
  

