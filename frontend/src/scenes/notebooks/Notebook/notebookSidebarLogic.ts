import { actions, kea, reducers, path, listeners } from 'kea'
import { NodeType } from '../Nodes/types'
import { notebookLogic } from './notebookLogic'

import type { notebookSidebarLogicType } from './notebookSidebarLogicType'

export const notebookSidebarLogic = kea<notebookSidebarLogicType>([
    path(['scenes', 'notebooks', 'Notebook', 'notebookSidebarLogic']),
    actions({
        setNotebookSideBarShown: (shown: boolean) => ({ shown }),
        setFullScreen: (full: boolean) => ({ full }),
        addNodeToNotebook: (type: NodeType, properties: Record<string, any>) => ({ type, properties }),
        createNotebook: (id: string) => ({ id }),
        deleteNotebook: (id: string) => ({ id }),
        renameNotebook: (id: string, name: string) => ({ id, name }),
        selectNotebook: (id: string) => ({ id }),
    }),
    reducers(() => ({
        notebooks: [
            ['scratchpad', 'RFC: Notebooks', 'Feature Flag overview', 'HoqQL examples'] as string[],
            {
                createNotebook: (state, { id }) => [...state, id],
                deleteNotebook: (state, { id }) => state.filter((notebook) => notebook !== id),
            },
        ],
        selectedNotebook: [
            'scratchpad',
            { persist: true },
            {
                selectNotebook: (_, { id }) => id,
                createNotebook: (_, { id }) => id,
            },
        ],
        notebookSideBarShown: [
            false,
            { persist: true },
            {
                setNotebookSideBarShown: (_, { shown }) => shown,
                setFullScreen: () => true,
            },
        ],
        fullScreen: [
            false,
            {
                setFullScreen: (_, { full }) => full,
                setNotebookSideBarShown: (state, { shown }) => (!shown ? false : state),
            },
        ],
    })),

    listeners(({ values }) => ({
        addNodeToNotebook: ({ type, properties }) => {
            notebookLogic({ id: values.selectedNotebook }).actions.addNodeToNotebook(type, properties)

            // if (!values.editor) {
            //     return
            // }
            // values.editor
            //     .chain()
            //     .focus()
            //     .insertContent({
            //         type,
            //         attrs: props,
            //     })
            //     .run()
        },
    })),
])
