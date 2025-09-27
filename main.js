document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Proteção de Rota (Route Guard) ---
    // Verifica se o usuário está "logado"
    if (sessionStorage.getItem('userIsLoggedIn') !== 'true') {
        // Se não estiver, redireciona para a página de login
        // Isso impede o acesso direto às páginas restritas pela URL
        window.location.href = 'login.html';
    }

    // --- Lógica de Logout ---
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Remove o indicador de login do sessionStorage
            sessionStorage.removeItem('userIsLoggedIn');
            // Redireciona o usuário para a página de login
            window.location.href = 'login.html';
        });
    }
});
