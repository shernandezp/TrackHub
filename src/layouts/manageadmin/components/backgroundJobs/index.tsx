/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import { useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import TableBase from "controls/Tables/Table";
import TableAccordionBase from "controls/Accordions/TableAccordion";
import ArgonTypographyBase from "components/ArgonTypography";
import { getAccountByUser } from "api/manager/accounts";
import { getBackgroundJobRuns } from "api/manager/backgroundJobs";
import type { BackgroundJobRun } from "api/manager/backgroundJobs";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface TableColumn { name: string; title?: string; align?: string; }
type TableRow = Record<string, ReactNode>;
interface TableProps { columns: TableColumn[]; rows: TableRow[]; selectedField?: string; }
const Table = TableBase as unknown as (props: TableProps) => ReactNode;
interface TableAccordionProps { title: string; expanded: boolean; setExpanded: (expanded: boolean) => void; children?: ReactNode; }
const TableAccordion = TableAccordionBase as unknown as (props: TableAccordionProps) => ReactNode;
interface ArgonTypographyProps { variant?: string; color?: string; fontWeight?: string; children?: ReactNode; }
const ArgonTypography = ArgonTypographyBase as unknown as (props: ArgonTypographyProps) => ReactNode;

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

function ManageBackgroundJobs() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [jobs, setJobs] = useState<BackgroundJobRun[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (!expanded || loaded.current) return;
    loaded.current = true;

    async function loadJobs() {
      setLoading(true);
      try {
        const account = await getAccountByUser();
        if (!account?.accountId) return;
        const items = await getBackgroundJobRuns(account.accountId);
        setJobs(items || []);
      } catch (error) {
        notifyApiError(error);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [expanded]);

  return (
    <TableAccordion title={t('backgroundJobs.title')} expanded={expanded} setExpanded={setExpanded}>
      <Table
        columns={[
          { name: 'job', title: t('backgroundJobs.job'), align: 'left' },
          { name: 'status', title: t('backgroundJobs.status'), align: 'center' },
          { name: 'attempts', title: t('backgroundJobs.attempts'), align: 'center' },
          { name: 'started', title: t('backgroundJobs.startedAt'), align: 'center' },
          { name: 'id' }
        ]}
        rows={jobs.map(item => ({
          job: <TextCell>{item.jobKey}</TextCell>,
          status: <TextCell>{item.status}</TextCell>,
          attempts: <TextCell>{item.attempts}</TextCell>,
          started: <TextCell>{formatDateTime(item.startedAt)}</TextCell>,
          id: item.backgroundJobRunId
        }))}
        selectedField="job"
      />
    </TableAccordion>
  );
}

export default ManageBackgroundJobs;
