import { beforeEach, afterEach, test, expect, it, describe } from 'vitest'
import { Kafka, Producer } from 'kafkajs'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'

declare module 'vitest' {
    export interface TestContext {
        producer: Producer
    }
}

describe.concurrent('ingester', () => {
    it('handles one event', async ({ producer }) => {
        const teamId = uuidv4()
        const sessionId = uuidv4()
        const eventUuid = uuidv4()

        await producer.send({
            topic: 'events_plugin_ingestion',
            messages: [
                {
                    value: JSON.stringify({
                        event: '$snapshot',
                        team_id: teamId,
                        uuid: eventUuid,
                        timestamp: 1234,
                        properties: { $session_id: sessionId, $snapshot_data: { timestamp: 123 } },
                    }),
                },
            ],
        })

        const sessionRecording = await waitForSessionRecording(teamId, sessionId, eventUuid)

        expect(sessionRecording.events.length).toBe(1)
    })

    it('handles lots of events', async ({ producer }) => {
        const teamId = uuidv4()
        const sessionId = uuidv4()

        const events = Array.from(new Array(30).keys()).map((_) => ({
            event: '$snapshot',
            team_id: teamId,
            uuid: uuidv4(),
            timestamp: 1234,
            properties: { $session_id: sessionId, $snapshot_data: { timestamp: 123 } },
        }))

        await producer.send({
            topic: 'events_plugin_ingestion',
            messages: events.map((event) => ({
                value: JSON.stringify(event),
            })),
        })

        const sessionRecording = await waitForSessionRecording(teamId, sessionId, events.slice(-1)[0].uuid)
        expect(sessionRecording.events.map((event) => event.uuid)).toStrictEqual(events.map((event) => event.uuid))
    })

    it('ignores non $snapshot events', () => {
        // TODO
    })
})

const getSessionRecording = async (teamId: string, sessionId: string): Promise<{ events: any[] }> => {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/team/${teamId}/session_recordings/${sessionId}`,
        method: 'GET',
    }

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = ''
            res.on('data', (data) => {
                body = body + data
            })
            res.on('end', () => resolve(JSON.parse(body)))
            res.on('error', (err) => reject(err))
        })

        req.end()
    })
}

const waitForSessionRecording = async (teamId: string, sessionId: string, eventUuid: string) => {
    while (true) {
        const recording = await getSessionRecording(teamId, sessionId)
        if (recording.events.map((event) => event.uuid).includes(eventUuid)) {
            return recording
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }
}

beforeEach(async (context) => {
    const kafka = new Kafka({
        clientId: 'session-recordings',
        brokers: ['localhost:9092'],
    })

    const producer = kafka.producer()
    await producer.connect()

    context.producer = producer
})

afterEach(async ({ producer }) => {
    await producer.disconnect()
})
