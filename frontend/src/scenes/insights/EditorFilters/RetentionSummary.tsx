import { useActions, useValues } from 'kea'
import { InfoCircleOutlined } from '@ant-design/icons'
import {
    dateOptionPlurals,
    dateOptions,
    retentionOptionDescriptions,
    retentionOptions,
} from 'scenes/retention/constants'
import { FilterType, EditorFilterProps, RetentionType } from '~/types'
import { IconOpenInNew } from 'lib/lemon-ui/icons'
import { ActionFilter } from '../filters/ActionFilter/ActionFilter'
import { Tooltip } from 'lib/lemon-ui/Tooltip'
import { AggregationSelect } from 'scenes/insights/filters/AggregationSelect'
import { groupsModel } from '~/models/groupsModel'
import { MathAvailability } from '../filters/ActionFilter/ActionFilterRow/ActionFilterRow'
import { Link } from 'lib/lemon-ui/Link'
import { LemonInput, LemonSelect } from '@posthog/lemon-ui'
import { insightVizDataLogic } from 'scenes/insights/insightVizDataLogic'

export function RetentionSummary({ insightProps }: EditorFilterProps): JSX.Element {
    const { showGroupsOptions } = useValues(groupsModel)
    const { retentionFilter } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))
    const { target_entity, returning_entity, retention_type, total_intervals, period } = retentionFilter || {}

    return (
        <div className="space-y-2" data-attr="retention-summary">
            <div className="flex items-center">
                Show
                {showGroupsOptions ? (
                    <AggregationSelect className="mx-2" insightProps={insightProps} hogqlAvailable={false} />
                ) : (
                    <b> Unique users </b>
                )}
                who performed
            </div>
            <div className="flex items-center">
                event or action
                <ActionFilter
                    entitiesLimit={1}
                    mathAvailability={MathAvailability.None}
                    hideFilter
                    hideRename
                    buttonCopy="Add graph series"
                    filters={{ events: [target_entity] } as FilterType} // retention filters use target and returning entity instead of events
                    setFilters={(newFilters: FilterType) => {
                        if (newFilters.events && newFilters.events.length > 0) {
                            updateInsightFilter({ target_entity: newFilters.events[0] })
                        } else if (newFilters.actions && newFilters.actions.length > 0) {
                            updateInsightFilter({ target_entity: newFilters.actions[0] })
                        } else {
                            updateInsightFilter({ target_entity: undefined })
                        }
                    }}
                    typeKey="retention-table"
                />
                <LemonSelect
                    options={Object.entries(retentionOptions).map(([key, value]) => ({
                        label: value,
                        value: key,
                        element: (
                            <>
                                {value}
                                <Tooltip placement="right" title={retentionOptionDescriptions[key]}>
                                    <InfoCircleOutlined className="info-indicator" />
                                </Tooltip>
                            </>
                        ),
                    }))}
                    value={retention_type ? retentionOptions[retention_type] : undefined}
                    onChange={(value): void => updateInsightFilter({ retention_type: value as RetentionType })}
                    dropdownMatchSelectWidth={false}
                />
            </div>
            <div className="flex items-center">
                in the last
                <LemonInput
                    type="number"
                    className="ml-2 w-20"
                    value={(total_intervals ?? 11) - 1}
                    onChange={(value) => updateInsightFilter({ total_intervals: (value || 0) + 1 })}
                />
                <LemonSelect
                    className="mx-2"
                    value={period}
                    onChange={(value): void => updateInsightFilter({ period: value ? value : undefined })}
                    options={dateOptions.map((period) => ({
                        value: period,
                        label: dateOptionPlurals[period] || period,
                    }))}
                    dropdownMatchSelectWidth={false}
                />
                and then came back to perform
            </div>
            <div className="flex items-center">
                event or action
                <ActionFilter
                    entitiesLimit={1}
                    mathAvailability={MathAvailability.None}
                    hideFilter
                    hideRename
                    buttonCopy="Add graph series"
                    filters={{ events: [returning_entity] } as FilterType}
                    setFilters={(newFilters: FilterType) => {
                        if (newFilters.events && newFilters.events.length > 0) {
                            updateInsightFilter({ returning_entity: newFilters.events[0] })
                        } else if (newFilters.actions && newFilters.actions.length > 0) {
                            updateInsightFilter({ returning_entity: newFilters.actions[0] })
                        } else {
                            updateInsightFilter({ returning_entity: undefined })
                        }
                    }}
                    typeKey="retention-table-returning"
                />
                on any of the next {dateOptionPlurals[period ?? 'Day']}.
            </div>
            <div>
                <p className="text-muted mt-4">
                    Want to learn more about retention?{' '}
                    <Link
                        to="https://posthog.com/docs/features/retention?utm_campaign=learn-more-horizontal&utm_medium=in-product"
                        target="_blank"
                        className="inline-flex items-center"
                    >
                        Go to docs
                        <IconOpenInNew className="ml-2" />
                    </Link>
                </p>
            </div>
        </div>
    )
}
