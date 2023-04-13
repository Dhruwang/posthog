import { actions, kea, path, reducers } from 'kea'
import { CDPTabsType, ConnectionChoiceType, ConnectionType } from './types'

import type { CDPSceneLogicType } from './CDPSceneLogicType'
import { mockConnectionChoices, mockConnections } from './mocks'

export const CDPSceneLogic = kea<CDPSceneLogicType>([
    path(['scenes', 'cdp', 'cdpSceneLogic']),
    actions({
        openNewConnectionModal: true,
        closeNewConnectionModal: true,
        setTab: (tab: CDPTabsType) => ({ tab }),
    }),
    reducers({
        newConnectionModalOpen: [
            false as boolean,
            {
                openNewConnectionModal: () => true,
                closeNewConnectionModal: () => false,
            },
        ],
        connections: [mockConnections as ConnectionType[], {}],
        connectionChoices: [mockConnectionChoices as ConnectionChoiceType[], {}],
        activeTab: [
            'connections' as CDPTabsType,
            {
                setTab: (_, { tab }) => tab,
            },
        ],
    }),
])
