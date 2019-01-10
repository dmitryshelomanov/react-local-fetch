# React-local-fetch

[![build status](https://img.shields.io/travis/acdlite/recompose/master.svg?style=flat-square)](https://travis-ci.org/acdlite/recompose)
[![coverage](https://img.shields.io/codecov/c/github/acdlite/recompose.svg?style=flat-square)](https://codecov.io/github/acdlite/recompose)
[![code climate](https://img.shields.io/codeclimate/github/acdlite/recompose.svg?style=flat-square)](https://codeclimate.com/github/acdlite/recompose)
[![npm downloads](https://img.shields.io/npm/dm/recompose.svg?style=flat-square)](https://www.npmjs.com/package/recompose)
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
import { withLocalFetch, fetchStatus } from 'react-local-fetch'
import { compose, lifecycle } from 'recompose'


const enhance = compose(
  withLocalFetch({
    news: { action: apiFn, initialResult: [] }, // initialResult might be function [(pops) => []]
  }),
  lifecycle({
    componentDidMount() {
      /*
        news type
        {
          fetch: any => any,
          status: { initial: number, loading: number, fail: number, ready: number },
          result: any
        }
      */
      this.props.news
        .fetch({ pageSlug: 'slug' })
    },
  }),
)

const view = ({ news }) => {
  if (news.status === fetchStatus.fail) {
    return '...has some error'
  }

  return news.result.map(renderer)
}
```