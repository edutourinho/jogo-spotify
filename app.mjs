import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let allTracks = [];

//app.listen(PORT, '0.0.0.0', () => {
//  console.log(`Servidor rodando em: http://0.0.0.0:${PORT}`);
//});

async function loadAllTracks() {
    try {
        let offset = 0;
        let total = 0;
        const limit = 100;

        do {
            const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId, {
                offset: offset,
                limit: limit
            });
            allTracks = allTracks.concat(response.body.items);
            total = response.body.total;
            offset += response.body.items.length;
        } while (offset < total);
        console.log('Todas as faixas foram carregadas com sucesso.');
    } catch (error) {
        console.error('Erro ao carregar todas as músicas da playlist:', error);
    }
}

// Substitua com suas credenciais e a URL de redirecionamento configurada
const spotifyApi = new SpotifyWebApi({
  clientId: '2043a83d8538426081beb9f278a53b8a',
  clientSecret: '2961d5442c4e420fae65eb5b3796d63a',
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
app.use(express.static(path.join(__dirname)));
// Rota de callback após a autenticação

app.get('/callback', async (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
      console.error('Callback Error:', error);
      res.send(`Callback Error: ${error}`);
      return;
  }

  try {
      const data = await spotifyApi.authorizationCodeGrant(code);
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      await loadAllTracks(); // Agora usando await aqui

      res.redirect('/faixa.html');

      setInterval(async () => {
          const data = await spotifyApi.refreshAccessToken();
          spotifyApi.setAccessToken(data.body['access_token']);
      }, expires_in / 2 * 1000);
  } catch (error) {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
  }
});



app.get('/callbackvelho', (req, res) => {
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
    //res.send('Autenticação realizada com sucesso!');
    //res.redirect('/playlist-tracks');
    //res.redirect('/random-song');
    res.redirect('/faixa.html');

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
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/load-tracks', async (req, res) => {
  try {
    let offset = 0;
    let total = 0;
    const limit = 100;

    do {
      const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId, {
        offset: offset,
        limit: limit
      });
      allTracks = allTracks.concat(response.body.items);
      total = response.body.total;
      offset += response.body.items.length;
    } while (offset < total);

    res.send('Todas as faixas carregadas com sucesso.');
  } catch (error) {
    console.error('Erro ao buscar músicas da playlist:', error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  open(`http://localhost:${PORT}`);
});
//const hardcodedPlaylistId = '2tiOwC7GAHIfZmsBuXrY30'; //playlist bagunça
const hardcodedPlaylistId = '37i9dQZF1DX7KTVQYEg01L';
app.get('/playlist/:playlistId', async (req, res) => {
    try {
      
      const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId);
      res.json(response.body.items);
    } catch (error) {
      console.error('Erro ao buscar músicas da playlist:', error);
      res.status(500).send(error);
    }
  });
app.get('/user-playlists', async (req, res) => {
  try {
   const response = await spotifyApi.getUserPlaylists();
   res.json(response.body.items);
   } catch (error) {
   console.error('Erro ao buscar playlists do usuário:', error);
   res.status(500).send('Erro ao buscar playlists do usuário');
 }
});
app.get('/playlist-tracks', async (req, res) => {
  try {
    let allTracks = [];
    let offset = 0;
    let total = 0;
    const limit = 100; // Máximo permitido pela API do Spotify por requisição

    do {
      const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId, {
        offset: offset,
        limit: limit
      });
      allTracks = allTracks.concat(response.body.items);
      total = response.body.total;
      offset += response.body.items.length;
    } while (offset < total);

    res.json(allTracks);
  } catch (error) {
    console.error('Erro ao buscar músicas da playlist:', error);
    res.status(500).send(error);
  }
});
let playedTracks = new Set();


app.get('/random-songalltracknaofunciona', async (req, res) => {
  try {
    // Verifica se allTracks está carregado
    if (allTracks.length === 0) {
      return res.status(500).send('Playlist ainda não foi carregada.');
    }

    let randomTrack;
    do {
      randomTrack = allTracks[Math.floor(Math.random() * allTracks.length)];
    } while (playedTracks.has(randomTrack.id) && playedTracks.size < allTracks.length);

    if (playedTracks.size >= allTracks.length) {
      playedTracks.clear(); // Reseta se todas as músicas já foram tocadas
    }

    playedTracks.add(randomTrack.id);

    let answerOptions = [randomTrack.name];
    while (answerOptions.length < 5) {
      let option = allTracks[Math.floor(Math.random() * allTracks.length)].name;
      if (!answerOptions.includes(option)) {
        answerOptions.push(option);
      }
    }

    // Embaralhar as opções de resposta
    answerOptions.sort(() => Math.random() - 0.5);

    res.json({ correctTrack: randomTrack, answerOptions: answerOptions });
  } catch (error) {
    console.error('Erro ao buscar música aleatória:', error);
    res.status(500).send('Erro ao buscar música aleatória');
  }
});

