import { actions, connect, kea, listeners, path, reducers } from 'kea'
import { uuid } from 'lib/utils'
import posthog from 'posthog-js'
import { userLogic } from 'scenes/userLogic'

import type { supportLogicType } from './supportLogicType'
import { forms } from 'kea-forms'

export const TargetAreaToName = {
    analytics: 'Analytics',
    app_performance: 'App Performance',
    apps: 'Apps',
    billing: 'Billing',
    cohorts: 'Cohorts',
    data_management: 'Data Management',
    data_integrity: 'Data Integrity',
    ingestion: 'Events Ingestion',
    experiments: 'Experiments',
    feature_flags: 'Feature Flags',
    login: 'Login / Sign up / Invites',
    session_reply: 'Session Replay',
}
export type supportTicketTargetArea = keyof typeof TargetAreaToName
export type supportTicketKind = 'bug' | 'feedback'

export const URLPathToTargetArea: Record<string, supportTicketTargetArea> = {
    insights: 'analytics',
    recordings: 'session_reply',
    dashboard: 'analytics',
    feature_flags: 'feature_flags',
    experiments: 'experiments',
    'web-performance': 'session_reply',
    events: 'analytics',
    'data-management': 'data_management',
    cohorts: 'cohorts',
    annotations: 'analytics',
    persons: 'data_integrity',
    groups: 'data_integrity',
    app: 'apps',
    apps: 'apps', // TODO: it currently is project/apps for some reason :shrug
    toolbar: 'analytics',
}

export function getURLPathToTargetArea(pathname: string): supportTicketTargetArea | undefined {
    const first_part = pathname.split('/')[1]
    return URLPathToTargetArea[first_part]
}

export const supportLogic = kea<supportLogicType>([
    path(['lib', 'components', 'support', 'supportLogic']),
    connect(() => ({
        values: [userLogic, ['user']],
    })),
    actions(() => ({
        closeSupportForm: () => true,
        openSupportForm: (kind?: supportTicketKind, target_area?: supportTicketTargetArea) => ({ kind, target_area }),
        submitZendeskTicket: (kind: supportTicketKind, target_area: supportTicketTargetArea, message: string) => ({
            kind,
            target_area,
            message,
        }),
    })),
    reducers(() => ({
        isSupportFormOpen: [
            false,
            {
                openSupportForm: () => true,
                closeSupportForm: () => false,
            },
        ],
    })),
    forms(({ actions }) => ({
        sendSupportRequest: {
            defaults: {} as unknown as {
                kind: supportTicketKind
                target_area: supportTicketTargetArea
                message: string
            },
            errors: ({ message, kind, target_area }) => {
                return {
                    message: !message ? 'Please enter a message' : '',
                    kind: !kind ? 'Please choose' : undefined,
                    target_area: !target_area ? 'Please choose' : undefined,
                }
            },
            submit: async ({ kind, target_area, message }) => {
                actions.submitZendeskTicket(kind, target_area, message)
                actions.closeSupportForm()
                actions.resetSendSupportRequest()
            },
        },
    })),
    listeners(({ actions }) => ({
        openSupportForm: async ({ kind, target_area }) => {
            actions.resetSendSupportRequest({
                kind: kind ? kind : undefined,
                target_area: target_area ? target_area : getURLPathToTargetArea(window.location.pathname),
                message: '',
            })
        },
        submitZendeskTicket: async ({ kind, target_area, message }) => {
            const name = userLogic.values.user?.first_name
            const email = userLogic.values.user?.email

            const zendesk_ticket_uuid = uuid()
            const payload = {
                request: {
                    requester: { name: name, email: email },
                    subject: 'Help in-app',
                    comment: {
                        body:
                            message +
                            `\n\n-----` +
                            `\nKind: ${kind}` +
                            `\nTarget area: ${target_area}` +
                            `\nInternal link: http://go/ticketByUUID/${zendesk_ticket_uuid}`,
                    },
                },
            }
            await fetch('https://posthoghelp.zendesk.com/api/v2/requests.json', {
                method: 'POST',
                body: JSON.stringify(payload, undefined, 4),
                headers: { 'Content-Type': 'application/json' },
            })
                .then((res) => res.json())
                .then((res) => {
                    const zendesk_ticket_id = res.request.id
                    const properties = {
                        zendesk_ticket_uuid,
                        kind,
                        target_area,
                        message,
                        zendesk_ticket_id,
                        zendesk_ticket_link: `https://posthoghelp.zendesk.com/agent/tickets/${zendesk_ticket_id}`,
                    }
                    posthog.capture('support_ticket', properties)
                })
                .catch((err) => {
                    console.log(err)
                })
        },
    })),
])
