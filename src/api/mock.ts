import { EventEmitter } from 'events'
import { API, Event, Execution } from './types'
import { Stream } from '../util/grpc';

const hash = 'hash'

class StreamMock<T> implements Stream<T> {
  private eventEmitter = new EventEmitter()
  on(event: 'data' | 'end' | 'error' | 'status' | 'metadata', listener: (data: any) => void): this {
    this.eventEmitter.on(event, listener)
    return this
  }
  cancel(): void { }
  destroy(err?: Error): void { }
  emit(event: 'data' | 'end' | 'error' | 'status' | 'metadata', data: any) {
    this.eventEmitter.emit(event, data)
  }
}

export const streams = {
  event: new StreamMock<Event>(),
  execution: new StreamMock<Execution>()
}

export default (endpoint: string): API => ({
  event: {
    create() { return Promise.resolve({ hash }) },
    stream() { return streams.event },
  },
  execution: {
    create() { return Promise.resolve({ hash }) },
    get() { return Promise.resolve({ parentHash: hash, eventHash: 'xxx', status: 0, instanceHash: hash, taskKey: 'xxx', inputs: '{}' }) },
    stream() { return streams.execution },
    update() { return Promise.resolve({}) }
  },
  instance: {
    create() { return Promise.resolve({ hash }) },
    get() { return Promise.resolve({ serviceHash: hash }) },
    list() { return Promise.resolve({ instances: [] }) },
    delete() { return Promise.resolve({}) }
  },
  service: {
    create() { return Promise.resolve({ hash }) },
    get() { return Promise.resolve({ sid: 'xxx', source: 'xxx' }) },
    list() { return Promise.resolve({ services: [] }) },
    delete() { return Promise.resolve({}) },
  },
  core: {
    info() { return Promise.resolve({ version: '0', services: [] }) }
  }
})

export * from './types' 