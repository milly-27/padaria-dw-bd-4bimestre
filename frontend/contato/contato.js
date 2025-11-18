const contactForm = document.getElementById("contactForm");
const messageContainer = document.getElementById("messageContainer");

function mostrarMensagem(texto, tipo = "info") {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = "";
    }, 4000);
}

contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Pegando os valores do formulário
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;

    // Validação básica
    if (!name || !email || !message) {
        mostrarMensagem("Por favor, preencha todos os campos obrigatórios!", "error");
        return;
    }

    // Criando a mensagem para o WhatsApp
    const whatsappMessage = `*Nova mensagem do site - Padaria Doce Sabor*%0A%0A` +
        `*Nome:* ${encodeURIComponent(name)}%0A` +
        `*Email:* ${encodeURIComponent(email)}%0A` +
        `*Assunto:* ${encodeURIComponent(subject || "Sem assunto")}%0A%0A` +
        `*Mensagem:*%0A${encodeURIComponent(message)}`;

    // Número do WhatsApp (formato: código do país + DDD + número, sem espaços ou caracteres especiais)
    const phoneNumber = "5544984015736"; // 55 (Brasil) + 44 (DDD) + 984015736

    // URL do WhatsApp
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

    // Mostrando mensagem de sucesso
    mostrarMensagem("✅ Redirecionando para o WhatsApp...", "success");

    // Abrindo o WhatsApp em uma nova aba após 1 segundo
    setTimeout(() => {
        window.open(whatsappURL, "_blank");
        // Limpa o formulário após enviar
        contactForm.reset();
    }, 1000);
});