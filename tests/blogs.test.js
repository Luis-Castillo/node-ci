const PageProxy = require('./helpers/page')

let page

beforeEach(async () => {
  page = await PageProxy.build()
  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await page.close()
})


describe('when logged in', async () => {
  beforeEach(async () => {
    await page.login()
    await page.click('a.btn-floating')
  })
  
  test('can see create blog form', async () => {
    const text = await page.getContentsOf('form label')
    expect(text).toEqual('Blog Title')
  })
  
  describe('using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'Blog Title')
      await page.type('.content input', 'Blog Content' )
      await page.click('form button')
    })
    
    test('goes to review screen', async () => {
      const text = await page.getContentsOf('h5')
      expect(text).toEqual('Please confirm your entries')
    })
    
    test('adds blog to index page', async () => {
      await page.click('button.green')
      await page.waitFor('.card')
      const title = await page.getContentsOf('.card-title')
      const content = await page.getContentsOf('p')
      expect(title).toEqual('Blog Title')
      expect(content).toEqual('Blog Content')
    })
  })
  
  describe('using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button')
    })
    
    test('the form shows error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text')
      const contentError = await page.getContentsOf('.content .red-text')
      expect(titleError).toEqual('You must provide a value')
      expect(contentError).toEqual('You must provide a value')
    })
  })
})

describe('when not logged in', async () => {
  test('cannot create blog post', async () => {
    const result = await page.post('/api/blogs', {
      title: 'Malicious Title',
      content: 'Malicious Content'
    })
    expect(result).toEqual({ error: 'You must log in!' })
  })
  
  test('cannot view list of posts', async () => {
    const result = await page.get('/api/blogs')
    expect(result).toEqual({ error: 'You must log in!' })
  })
})

describe('alternate not logged in', async () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs',
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: {
        title: 'Malicious Title',
        content: 'Malicious Content'
      }
    }
  ]
  
  test('reject all blog actions', async () => {
    const results = await page.execRequests(actions)
    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' })
    }
  })
})