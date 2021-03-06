import path from 'path'
import axios from 'axios'
import bodyParser from 'body-parser'
import 'babel-polyfill'
import express from 'express'
import log from './log'
import proxy from 'http-proxy-middleware'
import clientRouteHandler from './middleware/client-route-handler'
import wrap from './wrap'
import mail from './mail'

const STATIC_SITE_DIR = path.resolve(process.cwd(), 'src/static')

const app = express()
const port = process.env.PORT
app.enable('trust proxy')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// In development, we use webpack server
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(process.env.PUBLIC_DIR, {
    maxAge: '180 days'
  }))
}

// This is temporary until we figure out how to just use webpack to build our image assets
app.use('/images', express.static(
  path.resolve(process.cwd(), 'src/images')))

app.use('/static-assets', express.static(path.resolve(STATIC_SITE_DIR, 'assets')))

app.get('/', wrap(async (req, res) => {
  res.redirect('/home')
}))

app.get('/work', wrap(async (req, res) => {
  res.redirect('https://docs.google.com/document/d/1Op0OaZNuykCJckSCn4vABDEr4VEdTrMeTsPCZFNSJo4')
}))

app.post('/signup', wrap(async (req, res) => {
  const body = req.body
  console.log(body.zip)
  const requestBody = {
    person: {
      email1: body.email,
      primary_address: {
        zip: body.zip
      }
    }
  }

  let response = null
  response = await axios
    .post(`https://${process.env.NATIONBUILDER_SLUG}.nationbuilder.com/api/v1/people?access_token=${process.env.NATIONBUILDER_TOKEN}`, requestBody, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, validateStatus: () => true })

  if (response && (response.status === 201 || response.status === 409)) {
    await mail.sendEmailTemplate(body.email, 'Thanks for signing up. This is what you can do now.', 'signup', { name: 'Friend'  })
    res.sendStatus(200)
  } else {
    res.sendStatus(400)
  }
}))

app.get('/techteam', (req, res) => {
  res.redirect('https://github.com/BrandNewCongress/welcome/blob/master/README.md')
})

app.use(clientRouteHandler)
app.listen(port, () => {
  log.info(`Node app is running on port ${port}`)
})
