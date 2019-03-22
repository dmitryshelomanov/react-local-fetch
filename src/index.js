import React from 'react'
import isPLainObject from 'is-plain-object'


export const fetchStatus = {
  failed: -1,
  initial: 0,
  loading: 1,
  ready: 2,
}

export const isReady = (status) => status === fetchStatus.ready
export const isFailed = (status) => status === fetchStatus.failed
export const isInitial = (status) => status === fetchStatus.initial
export const isLoading = (status) => status === fetchStatus.loading

const defaultOptions = {
  reducer: (state, action = {}) => action.payload,
  withClearPrevFetch: true,
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
              ? options(props, this.getProps) : options
          ),
        }
        this.requestName = requestName
        this.state = {
          data: this.options.reducer(undefined, {}),
          status: fetchStatus.initial,
          error: null,
        }
        this.isMountedMain = false
        this.fetchId = 1
      }

      componentDidMount() {
        this.isMountedMain = true
      }

      componentWillUnmount() {
        this.isMountedMain = false
      }

      getProps = () => this.props

      fetch = async ({ type, ...args } = {}) => {
        this.fetchId += 1
        const localFetchId = this.fetchId

        try {
          this.setState({ status: fetchStatus.loading })
          const result = await this.options.action(args)

          if (!this.isMountedMain || !this.isSameRequest(localFetchId)) {
            return undefined
          }

          this.setState((prev) => ({
            status: fetchStatus.ready,
            data: this.options
              .reducer(prev.data, { type, payload: result }),
          }))

          return result
        }
        catch (error) {
          if (this.isMountedMain && this.isSameRequest(localFetchId)) {
            this.setState({ status: fetchStatus.failed, error })
          }

          return undefined
        }
      }

      isSameRequest = (fetchid) => (
        this.options.withClearPrevFetch
          ? this.fetchId === fetchid : true
      )

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
