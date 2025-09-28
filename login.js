document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário

            const username = event.target.username.value;
            const password = event.target.password.value;

            // Lógica de autenticação fictícia
            if (username === 'admin' && password === 'admin') {
                // Se as credenciais estiverem corretas, marca o usuário como logado
                sessionStorage.setItem('userIsLoggedIn', 'true');
                
                // Redireciona para o portal de conteúdo no idioma correto
                if (window.location.pathname.includes('login_en.html')) {
                    window.location.href = 'portal_en.html';
                } else {
                    window.location.href = 'portal.html';
                }
            } else {
                // Se as credenciais estiverem erradas, exibe uma mensagem de erro no idioma correto
                const lang = document.documentElement.lang;
                const errorMessageText = lang.startsWith('en') ? 'Invalid username or password.' : 'Usuário ou senha inválidos.';
                errorMessage.textContent = errorMessageText;
                errorMessage.style.display = 'block';
            }
        });
    }
});
