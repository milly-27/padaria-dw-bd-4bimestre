// backend/config/emailConfig.js - VERSÃO CORRIGIDA E SIMPLIFICADA
const nodemailer = require('nodemailer');

// ======================================
// CONFIGURAÇÃO DO TRANSPORTER
// ======================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'emillymainko@gmail.com',
    pass: process.env.EMAIL_PASS // SENHA DE APLICATIVO DO GMAIL
  },
  // Configurações extras para evitar erros
  tls: {
    rejectUnauthorized: false
  }
});

// ======================================
// VERIFICAR CONEXÃO
// ======================================
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Erro ao conectar com servidor de email:', error.message);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  ATENÇÃO: Email NÃO configurado corretamente!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Para ENVIAR EMAILS REAIS, siga os passos:');
    console.log('');
    console.log('1. Acesse: https://myaccount.google.com/security');
    console.log('2. Ative "Verificação em duas etapas"');
    console.log('3. Depois acesse: https://myaccount.google.com/apppasswords');
    console.log('4. Crie uma senha de app chamada "PARDARIA"');
    console.log('5. Copie a senha de 16 dígitos');
    console.log('6. Cole no arquivo .env:');
    console.log('   EMAIL_USER=emillymainko@gmail.com');
    console.log('   EMAIL_PASS=xxxx xxxx xxxx xxxx');
    console.log('7. Reinicie o servidor');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 Por enquanto, use o código que aparece no CONSOLE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } else {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SUCESSO: Servidor de email configurado!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 Emails serão enviados de:', process.env.EMAIL_USER);
    console.log('🎯 Códigos de recuperação chegarão no email do usuário');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }
});

