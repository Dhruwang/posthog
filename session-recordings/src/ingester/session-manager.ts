import { PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import pino from 'pino'
import { s3Client } from '../utils/s3'
import { IncomingRecordingMessage, PersistedRecordingMessage } from '../types'
import { config } from '../config'
import { convertToPersitedMessage } from './utils'

// The buffer is a list of messages grouped
type SessionBuffer = {
    id: string
    count: number
    size: number
    createdAt: Date

    // NOTE: This will eventually be moved to a file
    fileData: PersistedRecordingMessage[]
}

const logger = pino({ name: 'SessionManager', level: process.env.LOG_LEVEL || 'info' })

export class SessionManager {
    chunks: Map<string, IncomingRecordingMessage[]> = new Map()
    buffer: SessionBuffer
    flushBuffer?: SessionBuffer

    constructor(public readonly teamId: number, public readonly sessionId: string) {
        this.buffer = this.createBuffer()
    }

    public add(message: IncomingRecordingMessage): void {
        if (message.chunk_count === 1) {
            this.addToBuffer(message)
        } else {
            this.addToChunks(message)
        }
        logger.info(
            `Added message to buffer ${this.sessionId} (count: ${this.buffer.count}, size: ${this.buffer.size}), chunks: ${this.chunks.size}`
        )

        const shouldFlush =
            this.buffer.size >= config.sessions.maxEventGroupKb * 1024 ||
            Date.now() - this.buffer.createdAt.getTime() >= config.sessions.maxEventGroupAgeSeconds

        if (shouldFlush) {
            logger.info(`Buffer size exceeded, flushing`)
            this.flush()
        }
    }

    /**
     * Flushing takes the current buffered file and moves it to the flush buffer
     * We then attempt to write the events to S3 and if successful, we clear the flush buffer
     */
    public async flush(): Promise<void> {
        if (this.flushBuffer) {
            logger.warn("Flush called but we're already flushing")
            return
        }
        // We move the buffer to the flush buffer and create a new buffer so that we can safely write the buffer to disk
        this.flushBuffer = this.buffer
        this.buffer = this.createBuffer()

        try {
            const baseKey = `${config.s3.sessionRecordingFolder}/team_id/${this.teamId}/session_id/${this.sessionId}`
            const dataKey = `${baseKey}/data/${this.flushBuffer.createdAt}` // TODO: Change to be based on events times

            await s3Client.send(
                new PutObjectCommand({
                    Bucket: config.s3.bucket,
                    Key: dataKey,
                    Body: JSON.stringify(this.flushBuffer.fileData),
                })
            )
        } catch (error) {
            // TODO: If we fail to write to S3 we should be do something about it
            logger.error(error)
        } finally {
            this.flushBuffer = undefined
        }
    }

    private createBuffer(): SessionBuffer {
        // The buffer is always created
        return {
            id: `${this.teamId}-${this.sessionId}-${randomUUID()}`,
            count: 0,
            size: 0,
            createdAt: new Date(),
            fileData: [],
        }
    }

    /**
     * Full messages (all chunks) are added to the buffer directly
     */
    private addToBuffer(message: IncomingRecordingMessage): void {
        this.buffer.fileData.push(convertToPersitedMessage(message))
        this.buffer.count += 1
        this.buffer.size += Buffer.byteLength(message.data)
    }

    /**
     * Chunked messages are added to the chunks map
     * Once all chunks are received, the message is added to the buffer
     *
     */
    private addToChunks(message: IncomingRecordingMessage): void {
        console.log('Adding chunk', message)
        // If it is a chunked message we add to the collected chunks
        let chunks: IncomingRecordingMessage[] = []

        if (!this.chunks.has(message.chunk_id)) {
            this.chunks.set(message.chunk_id, chunks)
        } else {
            chunks = this.chunks.get(message.chunk_id)
        }

        chunks.push(message)

        if (chunks.length === message.chunk_count) {
            // If we have all the chunks, we can add the message to the buffer
            this.addToBuffer({
                ...message,
                data: chunks
                    .sort((a, b) => a.chunk_index - b.chunk_index)
                    .map((c) => c.data)
                    .join(''),
            })
            this.chunks.delete(message.chunk_id)
        }
    }
}

export class GlobalSessionManager {
    private static sessions: Map<string, SessionManager> = new Map()

    public static consume(event: IncomingRecordingMessage): void {
        const key = `${event.team_id}-${event.session_id}`

        if (!this.sessions.has(key)) {
            this.sessions.set(key, new SessionManager(event.team_id, event.session_id))
        }

        this.sessions.get(key).add(event)
    }
}
