import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import renderer from 'react-test-renderer'
import { withLocalFetch, fetchStatus } from '../src/index'


Enzyme.configure({ adapter: new Adapter() })

let viewStub = null
let testArgsForFetch = {}

beforeEach(() => {
  viewStub = ({ news }) => (
    <div>
      <button
        onClick={() => news.fetch(testArgsForFetch)}
        testid="fetchNews"
      >
        fetch news
      </button>
    </div>
  )
})

afterEach(() => {
  testArgsForFetch = {}
})

test('Should hoc render without error', () => {
  const MyComponent = withLocalFetch('news', {})((p) => <p>hello</p>)
  const wrapper = renderer.create(<MyComponent />)

  expect(wrapper).toMatchSnapshot()
})

test('Should request function was called', async () => {
  const mockRequest = jest.fn()
  const enhance = withLocalFetch('news', { action: mockRequest })
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')

  newsBtn.simulate('click')

  expect(mockRequest.mock.calls.length).toBe(1)
})

test('Should request function was called if option is function', async () => {
  const mockRequest = jest.fn()
  const enhance = withLocalFetch('news', (props) => ({ action: props.mockRequest }))
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent mockRequest={mockRequest} />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')

  newsBtn.simulate('click')

  expect(mockRequest.mock.calls.length).toBe(1)
})

test('FetchStatus should be ready', async () => {
  const mockRequest = jest.fn()
  const enhance = withLocalFetch('news', { action: mockRequest })
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')

  await newsBtn.simulate('click')

  const { state } = wrapper.instance()

  expect(state.status).toBe(fetchStatus.ready)
})

test('FetchStatus should be fail and have valid error object', async () => {
  const message = 'some error'
  const mockRequest = () => {
    throw new Error(message)
  }
  const enhance = withLocalFetch('news', { action: mockRequest })
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')

  await newsBtn.simulate('click')

  const { state } = wrapper.instance()

  expect(state.status).toBe(fetchStatus.fail)
  expect(state.error.message).toBe(message)
})

test('state should be user object', async () => {
  const mockRequest = jest.fn()
  const fetchedNews = ['news1', 'news2']

  mockRequest.mockReturnValue(fetchedNews)

  const options = { action: mockRequest }
  const enhance = withLocalFetch('news', options)
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')

  await newsBtn.simulate('click')

  const { state } = wrapper.instance()

  expect(state.status).toBe(fetchStatus.ready)
  expect(state.data).toBe(fetchedNews)
  expect(mockRequest.mock.calls.length).toBe(1)
})

test('test with custom reducer', async () => {
  testArgsForFetch = { type: 'PUSH' }
  const mockRequest = jest.fn()
  const fetchedNews = ['news1', 'news2']

  mockRequest.mockReturnValue(fetchedNews)

  const options = {
    action: mockRequest,
    reducer: (state = ['news main'], action) => {
      switch (action.type) {
        case 'PUSH': return [...state, ...action.payload]
        default: return state
      }
    },
  }
  const enhance = withLocalFetch('news', options)
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')

  await newsBtn.simulate('click')

  const { state } = wrapper.instance()

  expect(state.status).toBe(fetchStatus.ready)
  expect(state.data).toEqual(['news main', ...fetchedNews])
  expect(mockRequest.mock.calls.length).toBe(1)
})
