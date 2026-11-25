const fs = require('fs');
const groups = {
  Autenticação: [
    ['Login', 'POST', '/auth/login', { email: 'admin@biblioteca.local', password: 'troque-esta-senha' }],
    ['Renovar token', 'POST', '/auth/refresh'],
    ['Meu perfil', 'GET', '/auth/me'],
    ['Sair', 'POST', '/auth/logout']
  ],
  Atendentes: [
    ['Listar', 'GET', '/user?page=1&limit=10'],
    ['Criar', 'POST', '/user', { name: 'Atendente', username: 'atendente', email: 'atendente@biblioteca.local', password: 'senha123' }],
    ['Editar', 'PUT', '/user/1', { name: 'Atendente Editado' }],
    ['Desativar', 'PATCH', '/user/1/active', { active: false }]
  ],
  Categorias: [
    ['Listar', 'GET', '/categories?page=1&limit=10'],
    ['Criar', 'POST', '/categories', { name: 'Literatura', description: 'Livros literários' }],
    ['Editar', 'PUT', '/categories/1', { name: 'Romance' }],
    ['Excluir', 'DELETE', '/categories/1']
  ],
  Autores: [
    ['Listar', 'GET', '/authors?page=1&limit=10'],
    ['Criar', 'POST', '/authors', { name: 'Machado de Assis', nationality: 'Brasileira', birthDate: '1839-06-21' }],
    ['Editar', 'PUT', '/authors/1', { nationality: 'Brasil' }],
    ['Excluir', 'DELETE', '/authors/1']
  ],
  Livros: [
    ['Listar e filtrar', 'GET', '/books?page=1&limit=10&available=true'],
    ['Criar', 'POST', '/books', { title: 'Dom Casmurro', isbn: '9788535914849', year: 1899, totalCopies: 2, categoryId: 1, authorIds: [1] }],
    ['Editar', 'PUT', '/books/1', { totalCopies: 3 }],
    ['Excluir', 'DELETE', '/books/1']
  ],
  Leitores: [
    ['Listar', 'GET', '/readers?page=1&limit=10'],
    ['Criar', 'POST', '/readers', { name: 'Maria Oliveira', cpf: '12345678901', email: 'maria@exemplo.com', phone: '44999999999' }],
    ['Editar', 'PUT', '/readers/1', { phone: '44888888888' }],
    ['Histórico', 'GET', '/readers/1/loans']
  ],
  Empréstimos: [
    ['Listar', 'GET', '/loans?status=ATIVO&page=1&limit=10'],
    ['Emprestar', 'POST', '/loans', { bookId: 1, readerId: 1 }],
    ['Devolver', 'PATCH', '/loans/1/return']
  ],
  Reservas: [
    ['Listar fila', 'GET', '/reservations?page=1&limit=10'],
    ['Reservar', 'POST', '/reservations', { bookId: 1, readerId: 1 }],
    ['Cancelar', 'PATCH', '/reservations/1/cancel']
  ],
  Relatórios: [['Dashboard', 'GET', '/reports/dashboard']]
};
function makeRequest([name, method, path, data]) {
  const request = { method, header: data ? [{ key: 'Content-Type', value: 'application/json' }] : [], url: '{{baseUrl}}' + path };
  if (data) request.body = { mode: 'raw', raw: JSON.stringify(data, null, 2), options: { raw: { language: 'json' } } };
  const item = { name, request };
  if (name === 'Login' || name === 'Renovar token') item.event = [{ listen: 'test', script: { exec: ['if (pm.response.code === 200) { pm.collectionVariables.set("accessToken", pm.response.json().accessToken); }'] } }];
  return item;
}
const collection = {
  info: { name: 'Biblioteca JWT API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000/v1' }, { key: 'accessToken', value: '' }],
  item: Object.entries(groups).map(([name, requests]) => ({ name, item: requests.map(makeRequest) }))
};
fs.writeFileSync('biblioteca.postman_collection.json', JSON.stringify(collection, null, 2) + '\n');
