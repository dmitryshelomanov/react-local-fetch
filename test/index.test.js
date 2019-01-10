import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import renderer from 'react-test-renderer'
import { withLocalFetch, fetchStatus } from '../src/index'


Enzyme.configure({ adapter: new Adapter() })

let viewStub = null

beforeEach(() => {
  viewStub = ({ news, users }) => (
    <div>
      <button
        onClick={() => news.fetch({ id: 1 })}
        testid="fetchNews"
      >
        fetch news
      </button>
      <button
        onClick={() => users.fetch({ id: 2 })}
        testid="fetchUsers"
      >
        fetch users
      </button>
    </div>
  )
})

test('Should hoc render without error', () => {
  const MyComponent = withLocalFetch()(() => <p>hello</p>)
  const wrapper = renderer.create(<MyComponent />)

  expect(wrapper).toMatchSnapshot()
})

test('Should request function was called', async () => {
  const mockRequest = jest.fn()
  const requests = { news: mockRequest, users: mockRequest }
  const enhance = withLocalFetch(requests)
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')
  const usersBtn = wrapper.find('[testid="fetchUsers"]')

  newsBtn.simulate('click')
  usersBtn.simulate('click')

  expect(requests.news.mock.calls.length).toBe(2)
})

test('Mapping fetchStatus and fetch result status', async () => {
  const mockRequest = jest.fn()
  const mockRequestWithThrow = () => {
    throw new Error('some error message')
  }
  const requests = { news: mockRequest, users: mockRequestWithThrow }
  const enhance = withLocalFetch(requests)
  const TestComponent = enhance(viewStub)
  const wrapper = mount(<TestComponent />)
  const newsBtn = wrapper.find('[testid="fetchNews"]')
  const usersBtn = wrapper.find('[testid="fetchUsers"]')

  await newsBtn.simulate('click')
  await usersBtn.simulate('click')

  const { state } = wrapper.instance()

  expect(state.requests.news.status).toBe(fetchStatus.ready)
  expect(state.requests.users.status).toBe(fetchStatus.fail)
})
