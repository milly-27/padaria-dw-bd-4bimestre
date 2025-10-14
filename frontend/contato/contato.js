// Não há funcionalidades JavaScript complexas para o formulário de contato neste momento.
// Uma implementação real enviaria os dados para um backend.

const contactForm = document.getElementById("contactForm");
const messageContainer = document.getElementById("messageContainer");

function mostrarMensagem(texto, tipo = "info") {
  messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
  setTimeout(() => {
    messageContainer.innerHTML = "";
  }, 3000);
}

contactForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Previne o envio padrão do formulário

  // Aqui você faria a lógica para enviar os dados do formulário para o backend
  // Por exemplo, usando fetch API:
  /*
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    fetch("/api/contato", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        mostrarMensagem("Mensagem enviada com sucesso!", "success");
        contactForm.reset();
    })
    .catch(error => {
        console.error("Erro ao enviar mensagem:", error);
        mostrarMensagem("Erro ao enviar mensagem.", "error");
    });
  */

  // Simulação de envio bem-sucedido
  mostrarMensagem("Mensagem enviada com sucesso! (Simulado)", "success");
  contactForm.reset();
});


