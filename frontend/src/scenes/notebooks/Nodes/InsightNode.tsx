import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { BindLogic, useValues } from 'kea'
import { InsightContainer } from 'scenes/insights/InsightContainer'
import { insightLogic } from 'scenes/insights/insightLogic'
import { ItemMode } from '~/types'

const Component = (): JSX.Element => {
    const logic = insightLogic({ dashboardItemId: 'new' })
    const { insightProps } = useValues(logic)

    return (
        <BindLogic logic={insightLogic} props={insightProps}>
            <div className="insights-container" data-attr="insight-view">
                <InsightContainer
                    insightMode={ItemMode.Sharing}
                    disableCorrelationTable
                    disableHeader
                    disableLastComputation
                    disableTable
                />
            </div>
        </BindLogic>
    )
}

export default Node.create({
    name: 'posthogInsight',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            count: {
                default: 0,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'ph-insight',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['ph-insight', mergeAttributes(HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(Component)
    },
})
