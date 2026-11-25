const User = require('../user/user.model');
const Category = require('../category/category.model');
const Author = require('../author/author.model');
const Book = require('../book/book.model');
const Reader = require('../reader/reader.model');
const Loan = require('../loan/loan.model');
const RefreshToken = require('../auth/refreshToken.model');
const Reservation = require('../reservation/reservation.model');

// Livro pertence a uma categoria
Category.hasMany(Book, { foreignKey: 'categoryId' });
Book.belongsTo(Category, { foreignKey: 'categoryId' });

// Livro <-> Autor (muitos para muitos)
Book.belongsToMany(Author, { through: 'BookAuthor', foreignKey: 'bookId' });
Author.belongsToMany(Book, { through: 'BookAuthor', foreignKey: 'authorId' });

// Empréstimos
Reader.hasMany(Loan, { foreignKey: 'readerId' });
Loan.belongsTo(Reader, { foreignKey: 'readerId' });
Book.hasMany(Loan, { foreignKey: 'bookId' });
Loan.belongsTo(Book, { foreignKey: 'bookId' });
User.hasMany(Loan, { foreignKey: 'userId' });
Loan.belongsTo(User, { foreignKey: 'userId' });

// Refresh tokens
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// Reservas
Book.hasMany(Reservation, { foreignKey: 'bookId' });
Reservation.belongsTo(Book, { foreignKey: 'bookId' });
Reader.hasMany(Reservation, { foreignKey: 'readerId' });
Reservation.belongsTo(Reader, { foreignKey: 'readerId' });

module.exports = { User, Category, Author, Book, Reader, Loan, RefreshToken, Reservation };
