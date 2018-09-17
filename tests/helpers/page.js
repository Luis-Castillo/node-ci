const puppeteer = require('puppeteer')
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class ProxyPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    })
    const page = await browser.newPage()
    const customPage = new ProxyPage(page)
    
    return new Proxy(customPage, {
      get(target, property) {
        return target[property] || browser[property] || page[property]
      }
    })
  }
  
  constructor(page) {
    this.page = page
  }
  
  async login() {
    const user = await userFactory()
    const { session, sig } = sessionFactory(user)
  
    // set cookie in browser
    await this.page.setCookie({ name: 'session', value: session })
    await this.page.setCookie({ name: 'session.sig', value: sig })
  
    // refresh page to simulate login and wait for page to render
    await this.page.goto('http://localhost:3000/blogs')
    await this.page.waitFor('a[href="/auth/logout"]')
  }
  
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML)
  }
  
  get(url) {
    return this.page.evaluate((_url) => {
      return fetch(_url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
    }, url)
  }
  
  post(url, body) {
    return this.page.evaluate((_url, _body) => {
      return fetch(_url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_body)
      }).then(res => res.json())
    }, url, body)
  }
  
  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data)
      })
    )
  }
}

module.exports = ProxyPage