import { actions, kea, key, path, props, propsChanged, reducers, selectors } from 'kea'
import type { dataTableLogicType } from './dataTableLogicType'
import { DataTableNode, DataTableStringColumn } from '~/queries/schema'
import { defaultDataTableColumns } from './defaults'
import { sortedKeys } from 'lib/utils'

export interface DataTableLogicProps {
    key: string
    query: DataTableNode
    defaultColumns?: DataTableStringColumn[]
}

export const dataTableLogic = kea<dataTableLogicType>([
    props({} as DataTableLogicProps),
    key((props) => props.key),
    path(['queries', 'nodes', 'DataTable', 'dataTableLogic']),
    actions({ setColumns: (columns: DataTableStringColumn[]) => ({ columns }) }),
    reducers(({ props }) => ({
        columns: [
            (props.query.columns ??
                props.defaultColumns ??
                defaultDataTableColumns(props.query.source)) as DataTableStringColumn[],
            { setColumns: (_, { columns }) => columns },
        ],
    })),
    selectors({
        queryWithDefaults: [
            (s) => [(_, props) => props.query, s.columns],
            (query: DataTableNode, columns): Required<DataTableNode> => {
                const { kind, columns: _columns, source, ...rest } = query
                return {
                    kind,
                    columns: columns,
                    source,
                    ...sortedKeys({
                        ...rest,
                        expandable: query.expandable ?? true,
                        propertiesViaUrl: query.propertiesViaUrl ?? false,
                        showPropertyFilter: query.showPropertyFilter ?? false,
                        showEventFilter: query.showEventFilter ?? false,
                        showSearch: query.showSearch ?? false,
                        showActions: query.showActions ?? true,
                        showExport: query.showExport ?? false,
                        showReload: query.showReload ?? false,
                        showColumnConfigurator: query.showColumnConfigurator ?? false,
                        showEventsBufferWarning: query.showEventsBufferWarning ?? false,
                    }),
                }
            },
        ],
    }),
    propsChanged(({ actions, props }, oldProps) => {
        const newColumns = props.query.columns ?? props.defaultColumns ?? defaultDataTableColumns(props.query.source)
        const oldColumns =
            oldProps.query.columns ?? oldProps.defaultColumns ?? defaultDataTableColumns(oldProps.query.source)
        if (JSON.stringify(newColumns) !== JSON.stringify(oldColumns)) {
            actions.setColumns(newColumns)
        }
    }),
])
