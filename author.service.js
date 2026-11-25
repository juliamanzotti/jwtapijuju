const { z } = require('zod');
const { Author } = require('../models');
const { resource, fail } = require('../shared/resource');

const schema = z.object({
  name: z.string().min(2),
  nationality: z.string().optional().nullable(),
  birthDate: z.iso.date().optional().nullable()
});

module.exports = resource({
  model: Author,
  schema,
  beforeDelete: async author => {
    if (await author.countBooks()) fail(409, 'Autor vinculado a livros.');
  }
});
