const { z } = require('zod');
const service = require('./auth.service');
const { route } = require('../shared/http');

const COOKIE_NAME = 'biblioteca_refresh';
const COOKIE_PATH = '/v1/auth';
const SEVEN_DAYS = 7 * 86400000;
const isProduction = () => process.env.NODE_ENV === 'production';

const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });

// Lê o refresh token direto do header Cookie
function getCookie(req) {
  const cookies = (req.headers.cookie || '').split(';').map(part => part.trim());
  const found = cookies.find(part => part.startsWith(`${COOKIE_NAME}=`));
  return found ? decodeURIComponent(found.slice(COOKIE_NAME.length + 1)) : null;
}

function setCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: COOKIE_PATH,
    maxAge: SEVEN_DAYS
  });
}

module.exports = {
  login: route(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await service.login(email, password);

    setCookie(res, refreshToken);
    res.json({ accessToken, user });
  }),

  refresh: route(async (req, res) => {
    const { accessToken, refreshToken, user } = await service.refresh(getCookie(req));

    setCookie(res, refreshToken);
    res.json({ accessToken, user });
  }),

  logout: route(async (req, res) => {
    await service.logout(getCookie(req));

    res.clearCookie(COOKIE_NAME, {
      path: COOKIE_PATH,
      sameSite: 'lax',
      secure: isProduction()
    });
    res.json({ message: 'Sessão encerrada.' });
  }),

  me: route(async (req, res) => res.json(service.publicUser(req.user)))
};
