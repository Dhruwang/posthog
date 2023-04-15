import { Card } from 'antd'
import { ExportRunType } from './types'
import { AppMetricsGraph } from 'scenes/apps/AppMetricsGraph'
import { AppMetricsTab } from 'scenes/apps/appMetricsSceneLogic'
import { ErrorsOverview, MetricsOverview } from 'scenes/apps/MetricsTab'

export function ExportRun({ exportRun }: { exportRun: ExportRunType }): JSX.Element {
    return (
        <div className="mt-4 mb-4 mr-8">
            <Card title="Overview">
                <MetricsOverview
                    tab={AppMetricsTab.BatchExport}
                    metrics={exportRun.metrics ?? null}
                    metricsLoading={false}
                    exportDuration={exportRun.duration}
                    exportFailureReason={exportRun.failure_reason}
                />
            </Card>
            <Card title="Delivery trends" className="mt-4">
                <AppMetricsGraph
                    tab={AppMetricsTab.BatchExport}
                    metrics={exportRun.metrics ?? null}
                    metricsLoading={false}
                />
            </Card>

            <Card title="Errors" className="mt-4">
                <ErrorsOverview
                    errors={exportRun.errors || []}
                    loading={false}
                    category="exportEvents"
                    jobId={exportRun.id}
                    openErrorDetailsModal={() => {}} // TODO: implement this
                />
            </Card>
        </div>
    )
}
