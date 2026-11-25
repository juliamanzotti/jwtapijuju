const { z } = require('zod');
const { Reader, Loan } = require('../models');
const { resource, fail } = require('../shared/resource');

const schema = z.object({
  name: z.string().min(2),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  email: z.email().optional().nullable(),
  phone: z.string().optional().nullable()
});

module.exports = resource({
  model: Reader,
  schema,
  beforeDelete: async reader => {
    if (await Loan.count({ where: { readerId: reader.id } })) {
      fail(409, 'Leitor com histórico de empréstimos.');
    }
  }
});
