const SECRET_KEY = process.env.SECRET_KEY;
const TOKEN_EXPIRES = process.env.TOKEN_EXPIRES;

interface IJwtConfig {
  secret: string;
  signOptions: { expiresIn: string };
}

export const jwtConfig: IJwtConfig = {
  secret: SECRET_KEY,
  signOptions: { expiresIn: TOKEN_EXPIRES },
};
