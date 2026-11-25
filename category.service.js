const { z } = require('zod');
const { Category, Book } = require('../models');
const { resource, fail } = require('../shared/resource');

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable()
});

module.exports = resource({
  model: Category,
  schema,
  beforeDelete: async category => {
    if (await Book.count({ where: { categoryId: category.id } })) {
      fail(409, 'Categoria vinculada a livros.');
    }
  }
});
