# React-local-fetch

Simple lib for fetch

[example on codesandbox](https://codesandbox.io/s/88pkm515j)

* * *
> ## Notice
> This lib intended for react project without [hooks](https://reactjs.org/docs/hooks-intro.html)

## You can use LocalFetching to...
* * *
# ...if you need to make fetch-request

Usually you do something like the example below:

```js
class Foo extends Component {
  constructor(props) {
    super(props)
    this.state = {
      news: [],
      error: null,
    }
  }

  async componentDidMount() {
    try {
      const news = await fetchNews()

      this.setState({ news })
    }
    catch (error) {
      this.setState({ error })
    }
  }

  render() {
    if (this.state.error) {
      return '...has some error'
    }

    return this.state.news.map(renderer)
  }
}
```

or with fetch-status state varriable

```js
...
  this.state = {
    ...
    fetch: 'initial'
  }

  async componentDidMount() {
    try {
      this.setState({ fetch: 'loading' })
      const news = await fetchNews()

      this.setState({ news, fetch: 'finish' })
    }
    catch (error) {
      this.setState({ error, fetch: 'fail' })
    }
  }
...
```
seems like an ordinary example, but if you have more pages and fetch call ? You write a lot of boilerplate code. You might continue use this practic or use local-fetch lib.

## With lib (and recompose) example

```js
import { withLocalFetch, isFailed } from 'react-local-fetch'
import { compose, lifecycle } from 'recompose'

// in follow code writed default behavior
const newsReducer = (state = [], action) => {
  switch(action.type) {
    case 'SET': return ({
      ...state,
      data: action.payload,
    }),
    default: return state,
  }
}

const enhance = compose(
  withLocalFetch('news', {
    action: apiFn,
    reducer: newsReducer,
  }),
  lifecycle({
    componentDidMount() {
      this.props.news.fetch({
        pageId: 1,
        type: 'SET',
      })
    },
  }),
)


const view = ({ news }) => {
  if (isFailed(news.status)) {
    return '...has some error'
  }

  return news.data.map(renderer)
}
```