app.get('/random-song', async (req, res) => {
  try {
    const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId);
    const tracks = response.body.items;

    let randomTrackIndex = Math.floor(Math.random() * tracks.length);
    let randomTrack = tracks[randomTrackIndex].track;

    let trackOptions = new Set([randomTrack.name]);
    let artistOptions = new Set([randomTrack.artists.map(artist => artist.name).join(', ')]);

    // Adicionar opções até que ambos os conjuntos tenham 5 elementos cada
    while (trackOptions.size < 5 || artistOptions.size < 5) {
      let optionIndex = Math.floor(Math.random() * tracks.length);
      let optionTrack = tracks[optionIndex].track;
      trackOptions.add(optionTrack.name);
      artistOptions.add(optionTrack.artists.map(artist => artist.name).join(', '));
    }

    if (playedTracks.size >= tracks.length) {
      playedTracks.clear(); // Reseta se todas as músicas já foram tocadas
    }
    playedTracks.add(randomTrack.id);

    res.json({ 
      correctTrack: randomTrack, 
      trackOptions: Array.from(trackOptions).sort(() => 0.5 - Math.random()), 
      artistOptions: Array.from(artistOptions).sort(() => 0.5 - Math.random())
    });

  } catch (error) {
    console.error('Erro ao buscar música aleatória:', error);
    res.status(500).send('Erro ao buscar música aleatória');
  }
});


app.get('/random-songfunciona', async (req, res) => {
  try {
    const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId);
    const tracks = response.body.items;

    let randomTrack;
    do {
      randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    } while (playedTracks.has(randomTrack.track.id) && playedTracks.size < tracks.length);

    if (playedTracks.size >= tracks.length) {
      playedTracks.clear(); // Reseta se todas as músicas já foram tocadas
    }

    playedTracks.add(randomTrack.track.id);

    let answerOptions = [randomTrack.track.name];
    while (answerOptions.length < 5) {
      let option = tracks[Math.floor(Math.random() * tracks.length)].track.name;
      if (!answerOptions.includes(option)) {
        answerOptions.push(option);
      }
    }

    // Embaralhar as opções de resposta
    answerOptions.sort(() => Math.random() - 0.5);

    res.json({ correctTrack: randomTrack, answerOptions: answerOptions });

    //res.json(randomTrack);
  } catch (error) {
    console.error('Erro ao buscar música aleatória:', error);
    res.status(500).send('Erro ao buscar música aleatória');
  }
});
app.get('/random-song-novo', async (req, res) => {
  try {
    const response = await spotifyApi.getPlaylistTracks(hardcodedPlaylistId);
    const tracks = response.body.items;

    // Escolher uma faixa aleatoriamente
    let randomTrack;
    do {
      randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    } while (playedTracks.has(randomTrack.track.id) && playedTracks.size < tracks.length);

    // Resetar se todas as músicas já foram tocadas
    if (playedTracks.size >= tracks.length) {
      playedTracks.clear();
    }

    playedTracks.add(randomTrack.track.id);

    // Escolher 4 faixas aleatórias adicionais como opções de resposta
    let answerOptions = [randomTrack.track.name];
    while (answerOptions.length < 5) {
      let option = tracks[Math.floor(Math.random() * tracks.length)].track.name;
      if (!answerOptions.includes(option)) {
        answerOptions.push(option);
      }
    }

    // Embaralhar as opções de resposta
    answerOptions.sort(() => Math.random() - 0.5);

    res.json({ correctTrack: randomTrack, answerOptions: answerOptions });
  } catch (error) {
    console.error('Erro ao buscar música aleatória:', error);
    res.status(500).send('Erro ao buscar música aleatória');
  }
});

app.get('/final', (req, res) => {
  res.sendFile(path.join(__dirname, 'final.html'));
});

app.get('/shutdown', (req, res) => {
  console.log('Servidor está sendo encerrado...');
  res.send('Encerrando servidor...');
  process.exit(0); // Encerra o processo do Node.js
});

