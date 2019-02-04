import React from 'react'
import isPLainObject from 'is-plain-object'


export const fetchStatus = {
  initial: 1,
  loading: 2,
  fail: 3,
  ready: 4,
}

const defaultOptions = {
  reducer: (state, action = {}) => action.payload,
}

const log = (text, mode = 'error') => (
  // eslint-disable-next-line prefer-template
  console[mode]('[react-local-fetch]: ' + text)
)

export const withLocalFetch = (requestName, options) => (
  (BaseComponent) => (
    class WithLocalFetch extends React.Component {
      constructor(props) {
        super(props)
        this.options = {
          ...defaultOptions,
          ...(
            typeof options === 'function'
              ? options(props) : options
          ),
        }
        this.requestName = requestName
        this.state = {
          data: this.options.reducer(undefined, {}),
          status: fetchStatus.initial,
          error: null,
        }
        this.isMountedMain = false
      }

      componentDidMount() {
        this.isMountedMain = true
      }

      componentWillUnmount() {
        this.isMountedMain = false
      }

      fetch = async ({ type, ...args } = {}) => {
        try {
          this.setState({ status: fetchStatus.loading })
          const result = await this.options.action(args)

          if (!this.isMountedMain) {
            return undefined
          }

          this.setState((prev) => {
            return {
              status: fetchStatus.ready,
              data: this.options
                .reducer(prev.data, { type, payload: result }),
            }
          })
          return result
        }
        catch (error) {
          this.setState({ status: fetchStatus.fail, error })
          return undefined
        }
      }

      dispatch = (action) => {
        if (!isPLainObject(action)) {
          log('action must be plain object')
          return
        }

        const computedData = this.options
          .reducer(this.state.data, action)

        this.setState({ data: computedData })
      }

      render() {
        return React
          .createElement(BaseComponent, {
            ...this.props,
            [this.requestName]: {
              ...this.state,
              fetch: this.fetch,
              dispatch: this.dispatch,
            },
          })
      }
    }
  )
)
