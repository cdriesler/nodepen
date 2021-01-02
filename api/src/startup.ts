import axios from 'axios'
import { Grasshopper } from 'glib'
import * as store from './store'
import { db } from './db'

/**
 * Check in with db and store configurations.
 */
export const configure = async (): Promise<void> => {
  // TODO: Fallback to what's in redis store if this fails.
  const installed = await fetchRhinoConfiguration()
  const allowed = store.getAllowedIds()

  const writeBatch = db.multi()
  installed.forEach((component) => {
    writeBatch.set(`lib:installed:${component.guid}`, JSON.stringify(component))
  })
  allowed.forEach((id, i) => {
    writeBatch.lset('lib:allowed', i, id)
  })
  writeBatch.exec((err, reply) => {
    console.log(
      err
        ? err
        : `[ SET ${reply.length} ]\nUpdated definitions for ${installed.length} installed components.\nOf those, ${allowed.length} are allowed on Glasshopper.`
    )
  })

  store.setServerConfig(installed)

  return
}

const fetchRhinoConfiguration = async (): Promise<Grasshopper.Component[]> => {
  const { data } = await axios.request({
    url: 'http://localhost:8081/grasshopper',
  })

  const components = data.map((c) => {
    const component: Grasshopper.Component = {
      guid: c['Guid'],
      name: c['Name'],
      nickname: c['NickName'],
      description: c['Description'],
      category: c['Category'],
      subcategory: c['Subcategory'],
      libraryName: c['LibraryName'],
      icon: c['Icon'],
      inputs: c['Inputs'],
      outputs: c['Outputs'],
      isObsolete: c['IsObsolete'],
      isVariable: c['IsVariable'],
    }
    return component
  })

  return components
}