// ======================================
// FUNÇÃO PARA ENVIAR EMAIL DE RECUPERAÇÃO
// ======================================
async function enviarEmailRecuperacao(destinatario, nome, codigo) {
  console.log('');
  console.log('📨 Preparando email...');
  console.log('   Para:', destinatario);
  console.log('   Nome:', nome);
  console.log('   Código:', codigo);
  
  const mailOptions = {
    from: {
      name: '🍞 PARDARIA - Padaria Artesanal',
      address: process.env.EMAIL_USER || 'noreply@pardaria.com'
    },
    to: destinatario,
    subject: '🔐 Código de Recuperação de Senha - PARDARIA',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #F8F4E3;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(145deg, #A0522D, #CD853F);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 42px;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          }
          .header p {
            font-size: 18px;
            opacity: 0.95;
            font-style: italic;
          }
          .content {
            padding: 40px 30px;
            color: #333;
          }
          .greeting {
            font-size: 24px;
            color: #A0522D;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
          }
          .code-box {
            background: linear-gradient(145deg, #A0522D, #CD853F);
            color: white;
            padding: 40px 20px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 8px 24px rgba(160, 82, 45, 0.3);
          }
          .code-box h2 {
            font-size: 16px;
            margin-bottom: 20px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .code {
            font-size: 56px;
            font-weight: bold;
            letter-spacing: 16px;
            font-family: 'Courier New', monospace;
            margin: 20px 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            padding: 10px;
          }
          .code-box small {
            display: block;
            margin-top: 20px;
            font-size: 14px;
            opacity: 0.85;
          }
          .instructions {
            background-color: #f8f9fa;
            border-left: 4px solid #A0522D;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .instructions h3 {
            color: #A0522D;
            font-size: 18px;
            margin-bottom: 12px;
          }
          .instructions ol {
            margin-left: 20px;
            color: #555;
          }
          .instructions li {
            margin-bottom: 8px;
          }
          .warning {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .warning strong {
            color: #856404;
            font-size: 16px;
            display: block;
            margin-bottom: 10px;
          }
          .warning ul {
            margin-left: 20px;
            color: #856404;
          }
          .warning li {
            margin-bottom: 6px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-top: 3px solid #A0522D;
          }
          .footer p {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .footer a {
            color: #A0522D;
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .copyright {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🍞 PARDARIA</h1>
            <p>Padaria Artesanal</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <div class="greeting">Olá, ${nome}! 👋</div>
            
            <div class="message">
              <p>Você solicitou a <strong>recuperação de senha</strong> da sua conta na PARDARIA.</p>
              <p style="margin-top: 10px;">Use o código abaixo para redefinir sua senha:</p>
            </div>
            
            <!-- Code Box -->
            <div class="code-box">
              <h2>🔑 Seu Código de Verificação</h2>
              <div class="code">${codigo}</div>
              <small>⏰ Este código expira em 10 minutos</small>
            </div>
            
            <!-- Instructions -->
            <div class="instructions">
              <h3>📝 Como usar o código:</h3>
              <ol>
                <li>Volte para a página de recuperação de senha</li>
                <li>Digite o código de 6 dígitos acima</li>
                <li>Crie sua nova senha</li>
                <li>Faça login com a nova senha</li>
              </ol>
            </div>
            
            <!-- Warning -->
            <div class="warning">
              <strong>⚠️ Importante - Segurança da sua conta:</strong>
              <ul>
                <li>Se você <strong>não solicitou</strong> esta alteração, <strong>ignore este email</strong></li>
                <li>Nunca compartilhe este código com ninguém</li>
                <li>Nossa equipe NUNCA pedirá este código por telefone, WhatsApp ou email</li>
                <li>O código expira em 10 minutos por segurança</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #666;">
              Alguma dúvida? Entre em contato conosco!
            </p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p style="color: #999; font-size: 13px; margin-bottom: 15px;">
              Este é um email automático. Por favor, não responda.
            </p>
            <p>
              <a href="http://localhost:3001/auth/login.html">Fazer Login</a>
              <span style="color: #ccc; margin: 0 10px;">|</span>
              <a href="http://localhost:3001">Visitar Site</a>
            </p>
            <div class="copyright">
              © ${new Date().getFullYear()} PARDARIA - Padaria Artesanal<br>
              Todos os direitos reservados
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    // Versão em texto simples (fallback para clientes que não suportam HTML)
    text: `
═══════════════════════════════════════════════════════
🍞 PARDARIA - Padaria Artesanal
═══════════════════════════════════════════════════════

RECUPERAÇÃO DE SENHA

Olá, ${nome}!

Você solicitou a recuperação de senha da sua conta.

SEU CÓDIGO DE VERIFICAÇÃO:

    ${codigo}

⏰ Este código expira em 10 minutos.

COMO USAR:
1. Volte para a página de recuperação de senha
2. Digite o código de 6 dígitos
3. Crie sua nova senha
4. Faça login com a nova senha

⚠️ IMPORTANTE:
• Se você não solicitou esta alteração, ignore este email
• Nunca compartilhe este código com ninguém
• Nossa equipe nunca pedirá este código

═══════════════════════════════════════════════════════
Este é um email automático. Não responda.

© ${new Date().getFullYear()} PARDARIA - Padaria Artesanal
═══════════════════════════════════════════════════════
    `
  };

  try {
    console.log('🚀 Enviando email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ EMAIL ENVIADO COM SUCESSO!');
    console.log('═══════════════════════════════════════');
    console.log('📧 Destinatário:', destinatario);
    console.log('📨 ID da Mensagem:', info.messageId);
    console.log('⏰ Horário:', new Date().toLocaleString('pt-BR'));
    console.log('═══════════════════════════════════════');
    console.log('');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ ERRO AO ENVIAR EMAIL');
    console.error('═══════════════════════════════════════');
    console.error('Erro:', error.message);
    console.error('Código:', error.code);
    console.error('═══════════════════════════════════════');
    console.error('');
    
    return { success: false, error: error.message };
  }
}

// ======================================
// EXPORTAR
// ======================================
module.exports = {
  transporter,
  enviarEmailRecuperacao
};