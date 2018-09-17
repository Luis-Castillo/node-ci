const PageProxy = require('./helpers/page')

let page

beforeEach(async () => {
  page = await PageProxy.build()
  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await page.close()
})

test('header has correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo')
  expect(text).toEqual('Blogster')
})

test('login starts oauth flow', async () => {
  await page.click('.right a')
  const url = await page.url()
  expect(url).toMatch(/accounts\.google\.com/)
})

test('sign in shows logout button', async () => {
  await page.login()
  const text = await page.getContentsOf('a[href="/auth/logout"]')
  expect(text).toEqual('Logout')
})