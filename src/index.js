import React from 'react'


export const fetchStatus = {
  initial: 1,
  loading: 2,
  fail: 3,
  ready: 4,
}

export const withLocalFetch = (requests = {}) => (
  (BaseComponent) => (
    class WithLocalFetch extends React.Component {
      constructor(props) {
        super(props)
        this.state = {
          requests: this.reduceRequests(requests),
        }
      }

      reduceRequests = () => (
        Object.keys(requests).reduce((acc, request) => {
          const { action, initialResult } = requests[request]

          return Object.assign({
            [request]: {
              fetch: (...args) => (
                this.actionStarter({ fn: action, name: request, args })
              ),
              status: fetchStatus.initial,
              result: (
                typeof initialResult === 'function'
                  ? initialResult(this.props)
                  : initialResult
              ),
            },
          }, acc)
        }, {})
      )

      actionStarter = async ({ fn, name, args }) => {
        try {
          this.updateRequestState(name, { status: fetchStatus.loading })
          const result = await fn(...args)

          this.updateRequestState(name, { status: fetchStatus.ready, result })
          return result
        }
        catch (error) {
          this.updateRequestState(name, { status: fetchStatus.fail })
          return undefined
        }
      }

      updateRequestState = (requestName, computedState) => {
        this.setState((prev) => {
          return {
            requests: {
              ...prev.requests,
              [requestName]: {
                ...prev.requests[requestName],
                ...computedState,
              },
            },
          }
        })
      }

      render() {
        return (
          <BaseComponent
            {...this.props}
            {...this.state.requests}
          />
        )
      }
    }
  )
)
