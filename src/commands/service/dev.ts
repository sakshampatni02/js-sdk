import {Service} from 'mesg-js/lib/api'
import {hash} from 'mesg-js/lib/api/types'
import * as base58 from 'mesg-js/lib/util/base58'

import Command from '../../root-command'
import {IsAlreadyExistsError} from '../../utils/error'

import ServiceCompile from './compile'
import ServiceCreate from './create'
import ServiceDelete from './delete'
import ServiceLog from './logs'
import ServiceStart from './start'
import ServiceStop from './stop'

export default class ServiceDev extends Command {
  static description = 'Run a service in development mode'

  static flags = {
    ...Command.flags,
    ...ServiceCreate.flags,
    ...ServiceStart.flags,
  }

  static args = [{
    name: 'SERVICE',
    description: 'Path or url ([https|mesg]://) of a service',
    default: './'
  }]

  serviceCreated = false
  instanceCreated = false

  async run() {
    const {args, flags} = this.parse(ServiceDev)

    const definition = await ServiceCompile.run([args.SERVICE, '--silent'])
    const serviceHash = await this.createService(definition)
    const instanceHash = await this.startService(serviceHash, flags.env)
    const stream = await ServiceLog.run([base58.encode(instanceHash)])

    process.once('SIGINT', async () => {
      stream.destroy()
      if (this.instanceCreated) await ServiceStop.run([base58.encode(instanceHash)])
      if (this.serviceCreated) await ServiceDelete.run([base58.encode(serviceHash), '--confirm'])
    })
  }

  async createService(definition: Service): Promise<hash> {
    try {
      const service = await this.api.service.create(definition)
      if (!service.hash) throw new Error('invalid hash')
      this.serviceCreated = true
      return service.hash
    } catch (e) {
      if (!IsAlreadyExistsError.match(e)) throw e
      this.warn('service already created')
      return new IsAlreadyExistsError(e).hash
    }
  }

  async startService(serviceHash: hash, env: string[]): Promise<hash> {
    try {
      const instance = await this.api.instance.create({
        serviceHash,
        env
      })
      if (!instance.hash) throw new Error('invalid hash')
      this.instanceCreated = true
      return instance.hash
    } catch (e) {
      if (!IsAlreadyExistsError.match(e)) throw e
      this.warn('service already started')
      return new IsAlreadyExistsError(e).hash
    }
  }
}
