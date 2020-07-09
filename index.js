const sqsQuooler = require('sqs-quooler')
const tracer = require('dd-trace').init({
  logInjection: true,
  runtimeMetrics: true,
})

const { Queue } = sqsQuooler

function injectTags (data) {
  const scope = tracer.scope()

  if (scope.active()) {
    scope.active().addTags({ data })
  }
}

class DDQueue extends Queue {
  constructor (options) {
    super(options)
  }

  startTracedProcessing (processFunction, options = {}) {
    const injectedTracedFunction = (data) => {
      injectTags(data)
      return processFunction(data)
    }
  
    const tracedFunction = tracer.wrap(
      'sqs-quooler.process',
      injectedTracedFunction
    )
  
    return this.startProcessing(
      tracedFunction,
      options
    )
  }
}

module.exports = {
  ...sqsQuooler,
  Queue: DDQueue,
}
