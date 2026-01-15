import { Timestamp } from 'firebase/firestore'

export class SystemSettingsModel {
  constructor({
    id = null,
    systemName = '',
    systemLogo = null,
    defaultLogo = 'https://cdn.quasar.dev/logo-v2/svg/logo.svg',
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id
    this.systemName = systemName
    this.systemLogo = systemLogo
    this.defaultLogo = defaultLogo
    this.createdAt =
      createdAt instanceof Timestamp
        ? createdAt
        : createdAt
        ? Timestamp.fromDate(new Date(createdAt))
        : null
    this.updatedAt =
      updatedAt instanceof Timestamp
        ? updatedAt
        : updatedAt
        ? Timestamp.fromDate(new Date(updatedAt))
        : null
  }

  toFirestore() {
    return {
      systemName: this.systemName,
      systemLogo: this.systemLogo || null,
      defaultLogo: this.defaultLogo,
      createdAt: this.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  static fromFirestore(doc) {
    const data = doc.data()
    return new SystemSettingsModel({
      id: doc.id,
      ...data,
    })
  }
}
