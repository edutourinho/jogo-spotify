const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const open = require('open');

const app = express();
const PORT = process.env.PORT || 5000;

// Substitua com suas credenciais e a URL de redirecionamento configurada
const spotifyApi = new SpotifyWebApi({
  clientId: '8b9f13e5e0424dff876e1015acf7dfb9',
  clientSecret: 'd515d8a6c2f2462e98f4b7608259343e',
  redirectUri: 'http://localhost:5000/callback'
});

// Rota inicial que redireciona para a autenticação do Spotify
app.get('/login', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL([
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative'
  ]);
  open(authorizeURL);
  res.send('Redirecionando para o Spotify...');
});

// Rota de callback após a autenticação
app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi.authorizationCodeGrant(code).then(data => {
    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];
    const expires_in = data.body['expires_in'];

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log('access_token:', access_token);
    console.log('refresh_token:', refresh_token);

    // Aqui você pode redirecionar para outra rota ou página
    res.send('Autenticação realizada com sucesso!');

    setInterval(async () => {
      const data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body['access_token']);
    }, expires_in / 2 * 1000);

  }).catch(error => {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
  });
});

// Rota raiz (opcional)
app.get('/', (req, res) => {
  res.send('Olá, Mundo!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

