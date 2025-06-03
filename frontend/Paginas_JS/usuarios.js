// Funções para gerenciar o modal
function openModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'none';
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Funções para gerenciar usuários
function addUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Aqui você implementaria a lógica para enviar os dados para o backend
    console.log('Adicionando usuário:', Object.fromEntries(formData));
    
    // Limpar formulário e fechar modal
    form.reset();
    closeModal();
}

function editUser(userId) {
    // Aqui você implementaria a lógica para carregar os dados do usuário
    console.log('Editando usuário:', userId);
    openModal();
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        // Aqui você implementaria a lógica para excluir o usuário
        console.log('Excluindo usuário:', userId);
    }
}

function viewUser(userId) {
    // Aqui você implementaria a lógica para visualizar os detalhes do usuário
    console.log('Visualizando usuário:', userId);
}

// Funções para filtros e busca
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;
    
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const status = row.querySelector('td:nth-child(4)').textContent;
        const level = row.querySelector('td:nth-child(3)').textContent;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        const matchesLevel = levelFilter === 'all' || level === levelFilter;
        
        row.style.display = matchesSearch && matchesStatus && matchesLevel ? '' : 'none';
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar event listeners
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    document.getElementById('statusFilter').addEventListener('change', filterUsers);
    document.getElementById('levelFilter').addEventListener('change', filterUsers);
    
    // Adicionar event listener para o formulário
    const form = document.getElementById('userForm');
    if (form) {
        form.addEventListener('submit', addUser);
    }

    // Adicionar event listeners para os submenus
    const submenuTriggers = document.querySelectorAll('.submenu-trigger');
    
    submenuTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = this.nextElementSibling;
            const icon = this.querySelector('.submenu-icon');
            
            // Toggle do submenu
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            
            // Rotacionar o ícone
            icon.style.transform = submenu.style.display === 'block' ? 'rotate(180deg)' : 'rotate(0)';
        });
    });

    // Expandir o submenu ativo
    const activeSubmenu = document.querySelector('.submenu a.active').closest('.submenu');
    if (activeSubmenu) {
        activeSubmenu.style.display = 'block';
        const trigger = activeSubmenu.previousElementSibling;
        const icon = trigger.querySelector('.submenu-icon');
        icon.style.transform = 'rotate(180deg)';
    }
}); 