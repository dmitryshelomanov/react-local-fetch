import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import renderer from 'react-test-renderer'
import {
  withLocalFetch,
  fetchStatus,
  isFailed,
  isInitial,
  isLoading,
  isReady,
} from '../src/index'


describe('test react local fetch hoc', () => {
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

  test('Should getProps returns actual props', async () => {
    const mockRequest = jest.fn()
    const enhance = withLocalFetch('news', (_, getProps) => {
      const props = getProps()

      return { action: props.mockRequest }
    })
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

  test('FetchStatus should be failed and have valid error object', async () => {
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

    expect(state.status).toBe(fetchStatus.failed)
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

  test('test async function with unmouting component', (done) => {
    const willUnmount = jest.fn()

    class Stub extends React.Component {
      constructor(props) {
        super(props)
        this.componentWillUnmount = willUnmount
      }

      async componentDidMount() {
        await this.props.users.fetch()
        done()
      }

      render() {
        return null
      }
    }
    const mockRequest = () => new Promise((res) => {
      setTimeout(() => {
        res(true)
      }, 3000)
    })
    const options = { action: mockRequest }
    const enhance = withLocalFetch('users', options)
    const TestComponent = enhance(Stub)
    const wrapper = mount(<TestComponent />)
    const { state } = wrapper.instance()

    wrapper.unmount()

    expect(state.status).toBe(fetchStatus.loading)
    expect(state.data).toBe(undefined)
    expect(willUnmount.mock.calls.length).toBe(1)
  })
})

describe('test status support functions', () => {
  test('isReady should be true', () => {
    expect(isFailed(fetchStatus.ready)).toBe(false)
    expect(isReady(fetchStatus.ready)).toBe(true)
    expect(isInitial(fetchStatus.ready)).toBe(false)
    expect(isLoading(fetchStatus.ready)).toBe(false)
  })

  test('isFailed should be true', () => {
    expect(isFailed(fetchStatus.failed)).toBe(true)
    expect(isReady(fetchStatus.failed)).toBe(false)
    expect(isInitial(fetchStatus.failed)).toBe(false)
    expect(isLoading(fetchStatus.failed)).toBe(false)
  })

  test('isInitial should be true', () => {
    expect(isFailed(fetchStatus.initial)).toBe(false)
    expect(isReady(fetchStatus.initial)).toBe(false)
    expect(isInitial(fetchStatus.initial)).toBe(true)
    expect(isLoading(fetchStatus.initial)).toBe(false)
  })

  test('isLoading should be true', () => {
    expect(isFailed(fetchStatus.loading)).toBe(false)
    expect(isReady(fetchStatus.loading)).toBe(false)
    expect(isInitial(fetchStatus.loading)).toBe(false)
    expect(isLoading(fetchStatus.loading)).toBe(true)
  })
})
