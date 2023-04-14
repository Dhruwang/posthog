import { Dayjs } from 'lib/dayjs'

export type ConnectionChoiceType = {
    id: string
    name: string
    imageUrl: string
    type: 'Event streaming' | 'Batch export'
}

export type ConnectionType = {
    id: string
    name: string
    status: string
    type: 'Event streaming' | 'Batch export'
    successRate: string
    imageUrl: string
}

export type BatchExportSettings = {
    id?: string
    name: string
    frequency: BatchExportFrequencyType
    firstExport: Dayjs
    stopAtSpecificDate: false
    stopAt: Dayjs | undefined
    backfillRecords: boolean
    backfillFrom: Dayjs | undefined
    AWSAccessKeyID: string
    AWSSecretAccessKey: string
    AWSRegion: string
    AWSBucket: string
    fileFormat: FileFormatType
    fileName: string
}

export type CDPTabsType = 'connections' | 'history'

export type BatchExportTabsType = 'sync-history' | 'settings' | 'activity-log'

export type BatchExportFrequencyType = 'none' | '1' | '6' | '12' | 'daily' | 'weekly' | 'monthly'

export type FileFormatType = 'csv'
