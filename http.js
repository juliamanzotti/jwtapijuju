// Lança um erro HTTP que será tratado pelo middleware de erros do index.js
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

// Envolve um handler async para que erros caiam no next()
function route(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

// Lê page/limit da query string (limite entre 1 e 100, padrão 10)
function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit, offset: (page - 1) * limit };
}

// Formata o retorno do findAndCountAll no padrão da API
function paged(result, page, limit) {
  return {
    data: result.rows,
    total: result.count,
    page,
    pages: Math.ceil(result.count / limit)
  };
}

module.exports = { fail, route, pagination, paged };
