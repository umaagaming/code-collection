const axios = require('axios')
const cheerio = require('cheerio')

async function getSession() {
  const res = await axios.get('https://spotmate.online/en1', {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    }
  })

  const $ = cheerio.load(res.data)
  const token = $('meta[name="csrf-token"]').attr('content')
  const cookies = res.headers['set-cookie'] || []

  return {
    token,
    cookieStr: cookies.map(c => c.split(';')[0]).join('; ')
  }
}

async function getTrackData(url, session) {
  const res = await axios.post('https://spotmate.online/getTrackData',
    {
      spotify_url: url
    },
    {
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': session.token,
        'cookie': session.cookieStr,
        'origin': 'https://spotmate.online',
        'referer': 'https://spotmate.online/en1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      }
    }
  )

  return res.data
}

async function convert(trackUrl, session) {
  const res = await axios.post('https://spotmate.online/convert',
    {
      urls: trackUrl
    },
    {
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': session.token,
        'cookie': session.cookieStr,
        'origin': 'https://spotmate.online',
        'referer': 'https://spotmate.online/en1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      }
    }
  )

  return res.data
}

async function checkTask(taskId, session) {
  const res = await axios.get(`https://spotmate.online/tasks/${taskId}`,
    {
      headers: {
        'x-csrf-token': session.token,
        'cookie': session.cookieStr,
        'origin': 'https://spotmate.online',
        'referer': 'https://spotmate.online/en1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      }
    }
  )

  return res.data
}

async function spotmate(url) {
  const session = await getSession()

  const trackInfo = await getTrackData(url, session)

  if (!trackInfo || trackInfo.status === 'error') {
    throw new Error('Failed to retrieve song information')
  }

  const convertInfo = await convert(url, session)

  const image = trackInfo.album?.images?.[0]?.url || ''

  if (convertInfo.error === false && convertInfo.url) {
    return {
      title: trackInfo.name,
      artist: trackInfo.artists?.[0]?.name,
      image: image,
      download_url: convertInfo.url
    }
  }

  const taskId = convertInfo.task_id || convertInfo.taskid

  if (!taskId) {
    throw new Error(convertInfo.status || convertInfo.message || 'Failed to start conversion')
  }

  let taskResult

  do {
    await new Promise(r => setTimeout(r, 3000))

    taskResult = await checkTask(taskId, session)

  } while (taskResult && (taskResult.status === 'pending' || taskResult.status === 'processing'))

  return {
    title: trackInfo.name,
    artist: trackInfo.artists?.[0]?.name,
    image: image,
    download_url: taskResult.url
  }
}

spotmate('https://open.spotify.com/track/75OSVIdR2KPpEmViMt8MX2?si=f2c9bb036e564144')
  .then(console.log)
  .catch(console.error)
