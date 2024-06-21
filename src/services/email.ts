import nodemailer from "nodemailer";

export const EmailSend = async ( email: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'redebrasilrp@gmail.com',
        pass: 'qhwp rkii sses ezwm',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const emailContent = email;

    const emailOptions = {
      from: 'redebrasilrp@gmail.com',
      to: 'redebrasilrp@gmail.com',
      subject: `Inconsistencias No CSV`,
      html: emailContent,
    };

    const emailResult = await transporter.sendMail(emailOptions); // Adicione "await" aqui

    // console.log(emailResult);
    return emailResult;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error;
  }
};